#pragma once

#include <memory>
#include <string>

namespace photo_print {

class Printer {
public:
  virtual ~Printer() = default;

  /// Returns a JSON array of PrinterInfo objects.
  virtual std::string getPrinters() = 0;
};

/// Create the platform-specific Printer implementation.
std::unique_ptr<Printer> create_printer();

} // namespace photo_print
