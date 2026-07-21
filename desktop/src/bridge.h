#pragma once

#include "printer.h"
#include "webview/webview.h"

#include <memory>

namespace photo_print {

class Bridge {
public:
  Bridge(webview::webview& w, std::unique_ptr<Printer> printer);

private:
  std::unique_ptr<Printer> m_printer;
};

} // namespace photo_print
