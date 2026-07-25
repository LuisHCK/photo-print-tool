#include "printer.h"

#include <nlohmann/json.hpp>

#include <string>

using json = nlohmann::json;

namespace photo_print {

namespace {

// Stub — Linux WebKitGTK PDF generation + CUPS print submission not yet implemented.
// Will use:
//   1. Offscreen WebKitWebView → load HTML
//   2. WebKitPrintOperation with GtkPrintSettings set to print-to-PDF
//   3. cupsPrintFile() to submit the resulting PDF

} // anonymous namespace

class LinuxPrinter : public Printer {
public:
  std::string getPrinters() override {
    return json::array().dump();
  }

  std::string print(const std::string& /*jsonOptions*/) override {
    return json{
      {"jobId", ""},
      {"status", "failed"},
      {"error", "Linux native printing not yet implemented"}
    }.dump();
  }
};

std::unique_ptr<Printer> create_printer() {
  return std::make_unique<LinuxPrinter>();
}

} // namespace photo_print
