#pragma once

#include <string>
#include <utility>
#include <vector>

namespace photo_print {

struct JobSettings {
  std::string printerId;
  std::string colorMode = "color";  // "color" | "grayscale"
  int qualityDpi = 300;
  std::string qualityResolution;    // PPD Resolution choice, e.g. "720x720dpi"
  std::string qualityModeOption;    // PPD quality option keyword, e.g. "EPIJ_Qual"
  std::string qualityModeId;        // PPD quality choice, e.g. "307"
  std::string paperSizeId;          // PWG media name
  std::string mediaType;            // PPD MediaType choice
  int copies = 1;
};

/// Translate the UI settings into the CUPS job options for the destination,
/// validated against its PPD and including the vendor companion options
/// (e.g. Epson EPIJ_*) a raw CUPS job needs for quality settings to apply.
std::vector<std::pair<std::string, std::string>> build_job_options(
    const JobSettings& settings);

} // namespace photo_print
