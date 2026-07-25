#include "printer.h"

#include <nlohmann/json.hpp>

#include <string>

using json = nlohmann::json;

namespace photo_print {

namespace {

// Stub — Win32 WebView2 PDF generation + print submission not yet implemented.
// Will use:
//   1. Offscreen ICoreWebView2 → NavigateToString() → PrintToPdfStream()
//   2. Win32 OpenPrinter() + StartDocPrinter() + WritePrinter() with RAW PDF

} // anonymous namespace

class WinPrinter : public Printer {
public:
  std::string getPrinters() override {
    return json::array().dump();
  }

  std::string print(const std::string& /*jsonOptions*/) override {
    return json{
      {"jobId", ""},
      {"status", "failed"},
      {"error", "Windows native printing not yet implemented"}
    }.dump();
  }
};

std::unique_ptr<Printer> create_printer() {
  return std::make_unique<WinPrinter>();
}

} // namespace photo_print
