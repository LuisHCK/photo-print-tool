#include "printer.h"

#include <nlohmann/json.hpp>

#include <cups/cups.h>
#include <cups/pwg.h>

#import <WebKit/WebKit.h>

#include <cmath>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

using json = nlohmann::json;

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

// --- MacPrinter ---

class MacPrinter : public Printer {
public:
  std::string getPrinters() override;
  std::string print(const std::string& jsonOptions) override;

private:
  json collectPapers(http_t* http, cups_dest_t* dest, cups_dinfo_t* dinfo);
  json collectQualities(http_t* http, cups_dest_t* dest, cups_dinfo_t* dinfo);
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
      p["paperTypes"] = json::array();
      p["supportsColor"] = false;
      p["supportsGrayscale"] = false;
      printers.push_back(std::move(p));
      continue;
    }

    json papers = collectPapers(http, dest, dinfo.get());
    json qualities = collectQualities(http, dest, dinfo.get());
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
  std::string mediaType = opts.value("mediaType", "");

  NSLog(@"[MacPrinter::print] printerId=%s copies=%d colorMode=%s qualityDpi=%d mediaType=%s",
        printerId.c_str(), copies, colorMode.c_str(), qualityDpi, mediaType.c_str());
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
        (int)MIN(pageHtml.size(), 200), pageHtml.c_str());
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

  // Build CUPS job options from the frontend settings
  std::vector<cups_option_t> cupsOpts;

  auto add_opt = [&](const std::string& name, const std::string& value) {
    cups_option_t o;
    o.name = strdup(name.c_str());
    o.value = strdup(value.c_str());
    cupsOpts.push_back(o);
  };

  add_opt("ColorModel", (colorMode == "grayscale") ? "Gray" : "RGB");

  std::string qualityStr;
  if (qualityDpi <= 150)       qualityStr = "Draft";
  else if (qualityDpi <= 300)  qualityStr = "Normal";
  else                         qualityStr = "High";
  add_opt("cupsPrintQuality", qualityStr);

  if (!mediaType.empty()) {
    add_opt("MediaType", mediaType);
  }

  const char *printer = printerId.c_str();
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

json MacPrinter::collectMediaTypes(http_t* http, cups_dest_t* dest,
                                    cups_dinfo_t* dinfo) {
  json media_types = json::array();

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
        media_types.push_back({{"id", raw_id}});
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
