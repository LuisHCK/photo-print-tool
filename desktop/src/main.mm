#include "webview/webview.h"
#include "bridge.h"
#include "printer.h"

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <string>

// ---------------------------------------------------------------------------
// Private API forward declaration for WebKit developer extras
// ---------------------------------------------------------------------------
@interface WKWebView (PrivateDevTools)
- (BOOL)_developerExtrasEnabled;
- (void)_setDeveloperExtrasEnabled:(BOOL)enabled;
@end

// ---------------------------------------------------------------------------
// Menu handler — receives menu actions and dispatches to the webview
// ---------------------------------------------------------------------------
@interface MenuHandler : NSObject
@property (nonatomic, assign) webview::webview* webview;
@end

@implementation MenuHandler

- (void)reload:(id)sender {
  self.webview->eval("location.reload()");
}

- (void)toggleDevTools:(id)sender {
  auto wv_result = self.webview->browser_controller();
  if (!wv_result.ok()) {
    return;
  }
  WKWebView* wv = (__bridge WKWebView*)wv_result.value();
  BOOL enabled = [wv _developerExtrasEnabled];
  [wv _setDeveloperExtrasEnabled:!enabled];
}

@end

static MenuHandler* g_menu_handler = nil;

// ---------------------------------------------------------------------------
// Resolve the path to dist/index.html
// Strategy: PHOTO_PRINT_DIST env var → relative to binary → cwd fallback
// ---------------------------------------------------------------------------
static std::string resolve_dist_path(const char* argv0) {
  if (const char* env = std::getenv("PHOTO_PRINT_DIST")) {
    return env;
  }

  auto binary_dir = std::filesystem::path(argv0).parent_path();

  auto candidates = {
      binary_dir / "../../../dist/index.html",            // dev: desktop/build/
      binary_dir / "../../dist/index.html",                // .app bundle: MacOS/
      std::filesystem::path("dist/index.html"),            // cwd fallback
  };

  for (auto& p : candidates) {
    auto abs = std::filesystem::absolute(p);
    if (std::filesystem::exists(abs)) {
      return abs.string();
    }
  }

  return {};
}

// ---------------------------------------------------------------------------
// Navigate the webview to a URL or local file
// ---------------------------------------------------------------------------
static void navigate_to(webview::webview& w, const std::string& url) {
  auto wv_result = w.browser_controller();
  if (!wv_result.ok()) {
    std::cerr << "Failed to get WKWebView" << std::endl;
    return;
  }
  WKWebView* webview = (__bridge WKWebView*)wv_result.value();

  NSString* ns_url = [NSString stringWithUTF8String:url.c_str()];

  if (url.rfind("http://", 0) == 0 || url.rfind("https://", 0) == 0) {
    // HTTP(S) — use standard navigation
    NSURL* nsurl = [NSURL URLWithString:ns_url];
    NSURLRequest* req = [NSURLRequest requestWithURL:nsurl];
    [webview loadRequest:req];
  } else {
    // File path — use loadFileURL:allowingReadAccessToURL:
    NSURL* file_url = [NSURL fileURLWithPath:ns_url];
    NSURL* read_access_url = [file_url URLByDeletingLastPathComponent];
    [webview loadFileURL:file_url allowingReadAccessToURL:read_access_url];
  }
}

// ---------------------------------------------------------------------------
// Build the macOS menu bar
// ---------------------------------------------------------------------------
static void setup_menu_bar(webview::webview* w) {
  @autoreleasepool {
    NSApplication* app = NSApp;
    if (!app) app = [NSApplication sharedApplication];

    g_menu_handler = [[MenuHandler alloc] init];
    g_menu_handler.webview = w;

    NSMenu* menubar = [[NSMenu alloc] init];

    // ── App menu (Photo Print Tool) ──────────────────────────────────
    {
      NSMenuItem* appItem = [[NSMenuItem alloc] init];
      NSMenu* sub = [[NSMenu alloc] init];
      [sub addItemWithTitle:@"Quit Photo Print Tool"
                     action:@selector(terminate:)
              keyEquivalent:@"q"];
      appItem.submenu = sub;
      [menubar addItem:appItem];
    }

    // ── File menu ───────────────────────────────────────────────────
    {
      NSMenuItem* item = [[NSMenuItem alloc] init];
      NSMenu* sub = [[NSMenu alloc] init];
      [sub addItemWithTitle:@"Print…" action:@selector(print:) keyEquivalent:@"p"];
      item.submenu = sub;
      [menubar addItem:item];
    }

    // ── Edit menu ───────────────────────────────────────────────────
    {
      NSMenuItem* item = [[NSMenuItem alloc] init];
      NSMenu* sub = [[NSMenu alloc] init];
      [sub addItemWithTitle:@"Undo" action:@selector(undo:) keyEquivalent:@"z"];
      [sub addItemWithTitle:@"Redo" action:@selector(redo:) keyEquivalent:@"Z"];
      [sub addItem:[NSMenuItem separatorItem]];
      [sub addItemWithTitle:@"Cut" action:@selector(cut:) keyEquivalent:@"x"];
      [sub addItemWithTitle:@"Copy" action:@selector(copy:) keyEquivalent:@"c"];
      [sub addItemWithTitle:@"Paste" action:@selector(paste:) keyEquivalent:@"v"];
      item.submenu = sub;
      [menubar addItem:item];
    }

    // ── View menu ───────────────────────────────────────────────────
    {
      NSMenuItem* item = [[NSMenuItem alloc] init];
      NSMenu* sub = [[NSMenu alloc] init];

      auto* reload = [[NSMenuItem alloc] initWithTitle:@"Reload"
                                                action:@selector(reload:)
                                         keyEquivalent:@"r"];
      reload.target = g_menu_handler;
      [sub addItem:reload];

      [sub addItem:[NSMenuItem separatorItem]];

      auto* devtools = [[NSMenuItem alloc] initWithTitle:@"Toggle Developer Tools"
                                                  action:@selector(toggleDevTools:)
                                           keyEquivalent:@"i"];
      devtools.keyEquivalentModifierMask =
          NSEventModifierFlagCommand | NSEventModifierFlagOption;
      devtools.target = g_menu_handler;
      [sub addItem:devtools];

      item.submenu = sub;
      [menubar addItem:item];
    }

    app.mainMenu = menubar;
  }
}

// ---------------------------------------------------------------------------
// Entry point
//
// Usage:
//   photo-print                  — load from dist/index.html
//   photo-print <url>            — load from the given URL
// ---------------------------------------------------------------------------
int main(int argc, char* argv[]) {
  @autoreleasepool {
    try {
      webview::webview w(true, nullptr);
      w.set_title("Photo Print Tool");
      w.set_size(1400, 900, WEBVIEW_HINT_NONE);

      setup_menu_bar(&w);

      photo_print::Bridge bridge(w, photo_print::create_printer());

      if (argc > 1) {
        // URL provided as first argument — dev mode
        navigate_to(w, argv[1]);
      } else {
        // Load from dist/index.html
        auto dist_path = resolve_dist_path(argv[0]);
        if (dist_path.empty()) {
          std::cerr << "dist/index.html not found. Set PHOTO_PRINT_DIST or "
                       "run from the project root."
                    << std::endl;
          return 1;
        }
        navigate_to(w, dist_path);
      }

      w.run();
      return 0;
    } catch (const webview::exception& e) {
      std::cerr << e.what() << std::endl;
      return 1;
    }
  }
}
