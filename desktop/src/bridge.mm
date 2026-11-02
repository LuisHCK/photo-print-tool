#include "bridge.h"

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import <cups/cups.h>

#include <cerrno>
#include <cstring>
#include <nlohmann/json.hpp>
#include <sys/stat.h>
#include <unistd.h>

using json = nlohmann::json;

// Associated-object keys
static const void *kHandlerKey    = &kHandlerKey;
static const void *kPrinterIdKey  = &kPrinterIdKey;
static const void *kCopiesKey     = &kCopiesKey;
static const void *kColorModeKey  = &kColorModeKey;
static const void *kQualityDpiKey = &kQualityDpiKey;
static const void *kMediaTypeKey  = &kMediaTypeKey;

// ---------------------------------------------------------------------------
// PrintHandler — owns an offscreen WKWebView and chains:
//   loadHTML → didFinishNavigation → createPDF → PDF callback → cupsPrintFile
// ---------------------------------------------------------------------------
@interface PrintHandler : NSObject <WKNavigationDelegate>

@property (nonatomic, retain) WKWebView *webView;
@property (nonatomic, copy) NSString *printId;
@property (nonatomic, assign) webview::webview *webviewRef;

- (instancetype)initWithWebview:(webview::webview *)w
                        printId:(const std::string &)id;

- (void)startWithHTML:(const std::string &)html
              widthMm:(double)widthMm
             heightMm:(double)heightMm
            printerId:(const std::string &)printerId
               copies:(int)copies
            colorMode:(const std::string &)colorMode
           qualityDpi:(int)qualityDpi
            mediaType:(const std::string &)mediaType;

@end

@implementation PrintHandler

- (instancetype)initWithWebview:(webview::webview *)w
                        printId:(const std::string &)id {
  self = [super init];
  if (self) {
    _webviewRef = w;
    _printId = [[NSString alloc] initWithUTF8String:id.c_str()];
  }
  return self;
}

- (void)dealloc {
  [_printId release];
  [_webView release];
  [super dealloc];
}

- (void)startWithHTML:(const std::string &)html
              widthMm:(double)widthMm
             heightMm:(double)heightMm
            printerId:(const std::string &)printerId
               copies:(int)copies
            colorMode:(const std::string &)colorMode
           qualityDpi:(int)qualityDpi
            mediaType:(const std::string &)mediaType {
  CGFloat pageWidthPt = widthMm * 72.0 / 25.4;
  CGFloat pageHeightPt = heightMm * 72.0 / 25.4;

  WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
  self.webView = [[WKWebView alloc] initWithFrame:CGRectMake(0, 0, pageWidthPt, pageHeightPt)
                                    configuration:config];
  [config release];
  self.webView.navigationDelegate = self;

  // Keep the handler alive via associated object until the operation finishes.
  objc_setAssociatedObject(self.webView, kHandlerKey, self,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  // Attach CUPS options
  NSString *nsPrinterId = [[NSString alloc] initWithUTF8String:printerId.c_str()];
  NSString *nsColorMode = [[NSString alloc] initWithUTF8String:colorMode.c_str()];
  NSString *nsMediaType = [[NSString alloc] initWithUTF8String:mediaType.c_str()];
  NSNumber *nsCopies = [[NSNumber alloc] initWithInt:copies];
  NSNumber *nsQualityDpi = [[NSNumber alloc] initWithInt:qualityDpi];

  objc_setAssociatedObject(self.webView, kPrinterIdKey, nsPrinterId,
                           OBJC_ASSOCIATION_RETAIN);
  objc_setAssociatedObject(self.webView, kCopiesKey, nsCopies,
                           OBJC_ASSOCIATION_RETAIN);
  objc_setAssociatedObject(self.webView, kColorModeKey, nsColorMode,
                           OBJC_ASSOCIATION_RETAIN);
  objc_setAssociatedObject(self.webView, kQualityDpiKey, nsQualityDpi,
                           OBJC_ASSOCIATION_RETAIN);
  objc_setAssociatedObject(self.webView, kMediaTypeKey, nsMediaType,
                           OBJC_ASSOCIATION_RETAIN);

  [nsPrinterId release];
  [nsColorMode release];
  [nsMediaType release];
  [nsCopies release];
  [nsQualityDpi release];

  NSLog(@"[PrintHandler] loading HTML (len=%zu) into offscreen WKWebView…",
        html.size());
  NSString *nsHtml = [[NSString alloc] initWithUTF8String:html.c_str()];
  [self.webView loadHTMLString:nsHtml baseURL:[NSURL URLWithString:@"about:blank"]];
  [nsHtml release];
}

// -----------------------------------------------------------------------
#pragma mark - WKNavigationDelegate
// -----------------------------------------------------------------------

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
  NSLog(@"[PrintHandler] didFinishNavigation → generating PDF…");
  [self generatePDFFromWebView:webView];
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation
      withError:(NSError *)error {
  NSLog(@"[PrintHandler] didFailNavigation: %@", error);
  [self failWithError:[NSString stringWithFormat:@"Navigation failed: %@",
                        error.localizedDescription]];
}

- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation
      withError:(NSError *)error {
  NSLog(@"[PrintHandler] didFailProvisionalNavigation: %@", error);
  [self failWithError:[NSString stringWithFormat:@"Provisional navigation failed: %@",
                        error.localizedDescription]];
}

// -----------------------------------------------------------------------
#pragma mark - PDF / CUPS
// -----------------------------------------------------------------------

- (void)generatePDFFromWebView:(WKWebView *)webView {
  CGFloat w = webView.frame.size.width;
  CGFloat h = webView.frame.size.height;

  WKPDFConfiguration *pdfConfig = [[WKPDFConfiguration alloc] init];
  pdfConfig.rect = CGRectMake(0, 0, w, h);

  __block PrintHandler *blockSelf = self;
  [webView createPDFWithConfiguration:pdfConfig
                    completionHandler:^(NSData *data, NSError *error) {
    if (error) {
      NSLog(@"[PrintHandler] PDF generation error: %@", error);
      [blockSelf failWithError:[NSString stringWithFormat:
                                 @"PDF generation failed: %@",
                                 error.localizedDescription]];
      return;
    }
    if (!data || data.length == 0) {
      NSLog(@"[PrintHandler] PDF data is empty");
      [blockSelf failWithError:@"PDF generation returned no data"];
      return;
    }
    NSLog(@"[PrintHandler] PDF generated (%lu bytes)", (unsigned long)data.length);
    [blockSelf sendToPrinter:data webView:webView];
  }];

  [pdfConfig release];
}

- (void)sendToPrinter:(NSData *)pdfData webView:(WKWebView *)webView {
  // Retrieve CUPS options
  NSString *printerId = objc_getAssociatedObject(webView, kPrinterIdKey);
  NSString *colorMode = objc_getAssociatedObject(webView, kColorModeKey);
  int qualityDpi = [objc_getAssociatedObject(webView, kQualityDpiKey) intValue];
  NSString *mediaType = objc_getAssociatedObject(webView, kMediaTypeKey);

  // Write PDF to a temp file (CUPS daemon must be able to read it)
  NSString *tmpPath = [NSTemporaryDirectory() stringByAppendingPathComponent:
                         [NSString stringWithFormat:@"%@.pdf", [[NSUUID UUID] UUIDString]]];
  if (![pdfData writeToFile:tmpPath atomically:YES]) {
    [self failWithError:@"Failed to write temporary PDF"];
    return;
  }
  NSLog(@"[PrintHandler] temp file written: %s", [tmpPath UTF8String]);

  // Verify the file exists and is readable by CUPS daemon
  const char *cPath = [tmpPath fileSystemRepresentation];
  if (access(cPath, R_OK) != 0) {
    NSLog(@"[PrintHandler] ERROR: temp file not accessible: %s (errno=%d)", cPath, errno);
    [self failWithError:[NSString stringWithFormat:@"Temp file not accessible: %s",
                          strerror(errno)]];
    return;
  }
  // Make sure it's world-readable (CUPS daemon may run as _lp)
  chmod(cPath, 0644);

  // Build CUPS options
  std::vector<cups_option_t> cupsOpts;

  auto addOpt = [&](const std::string &name, const std::string &value) {
    cups_option_t o;
    o.name = strdup(name.c_str());
    o.value = strdup(value.c_str());
    cupsOpts.push_back(o);
  };

  addOpt("ColorModel", ([colorMode isEqualToString:@"grayscale"]) ? "Gray" : "RGB");

  std::string qualityStr;
  if (qualityDpi <= 150)       qualityStr = "Draft";
  else if (qualityDpi <= 300)  qualityStr = "Normal";
  else                         qualityStr = "High";
  addOpt("cupsPrintQuality", qualityStr);

  if (mediaType.length > 0) {
    addOpt("MediaType", [mediaType UTF8String]);
  }

  const char *printer = [printerId UTF8String];
  const char *filePath = [tmpPath fileSystemRepresentation];

  NSLog(@"[PrintHandler] calling cupsPrintFile(printer=%s)…", printer);
  int jobId = cupsPrintFile(printer, filePath, "Photo Print",
                             (int)cupsOpts.size(), cupsOpts.data());
  NSLog(@"[PrintHandler] cupsPrintFile returned jobId=%d", jobId);

  // Clean up
  [[NSFileManager defaultManager] removeItemAtPath:tmpPath error:nil];
  for (auto &o : cupsOpts) {
    free(o.name);
    free(o.value);
  }

  // Build result JSON
  json result;
  if (jobId > 0) {
    result["jobId"] = std::to_string(jobId);
    result["status"] = "queued";
    NSLog(@"[PrintHandler] success: jobId=%d", jobId);
  } else {
    ipp_status_t ippErr = cupsLastError();
    const char *errStr = cupsLastErrorString();
    NSLog(@"[PrintHandler] cupsPrintFile failed: jobId=%d ippError=%d (%s) systemErr=%d",
          jobId, ippErr, errStr ? errStr : "null", errno);
    result["jobId"] = "";
    result["status"] = "failed";
    result["error"] = errStr ? errStr : cupsGetOption("error", cupsOpts.size(), cupsOpts.data());
    result["ippStatus"] = ippErr;
  }

  [self finishWithResult:result];
}

- (void)finishWithResult:(const json &)result {
  _webviewRef->resolve(
      std::string([_printId UTF8String]), 0, result.dump());
  // Break retain cycle — handler will be deallocated
  objc_setAssociatedObject(_webView, kHandlerKey, nil,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)failWithError:(NSString *)message {
  NSLog(@"[PrintHandler] ERROR: %@", message);
  json err;
  err["jobId"] = "";
  err["status"] = "failed";
  err["error"] = [message UTF8String];
  [self finishWithResult:err];
}

@end

// ---------------------------------------------------------------------------
// Bridge C++ implementation
// ---------------------------------------------------------------------------

namespace photo_print {

Bridge::Bridge(webview::webview& w, std::unique_ptr<Printer> printer)
    : m_w(w), m_printer(std::move(printer)) {
  // Health-check: verify webview ↔ native bridge is alive
  w.bind("ping", [](const std::string& /*req*/) -> std::string {
    return "\"pong\"";
  });

  w.bind("getPrinters", [this](const std::string& /*req*/) -> std::string {
    return m_printer->getPrinters();
  });

  // Async print bind — uses offscreen WKWebView with callback chaining.
  // NOTE: avoid the name "print" — it collides with window.print, and
  // webview's onBind() throws for existing window properties.
  w.bind("printPhoto",
      [this](const std::string& id, const std::string& req, void* /*arg*/) {
    NSLog(@"[Bridge] async print bind called, id=%s", id.c_str());

    auto args = json::parse(req);
    auto opts = json::parse(args[0].get<std::string>());

    std::string pageHtml = opts["pageHtml"];
    double widthMm = opts["pageWidthMm"];
    double heightMm = opts["pageHeightMm"];
    std::string printerId = opts["printerId"];
    int copies = opts.value("copies", 1);
    std::string colorMode = opts.value("colorMode", "color");
    int qualityDpi = opts.value("qualityDpi", 300);
    std::string mediaType = opts.value("mediaType", "");

    NSLog(@"[Bridge] print: printer=%s copies=%d color=%s quality=%d",
          printerId.c_str(), copies, colorMode.c_str(), qualityDpi);

    PrintHandler *handler = [[PrintHandler alloc] initWithWebview:&m_w
                                                          printId:id];
    [handler startWithHTML:pageHtml
                   widthMm:widthMm
                  heightMm:heightMm
                 printerId:printerId
                    copies:copies
                 colorMode:colorMode
                qualityDpi:qualityDpi
                 mediaType:mediaType];
    [handler release];

    // The handler is kept alive by the associated object on the WKWebView
    // (set in startWithHTML:). It will be released when finishWithResult:
    // removes that association.
  }, nullptr);

  // Cancel print job by ID
  w.bind("cancelPrintJob", [this](const std::string& id, const std::string& req, void* /*arg*/) {
    auto args = json::parse(req);
    auto opts = json::parse(args[0].get<std::string>());
    std::string printerId = opts["printerId"];
    int jobId = opts["jobId"];

    ipp_status_t status = cupsCancelJob2(CUPS_HTTP_DEFAULT, printerId.c_str(), jobId, 0);
    json result;
    if (status == IPP_STATUS_OK) {
      result["status"] = "cancelled";
    } else {
      result["status"] = "failed";
      result["error"] = cupsLastErrorString();
    }
    m_w.resolve(id, 0, result.dump());
  }, nullptr);

  // Inject JS API so the frontend can call native functions via window.__native__
  w.init(R"(
    window.__native__ = {
      ping: () => window.__webview__.call("ping"),
      printer: {
        getPrinters: () => window.__webview__.call("getPrinters"),
        print: (opts) => window.__webview__.call("printPhoto", JSON.stringify(opts)),
        cancelPrintJob: (opts) => window.__webview__.call("cancelPrintJob", JSON.stringify(opts))
      }
    };
  )");
}

} // namespace photo_print
