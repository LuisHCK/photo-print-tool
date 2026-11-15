#include "printer.h"
#include "printer_macos.h"

#include <nlohmann/json.hpp>

#include <cups/cups.h>
#include <cups/ppd.h>
#include <cups/pwg.h>

#import <WebKit/WebKit.h>

#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <initializer_list>
#include <string>
#include <strings.h>
#include <utility>
#include <vector>

using json = nlohmann::json;

// CUPS' modern cupsCopyDestInfo API does not expose the PPD choice names and
// human-readable texts we need here (e.g. Resolution "720x720dpi", MediaType
// "Photo Paper Glossy"), so the deprecated PPD helpers are still used. Keep
// the warning suppression scoped to this file.
#pragma clang diagnostic ignored "-Wdeprecated-declarations"

// Offscreen WKWebView helper — must be at file scope (outside C++ namespace)
@interface PrintRenderer : NSObject <WKNavigationDelegate>
@property (nonatomic) BOOL navigationDone;
@end

@implementation PrintRenderer
- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
  NSLog(@"[PrintRenderer] didFinishNavigation");
  self.navigationDone = YES;
}
- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
  NSLog(@"[PrintRenderer] didFailNavigation: %@", error);
  self.navigationDone = YES;
}
- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error {
  NSLog(@"[PrintRenderer] didFailProvisionalNavigation: %@", error);
  self.navigationDone = YES;
}
@end

namespace photo_print {

namespace {

// --- Constants ---

constexpr int kCupsTimeoutMs = 5000;
constexpr double kHmmToInchesFactor = 2540.0;

// --- RAII wrappers for CUPS resources ---

struct CupsConnection {
  http_t* http = nullptr;

  CupsConnection() {
    char resource[256];
    http = cupsConnectDest(nullptr, CUPS_DEST_FLAGS_NONE,
                            kCupsTimeoutMs, nullptr, resource,
                            sizeof(resource), nullptr, nullptr);
  }

  ~CupsConnection() { if (http) httpClose(http); }

  CupsConnection(const CupsConnection&) = delete;
  CupsConnection& operator=(const CupsConnection&) = delete;

  operator http_t*() const { return http; }
  explicit operator bool() const { return http != nullptr; }
};

struct CupsDests {
  cups_dest_t* dests = nullptr;
  int count = 0;

  CupsDests(http_t* http) {
    count = cupsGetDests2(http ? http : CUPS_HTTP_DEFAULT, &dests);
  }

  ~CupsDests() { if (count > 0 && dests) cupsFreeDests(count, dests); }

  CupsDests(const CupsDests&) = delete;
  CupsDests& operator=(const CupsDests&) = delete;

  bool empty() const { return count <= 0 || !dests; }
  int size() const { return count; }
  cups_dest_t& operator[](int i) const { return dests[i]; }
  cups_dest_t* begin() const { return dests; }
  cups_dest_t* end() const { return dests + count; }
};

struct CupsDestInfo {
  cups_dinfo_t* dinfo = nullptr;

  CupsDestInfo(http_t* http, cups_dest_t* dest)
    : dinfo(cupsCopyDestInfo(http, dest)) {}

  ~CupsDestInfo() { if (dinfo) cupsFreeDestInfo(dinfo); }

  CupsDestInfo(const CupsDestInfo&) = delete;
  CupsDestInfo& operator=(const CupsDestInfo&) = delete;

  explicit operator bool() const { return dinfo != nullptr; }
  cups_dinfo_t* get() const { return dinfo; }
};

// --- Helpers ---

// CUPS measures in hundredths of mm; convert to whole mm
int hmm_to_mm(int v) { return v / 100; }

// Fallback quality presets when CUPS doesn't advertise any
void add_fallback_qualities(json& qualities) {
  qualities.push_back({{"dpi", 150}, {"name", "Draft"}});
  qualities.push_back({{"dpi", 300}, {"name", "Normal"}});
  qualities.push_back({{"dpi", 600}, {"name", "Best"}});
}

// Format inches vs mm for custom/unmapped paper sizes
std::string format_dimensions(int width_hmm, int length_hmm) {
  double w_in = width_hmm / kHmmToInchesFactor;
  double h_in = length_hmm / kHmmToInchesFactor;

  if (std::abs(w_in - std::round(w_in * 2.0) / 2.0) < 0.05 &&
      std::abs(h_in - std::round(h_in * 2.0) / 2.0) < 0.05) {
    char buf[32];
    snprintf(buf, sizeof(buf), "%.1f×%.1f in", w_in, h_in);
    return buf;
  }

  char buf[32];
  snprintf(buf, sizeof(buf), "%d×%d mm", hmm_to_mm(width_hmm), hmm_to_mm(length_hmm));
  return buf;
}

// --- Resolution helpers ---

struct ResolutionChoice {
  int x = 0;
  int y = 0;
  std::string value;  // PPD choice name, e.g. "720x720dpi"
};

// PPD resolution choices are named like "720x720dpi", "600dpi" or "1200dpi".
bool parse_resolution_option(const char* value, int* x, int* y) {
  if (!value || value[0] == '\0') return false;

  int parsed_x = 0;
  int parsed_y = 0;
  if (sscanf(value, "%dx%d", &parsed_x, &parsed_y) < 1 || parsed_x <= 0) {
    return false;
  }
  if (parsed_y <= 0) parsed_y = parsed_x;

  *x = parsed_x;
  *y = parsed_y;
  return true;
}

std::string format_resolution_option(int x, int y) {
  char buf[64];
  snprintf(buf, sizeof(buf), "%dx%ddpi", x, y);
  return buf;
}

std::string trim_text(const char* value) {
  if (!value) return {};
  std::string text(value);
  size_t first = text.find_first_not_of(" \t\r\n");
  if (first == std::string::npos) return {};
  size_t last = text.find_last_not_of(" \t\r\n");
  return text.substr(first, last - first + 1);
}

// Open the destination's PPD so we can read the driver's real option choices
// (Resolution, MediaType). cupsGetPPD2 is deprecated in favour of
// cupsCopyDestInfo, but the latter does not expose PPD choice names/texts.
ppd_file_t* open_printer_ppd(http_t* http, const char* printer) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  const char* path = cupsGetPPD2(http, printer);
  ppd_file_t* ppd = path ? ppdOpenFile(path) : nullptr;
#pragma clang diagnostic pop
  return ppd;
}

bool ppd_has_choice(ppd_file_t* ppd, const char* option, const char* choice) {
  return ppd && choice && choice[0] != '\0' &&
         ppdFindChoice(ppdFindOption(ppd, option), choice) != nullptr;
}

// Returns the first candidate that is a valid choice for `option`, or nullptr.
const char* ppd_first_choice(ppd_file_t* ppd, const char* option,
                             std::initializer_list<const char*> candidates) {
  for (const char* c : candidates) {
    if (ppd_has_choice(ppd, option, c)) return c;
  }
  return nullptr;
}

// Returns the choice whose human-readable text matches `text` (case-insensitive).
const char* ppd_choice_by_text(ppd_file_t* ppd, const char* option,
                               const char* text) {
  ppd_option_t* o = ppd ? ppdFindOption(ppd, option) : nullptr;
  if (!o) return nullptr;
  for (int i = 0; i < o->num_choices; ++i) {
    if (strcasecmp(trim_text(o->choices[i].text).c_str(), text) == 0) {
      return o->choices[i].choice;
    }
  }
  return nullptr;
}

// Resolve a human-readable paper name via localization or PWG lookup
std::string resolve_paper_display_name(http_t* http, cups_dest_t* dest,
                                        cups_dinfo_t* dinfo,
                                        cups_size_t& size) {
  const char* localized = cupsLocalizeDestMedia(
      http, dest, dinfo, CUPS_MEDIA_FLAGS_DEFAULT, &size);
  if (!localized || localized[0] == '\0' ||
      std::strcmp(localized, size.media) == 0) {
    localized = cupsLocalizeDestValue(http, dest, dinfo,
                                       CUPS_MEDIA, size.media);
  }

  if (localized && localized[0] != '\0' &&
      std::strcmp(localized, size.media) != 0) {
    return localized;
  }

  pwg_media_t* pwg = pwgMediaForPWG(size.media);
  if (!pwg) {
    pwg = pwgMediaForSize(size.width, size.length);
  }

  if (pwg && pwg->ppd && pwg->ppd[0] != '\0') return pwg->ppd;
  if (pwg && pwg->legacy && pwg->legacy[0] != '\0') return pwg->legacy;

  return format_dimensions(size.width, size.length);
}

} // anonymous namespace

std::vector<std::pair<std::string, std::string>> build_job_options(
    const JobSettings& settings) {
  std::vector<std::pair<std::string, std::string>> opts;
  auto add_opt = [&](const std::string& name, const std::string& value) {
    opts.emplace_back(name, value);
  };

  // Unlike the macOS print dialog (which applies the driver's presets), a raw
  // CUPS job only gets the options we send; everything else falls back to the
  // PPD defaults. Use the PPD to send valid choices and the companion options
  // vendor drivers need for a setting to take effect.
  CupsConnection http;
  ppd_file_t* ppd = open_printer_ppd(http ? http.http : CUPS_HTTP_DEFAULT,
                                     settings.printerId.c_str());

  const bool grayscale = settings.colorMode == "grayscale";
  add_opt("print-color-mode", grayscale ? CUPS_PRINT_COLOR_MODE_MONOCHROME
                                        : CUPS_PRINT_COLOR_MODE_COLOR);
  if (ppd && ppdFindOption(ppd, "ColorModel")) {
    const char* model = grayscale
        ? ppd_first_choice(ppd, "ColorModel", {"Gray", "Mono", "Grayscale", "KGray"})
        : ppd_first_choice(ppd, "ColorModel", {"RGB", "Color", "CMYK", "RGBW"});
    if (model) add_opt("ColorModel", model);
  } else if (!ppd) {
    add_opt("ColorModel", grayscale ? "Gray" : "RGB");
  }
  // Epson: the "Grayscale" option (EPIJ_Ink_) drives the ink selection.
  if (ppd_has_choice(ppd, "EPIJ_Ink_", grayscale ? "0" : "1")) {
    add_opt("EPIJ_Ink_", grayscale ? "0" : "1");
  }

  // This is the option that actually changes the print head resolution. The
  // old cupsPrintQuality value is not a PPD option on most drivers (and is not
  // present on the Epson PPD), so it was silently ignored and jobs stayed at
  // the driver default (often 360 dpi).
  if (!settings.qualityResolution.empty() &&
      (!ppd || ppd_has_choice(ppd, "Resolution", settings.qualityResolution.c_str()))) {
    add_opt("Resolution", settings.qualityResolution);
  } else {
    std::string qualityStr;
    if (settings.qualityDpi <= 150)      qualityStr = "3";
    else if (settings.qualityDpi <= 300) qualityStr = "4";
    else                                 qualityStr = "5";
    add_opt("print-quality", qualityStr);
  }

  // Driver-specific quality mode (Epson EPIJ_Qual, HP PrintQuality, ...).
  if (!settings.qualityModeOption.empty() && !settings.qualityModeId.empty()) {
    add_opt(settings.qualityModeOption, settings.qualityModeId);

    // Epson ignores EPIJ_Qual unless Mode is "Advanced"; the PPD default is
    // "Automatic", which prints at Standard quality (EPIJ_APri) regardless of
    // the selected quality - faster and lower resolution than requested.
    if (settings.qualityModeOption == "EPIJ_Qual") {
      const char* advanced = ppd_choice_by_text(ppd, "EPIJ_Mode", "Advanced");
      if (!advanced) advanced = ppd_first_choice(ppd, "EPIJ_Mode", {"3"});
      if (advanced) add_opt("EPIJ_Mode", advanced);

      // Match Epson's own presets (EPIJPrinterPreset): the rest of the set is
      // sent explicitly so no PPD default can override it, and the Automatic
      // priority is forced to "Quality" in case the mode is not honoured.
      if (ppd_has_choice(ppd, "EPIJ_Hori", "0")) add_opt("EPIJ_Hori", "0");
      if (const char* priority = ppd_choice_by_text(ppd, "EPIJ_APri", "Quality")) {
        add_opt("EPIJ_APri", priority);
      }
    }
  }

  if (!settings.paperSizeId.empty()) {
    // PWG media name, from cupsGetDestMediaByIndex (e.g.
    // "na_index-4x6_4x6in"). CUPS maps it to the driver's PageSize choice.
    add_opt("media", settings.paperSizeId);
  }

  if (settings.copies > 1) {
    add_opt("copies", std::to_string(settings.copies));
  }

  if (!settings.mediaType.empty()) {
    add_opt("MediaType", settings.mediaType);
    // Epson's filter selects the ink profile from EPIJ_Medi, not MediaType;
    // without it photo paper is printed with the plain-paper profile, which
    // looks washed out.
    if (ppd_has_choice(ppd, "EPIJ_Medi", settings.mediaType.c_str())) {
      add_opt("EPIJ_Medi", settings.mediaType);
    }
  }

  if (ppd) ppdClose(ppd);

  return opts;
}

// --- MacPrinter ---

class MacPrinter : public Printer {
public:
  std::string getPrinters() override;
  std::string print(const std::string& jsonOptions) override;

private:
  json collectPapers(http_t* http, cups_dest_t* dest, cups_dinfo_t* dinfo);
  json collectQualities(http_t* http, cups_dest_t* dest, cups_dinfo_t* dinfo);
  json collectQualityModes(http_t* http, cups_dest_t* dest);
  json collectMediaTypes(http_t* http, cups_dest_t* dest, cups_dinfo_t* dinfo);
};

std::string MacPrinter::getPrinters() {
  json printers = json::array();

  CupsConnection http;
  CupsDests dests(http);

  if (dests.empty()) {
    return printers.dump();
  }

  for (int i = 0; i < dests.size(); ++i) {
    cups_dest_t* dest = &dests[i];
    if (dest->instance) continue;

    json p;
    p["id"] = dest->name;
    p["name"] = dest->name;
    p["isDefault"] = dest->is_default != 0;

    CupsDestInfo dinfo(http, dest);
    if (!dinfo) {
      // No capability info available; emit printer with empty capability lists
      p["paperSizes"] = json::array();
      p["qualities"] = json::array();
      p["qualityModes"] = json::array();
      p["paperTypes"] = json::array();
      p["supportsColor"] = false;
      p["supportsGrayscale"] = false;
      printers.push_back(std::move(p));
      continue;
    }

    json papers = collectPapers(http, dest, dinfo.get());
    json qualities = collectQualities(http, dest, dinfo.get());
    json quality_modes = collectQualityModes(http, dest);
    json media_types = collectMediaTypes(http, dest, dinfo.get());

    bool supports_color = false;
    bool supports_grayscale = false;
    ipp_attribute_t* cattr = cupsFindDestSupported(
        http, dest, dinfo.get(), CUPS_PRINT_COLOR_MODE);
    if (cattr) {
      int ccount = ippGetCount(cattr);
      for (int j = 0; j < ccount; ++j) {
        const char* mode = ippGetString(cattr, j, nullptr);
        if (std::strcmp(mode, CUPS_PRINT_COLOR_MODE_COLOR) == 0) {
          supports_color = true;
        }
        if (std::strcmp(mode, CUPS_PRINT_COLOR_MODE_MONOCHROME) == 0) {
          supports_grayscale = true;
        }
      }
    }

    if (qualities.empty()) {
      add_fallback_qualities(qualities);
    }

    p["paperSizes"] = std::move(papers);
    p["qualities"] = std::move(qualities);
    p["qualityModes"] = std::move(quality_modes);
    p["paperTypes"] = std::move(media_types);
    p["supportsColor"] = supports_color;
    p["supportsGrayscale"] = supports_grayscale;

    printers.push_back(std::move(p));
  }

  return printers.dump();
}

std::string MacPrinter::print(const std::string& jsonOptions) {
  NSLog(@"[MacPrinter::print] entered, jsonOptions length=%zu", jsonOptions.size());

  auto opts = json::parse(jsonOptions);

  std::string pageHtml = opts["pageHtml"];
  double widthMm = opts["pageWidthMm"];
  double heightMm = opts["pageHeightMm"];
  std::string printerId = opts["printerId"];
  int copies = opts.value("copies", 1);
  std::string colorMode = opts.value("colorMode", "color");
  int qualityDpi = opts.value("qualityDpi", 300);
  std::string qualityResolution = opts.value("qualityResolution", "");
  std::string qualityModeOption = opts.value("qualityModeOption", "");
  std::string qualityModeId = opts.value("qualityModeId", "");
  std::string paperSizeId = opts.value("paperSizeId", "");
  std::string mediaType = opts.value("mediaType", "");

  NSLog(@"[MacPrinter::print] printerId=%s copies=%d colorMode=%s qualityDpi=%d resolution=%s qualityMode=%s:%s mediaType=%s paperSize=%s",
        printerId.c_str(), copies, colorMode.c_str(), qualityDpi,
        qualityResolution.c_str(), qualityModeOption.c_str(),
        qualityModeId.c_str(), mediaType.c_str(), paperSizeId.c_str());
  NSLog(@"[MacPrinter::print] pageWidthMm=%.1f pageHeightMm=%.1f pageHtml_len=%zu",
        widthMm, heightMm, pageHtml.size());

  CGFloat pageWidthPt = widthMm * 72.0 / 25.4;
  CGFloat pageHeightPt = heightMm * 72.0 / 25.4;

  // Offscreen WKWebView — creates a dedicated web process for rendering
  WKWebViewConfiguration *wkConfig = [[WKWebViewConfiguration alloc] init];
  PrintRenderer *renderer = [[PrintRenderer alloc] init];
  WKWebView *wkView = [[WKWebView alloc] initWithFrame:CGRectMake(0, 0, pageWidthPt, pageHeightPt)
                                          configuration:wkConfig];
  wkView.navigationDelegate = renderer;

  NSLog(@"[MacPrinter::print] loading HTML into offscreen WKWebView...");
  NSLog(@"[MacPrinter::print] HTML preview (first 200 chars): %.*s",
        (int)std::min<size_t>(pageHtml.size(), 200), pageHtml.c_str());
  NSString *nsHtml = [NSString stringWithUTF8String:pageHtml.c_str()];
  [wkView loadHTMLString:nsHtml baseURL:[NSURL URLWithString:@"about:blank"]];

  // Pump the run loop until the page finishes loading (with 10 second timeout)
  const int kNavTimeout = 100; // 100 * 0.1s = 10s
  for (int i = 0; i < kNavTimeout && !renderer.navigationDone; i++) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode
                             beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  if (!renderer.navigationDone) {
    NSLog(@"[MacPrinter::print] ERROR: WKWebView navigation timed out after 10s");
    return json{{"jobId", ""}, {"status", "failed"}, {"error", "WKWebView navigation timed out"}}.dump();
  }
  NSLog(@"[MacPrinter::print] WKWebView navigation done");

  // Generate PDF from the rendered page
  __block NSData *pdfData = nil;
  __block BOOL pdfDone = NO;

  WKPDFConfiguration *pdfConfig = [[WKPDFConfiguration alloc] init];
  pdfConfig.rect = CGRectMake(0, 0, pageWidthPt, pageHeightPt);
  NSLog(@"[MacPrinter::print] requesting PDF from WKWebView...");
  [wkView createPDFWithConfiguration:pdfConfig
                   completionHandler:^(NSData *data, NSError *error) {
    (void)error;
    pdfData = data;
    pdfDone = YES;
  }];

  while (!pdfDone) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode
                             beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  NSLog(@"[MacPrinter::print] PDF generated, size=%lu bytes", (unsigned long)pdfData.length);

  if (!pdfData) {
    NSLog(@"[MacPrinter::print] ERROR: PDF generation returned no data");
    return json{{"jobId", ""}, {"status", "failed"}, {"error", "PDF generation returned no data"}}.dump();
  }

  // Write PDF to a temporary file for CUPS
  NSString *tmpPath = [NSTemporaryDirectory() stringByAppendingPathComponent:
                         [NSString stringWithFormat:@"%@.pdf", [[NSUUID UUID] UUIDString]]];
  BOOL wrote = [pdfData writeToFile:tmpPath atomically:YES];
  if (!wrote) {
    NSLog(@"[MacPrinter::print] ERROR: failed to write temp PDF to %@", tmpPath);
    return json{{"jobId", ""}, {"status", "failed"}, {"error", "Failed to write temporary PDF"}}.dump();
  }
  NSLog(@"[MacPrinter::print] temp PDF written to %s", [tmpPath UTF8String]);

  JobSettings settings;
  settings.printerId = printerId;
  settings.colorMode = colorMode;
  settings.qualityDpi = qualityDpi;
  settings.qualityResolution = qualityResolution;
  settings.qualityModeOption = qualityModeOption;
  settings.qualityModeId = qualityModeId;
  settings.paperSizeId = paperSizeId;
  settings.mediaType = mediaType;
  settings.copies = copies;

  std::vector<cups_option_t> cupsOpts;
  for (const auto& kv : build_job_options(settings)) {
    cups_option_t o;
    o.name = strdup(kv.first.c_str());
    o.value = strdup(kv.second.c_str());
    cupsOpts.push_back(o);
  }

  const char *printer = printerId.c_str();

  for (const auto& o : cupsOpts) {
    NSLog(@"[MacPrinter::print] option %s=%s", o.name, o.value);
  }

  const char *filePath = [tmpPath fileSystemRepresentation];

  NSLog(@"[MacPrinter::print] calling cupsPrintFile(printer=%s, opts_count=%zu)...",
        printer, cupsOpts.size());
  int jobId = cupsPrintFile(printer, filePath, "Photo Print",
                             (int)cupsOpts.size(), cupsOpts.data());
  NSLog(@"[MacPrinter::print] cupsPrintFile returned jobId=%d", jobId);

  // Clean up
  [[NSFileManager defaultManager] removeItemAtPath:tmpPath error:nil];
  for (auto& o : cupsOpts) {
    free(o.name);
    free(o.value);
  }

  json result;
  if (jobId > 0) {
    result["jobId"] = std::to_string(jobId);
    result["status"] = "queued";
    NSLog(@"[MacPrinter::print] success, job queued with id %d", jobId);
  } else {
    result["jobId"] = "";
    result["status"] = "failed";
    const char* cupsErr = cupsLastErrorString();
    result["error"] = cupsErr;
    NSLog(@"[MacPrinter::print] ERROR: cupsPrintFile failed: %s", cupsErr);
  }
  return result.dump();
}

json MacPrinter::collectPapers(http_t* http, cups_dest_t* dest,
                                cups_dinfo_t* dinfo) {
  json papers = json::array();

  int media_count = cupsGetDestMediaCount(http, dest, dinfo,
                                           CUPS_MEDIA_FLAGS_DEFAULT);
  for (int j = 0; j < media_count; ++j) {
    cups_size_t size;
    if (!cupsGetDestMediaByIndex(http, dest, dinfo, j,
                                  CUPS_MEDIA_FLAGS_DEFAULT, &size)) {
      continue;
    }

    json paper;
    paper["id"] = size.media;
    paper["name"] = resolve_paper_display_name(http, dest, dinfo, size);
    paper["widthMm"] = hmm_to_mm(size.width);
    paper["heightMm"] = hmm_to_mm(size.length);
    papers.push_back(std::move(paper));
  }

  return papers;
}

json MacPrinter::collectQualities(http_t* http, cups_dest_t* dest,
                                   cups_dinfo_t* dinfo) {
  json qualities = json::array();
  std::vector<ResolutionChoice> resolutions;

  // The CUPS print dialog exposes the PPD "Resolution" option. Prefer it over
  // the coarse print-quality enum, because the enum only tells us
  // draft/normal/high - not the raster resolution the driver will actually use.
  if (ppd_file_t* ppd = open_printer_ppd(http, dest->name)) {
    if (ppd_option_t* option = ppdFindOption(ppd, "Resolution")) {
      for (int i = 0; i < option->num_choices; ++i) {
        int x = 0;
        int y = 0;
        if (parse_resolution_option(option->choices[i].choice, &x, &y)) {
          resolutions.push_back({x, y, option->choices[i].choice});
        }
      }
    }
    ppdClose(ppd);
  }

  // Driverless (IPP Everywhere/AirPrint) queues may only advertise
  // printer-resolution-supported.
  if (resolutions.empty()) {
    ipp_attribute_t* rattr = cupsFindDestSupported(
        http, dest, dinfo, "printer-resolution");
    if (rattr) {
      int rcount = ippGetCount(rattr);
      for (int j = 0; j < rcount; ++j) {
        int y = 0;
        ipp_res_t units = IPP_RES_PER_INCH;
        int x = ippGetResolution(rattr, j, &y, &units);
        if (x <= 0) continue;
        if (y <= 0) y = x;
        if (units == IPP_RES_PER_CM) {
          x = static_cast<int>(std::lround(x * 2.54));
          y = static_cast<int>(std::lround(y * 2.54));
        }
        resolutions.push_back({x, y, format_resolution_option(x, y)});
      }
    }
  }

  std::sort(resolutions.begin(), resolutions.end(),
            [](const ResolutionChoice& a, const ResolutionChoice& b) {
              return a.x == b.x ? a.y < b.y : a.x < b.x;
            });
  resolutions.erase(
      std::unique(resolutions.begin(), resolutions.end(),
                  [](const ResolutionChoice& a, const ResolutionChoice& b) {
                    return a.x == b.x && a.y == b.y;
                  }),
      resolutions.end());

  if (!resolutions.empty()) {
    for (size_t i = 0; i < resolutions.size(); ++i) {
      const char* name = "Normal";
      if (resolutions.size() > 1) {
        if (i == 0) name = "Draft";
        else if (i + 1 == resolutions.size()) name = "Best";
      }

      json q;
      q["dpi"] = resolutions[i].x;
      q["x"] = resolutions[i].x;
      q["y"] = resolutions[i].y;
      q["name"] = name;
      q["resolution"] = resolutions[i].value;
      qualities.push_back(std::move(q));
    }
    return qualities;
  }

  // Last resort: the generic print-quality enum. These do not carry a real
  // resolution, so only use them when the printer does not expose any.
  ipp_attribute_t* qattr = cupsFindDestSupported(
      http, dest, dinfo, CUPS_PRINT_QUALITY);
  if (!qattr) return qualities;

  int qcount = ippGetCount(qattr);
  for (int j = 0; j < qcount; ++j) {
    int val = ippGetInteger(qattr, j);
    json q;
    switch (val) {
      case IPP_QUALITY_DRAFT:  q["dpi"] = 150; q["name"] = "Draft"; break;
      case IPP_QUALITY_NORMAL: q["dpi"] = 300; q["name"] = "Normal"; break;
      case IPP_QUALITY_HIGH:   q["dpi"] = 600; q["name"] = "Best"; break;
      default:
        q["dpi"] = val;
        q["name"] = std::to_string(val);
        break;
    }
    qualities.push_back(std::move(q));
  }

  return qualities;
}

json MacPrinter::collectQualityModes(http_t* http, cups_dest_t* dest) {
  json modes = json::array();

  // Driver-specific quality modes (passes/dot size, distinct from resolution).
  // Epson exposes EPIJ_Qual ("Draft" … "Best Quality"), HP uses PrintQuality,
  // and many other PPDs use a plain Quality option.
  if (ppd_file_t* ppd = open_printer_ppd(http, dest->name)) {
    static const char* const kQualityOptionKeywords[] = {
        "PrintQuality", "EPIJ_Qual", "Quality"};
    for (const char* keyword : kQualityOptionKeywords) {
      ppd_option_t* option = ppdFindOption(ppd, keyword);
      if (!option || option->num_choices < 2) continue;

      for (int i = 0; i < option->num_choices; ++i) {
        const char* id = option->choices[i].choice;
        if (!id || id[0] == '\0') continue;

        json m;
        m["option"] = keyword;
        m["id"] = id;
        std::string text = trim_text(option->choices[i].text);
        m["name"] = text.empty() ? std::string(id) : text;
        if (std::strcmp(id, option->defchoice) == 0) m["isDefault"] = true;
        modes.push_back(std::move(m));
      }
      break;
    }
    ppdClose(ppd);
  }

  return modes;
}

json MacPrinter::collectMediaTypes(http_t* http, cups_dest_t* dest,
                                    cups_dinfo_t* dinfo) {  json media_types = json::array();

  // The PPD options carry the driver's human-readable media names, which the
  // raw media-type-supported values do not (they are numeric driver ids like
  // "145"). Names matter here: plain paper vs photo paper changes ink/color
  // handling significantly.
  if (ppd_file_t* ppd = open_printer_ppd(http, dest->name)) {
    if (ppd_option_t* option = ppdFindOption(ppd, "MediaType")) {
      for (int i = 0; i < option->num_choices; ++i) {
        const char* id = option->choices[i].choice;
        if (!id || id[0] == '\0') continue;

        json m;
        m["id"] = id;
        std::string text = trim_text(option->choices[i].text);
        if (!text.empty()) m["name"] = text;
        media_types.push_back(std::move(m));
      }
    }
    ppdClose(ppd);
  }

  if (!media_types.empty()) return media_types;

  ipp_attribute_t* tattr = cupsFindDestSupported(
      http, dest, dinfo, CUPS_MEDIA_TYPE);
  if (!tattr) {
    media_types.push_back({{"id", "stationery"}});
    return media_types;
  }

  int tcount = ippGetCount(tattr);
  ipp_tag_t ttag = ippGetValueTag(tattr);
  bool is_int = (ttag == IPP_TAG_INTEGER || ttag == IPP_TAG_ENUM);

  for (int j = 0; j < tcount; ++j) {
    if (is_int) {
      int v = ippGetInteger(tattr, j);
      media_types.push_back({{"id", std::to_string(v)}});
    } else {
      const char* raw_id = ippGetString(tattr, j, nullptr);
      if (raw_id && raw_id[0] != '\0') {
        json m = {{"id", raw_id}};
        const char* localized = cupsLocalizeDestValue(
            http, dest, dinfo, CUPS_MEDIA_TYPE, raw_id);
        if (localized && localized[0] != '\0' &&
            std::strcmp(localized, raw_id) != 0) {
          m["name"] = localized;
        }
        media_types.push_back(std::move(m));
      }
    }
  }

  if (media_types.empty()) {
    media_types.push_back({{"id", "stationery"}});
  }

  return media_types;
}

std::unique_ptr<Printer> create_printer() {
  return std::make_unique<MacPrinter>();
}

} // namespace photo_print
