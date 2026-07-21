#include "printer.h"

#include <nlohmann/json.hpp>

#include <cups/cups.h>
#include <cups/pwg.h>

#include <cmath>
#include <cstring>
#include <string>
#include <vector>

using json = nlohmann::json;

namespace photo_print {

namespace {

int hmm_to_mm(int v) { return v / 100; }

void add_fallback_qualities(json& qualities) {
  qualities.push_back({{"dpi", 150}, {"name", "Draft"}});
  qualities.push_back({{"dpi", 300}, {"name", "Normal"}});
  qualities.push_back({{"dpi", 600}, {"name", "Best"}});
}

// Optional helper to format inches vs mm for custom/unmapped paper sizes
std::string format_dimensions(int width_hmm, int length_hmm) {
  double w_in = width_hmm / 2540.0;
  double h_in = length_hmm / 2540.0;

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

} // namespace

class MacPrinter : public Printer {
public:
  std::string getPrinters() override;
};

std::string MacPrinter::getPrinters() {
  json printers = json::array();

  char resource[256];
  http_t* http = cupsConnectDest(nullptr, CUPS_DEST_FLAGS_NONE,
                                  5000, nullptr, resource,
                                  sizeof(resource), nullptr, nullptr);

  cups_dest_t* dests = nullptr;
  int num_dests = cupsGetDests2(http ? http : CUPS_HTTP_DEFAULT, &dests);

  if (num_dests <= 0 || !dests) {
    if (http) httpClose(http);
    return printers.dump();
  }

  for (int i = 0; i < num_dests; ++i) {
    cups_dest_t* dest = &dests[i];
    if (dest->instance) continue;

    json p;
    p["id"] = dest->name;
    p["name"] = dest->name;
    p["isDefault"] = dest->is_default ? true : false;

    cups_dinfo_t* dinfo = cupsCopyDestInfo(http, dest);

    json papers = json::array();
    json qualities = json::array();
    bool supports_color = false;
    bool supports_grayscale = false;

    if (dinfo) {
      // 1. Process Media / Paper Sizes
      int media_count = cupsGetDestMediaCount(
          http, dest, dinfo, CUPS_MEDIA_FLAGS_DEFAULT);
      if (media_count > 0) {
        for (int j = 0; j < media_count; ++j) {
          cups_size_t size;
          if (cupsGetDestMediaByIndex(
                  http, dest, dinfo, j,
                  CUPS_MEDIA_FLAGS_DEFAULT, &size)) {
            json paper;
            paper["id"] = size.media;

            std::string display_name;

            // Try CUPS localization strings
            const char* localized = cupsLocalizeDestMedia(
                http, dest, dinfo,
                CUPS_MEDIA_FLAGS_DEFAULT, &size);
            if (!localized || localized[0] == '\0' || std::strcmp(localized, size.media) == 0) {
              localized = cupsLocalizeDestValue(
                  http, dest, dinfo,
                  CUPS_MEDIA, size.media);
            }

            if (localized && localized[0] != '\0' && std::strcmp(localized, size.media) != 0) {
              display_name = localized;
            } else {
              // Fall back to CUPS built-in PWG media lookup
              pwg_media_t* pwg = pwgMediaForPWG(size.media);
              if (!pwg) {
                pwg = pwgMediaForSize(size.width, size.length);
              }

              if (pwg && pwg->ppd && pwg->ppd[0] != '\0') {
                display_name = pwg->ppd;
              } else if (pwg && pwg->legacy && pwg->legacy[0] != '\0') {
                display_name = pwg->legacy;
              } else {
                display_name = format_dimensions(size.width, size.length);
              }
            }

            paper["name"] = display_name;
            paper["widthMm"] = hmm_to_mm(size.width);
            paper["heightMm"] = hmm_to_mm(size.length);
            papers.push_back(std::move(paper));
          }
        }
      }

      // 2. Process Print Quality
      ipp_attribute_t* qattr = cupsFindDestSupported(
          http, dest, dinfo, CUPS_PRINT_QUALITY);
      if (qattr) {
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
      }

      // 3. Process Color Support
      ipp_attribute_t* cattr = cupsFindDestSupported(
          http, dest, dinfo, CUPS_PRINT_COLOR_MODE);
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

      cupsFreeDestInfo(dinfo);
    }

    if (qualities.empty()) {
      add_fallback_qualities(qualities);
    }

    p["paperSizes"] = std::move(papers);
    p["qualities"] = std::move(qualities);
    p["supportsColor"] = supports_color;
    p["supportsGrayscale"] = supports_grayscale;

    printers.push_back(std::move(p));
  }

  cupsFreeDests(num_dests, dests);
  if (http) httpClose(http);
  return printers.dump();
}

std::unique_ptr<Printer> create_printer() {
  return std::make_unique<MacPrinter>();
}

} // namespace photo_print