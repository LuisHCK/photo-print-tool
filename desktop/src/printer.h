#pragma once

#include <memory>
#include <string>

namespace photo_print {

/// Input schema for print():
///   {
///     "pageHtml": string,      // Self-contained HTML of one print page
///     "pageWidthMm": number,
///     "pageHeightMm": number,
///     "printerId": string,
///     "copies": number,
///     "colorMode": "color" | "grayscale",
///     "qualityDpi": number,
///     "mediaType": string      // optional
///   }
///
/// Output:
///   { "jobId": string, "status": "queued"|"failed", "error"?: string }

class Printer {
public:
  virtual ~Printer() = default;

  virtual std::string getPrinters() = 0;
  virtual std::string print(const std::string& jsonOptions) = 0;
};

/// Create the platform-specific Printer implementation.
std::unique_ptr<Printer> create_printer();

} // namespace photo_print
