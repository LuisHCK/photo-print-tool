#include "bridge.h"

namespace photo_print {

Bridge::Bridge(webview::webview& w, std::unique_ptr<Printer> printer)
    : m_printer(std::move(printer)) {
  w.bind("ping", [](const std::string& /*req*/) -> std::string {
    return "\"pong\"";
  });

  w.bind("getPrinters", [this](const std::string& /*req*/) -> std::string {
    return m_printer->getPrinters();
  });

  w.init(R"(
    window.__native__ = {
      ping: () => window.__webview__.call("ping"),
      printer: {
        getPrinters: () => window.__webview__.call("getPrinters")
      }
    };
  )");
}

} // namespace photo_print
