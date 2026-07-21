# 003 — Desktop Native Port (cpp-webview)

Replace the browser-based PWA print flow with a native desktop app using [webview/webview](https://github.com/webview/webview) — a minimal C++ library that wraps each platform's native webview engine (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux).

The goal is a single self-contained binary that loads the existing React UI and exposes a native printer API directly from C++, eliminating the browser print dialog entirely.

---

## Architecture

```
┌──────────────────────────────────────────────┐
│               Desktop Binary                  │
│  ┌────────────────────────────────────────┐  │
│  │         C++ Main (main.cpp)            │  │
│  │  - Create webview window               │  │
│  │  - Load dist/index.html                │  │
│  │  - Bind JS API: window.__native__      │  │
│  └────────────┬───────────────────────────┘  │
│               │ bind()                       │
│  ┌────────────▼───────────────────────────┐  │
│  │         Printer Bridge (bridge.cpp)    │  │
│  │  - getPrinters() → JSON                │  │
│  │  - print(data, settings) → result      │  │
│  └────────────┬───────────────────────────┘  │
│               │                               │
│  ┌────────────▼───────────────────────────┐  │
│  │  Platform Printer Implementation       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │ macOS    │ │ Windows  │ │ Linux  │ │  │
│  │  │ Printer  │ │ Printer  │ │ Printer│ │  │
│  │  │ .mm      │ │ .cpp     │ │ .cpp   │ │  │
│  │  └──────────┘ └──────────┘ └────────┘ │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
         ▲                    ▲
         │ file://dist/       │ IPC (bind)
         ▼                    ▼
┌──────────────────────────────────────────────┐
│         React Web UI (Vite + dist/)          │
│  - Shared codebase, minimal additions        │
│  - Detects window.__native__ at boot         │
│  - Shows native print panel when available   │
│  - Falls back to window.print() in PWA mode  │
└──────────────────────────────────────────────┘
```

---

## Directory structure

```
photo-print/
├── dist/                        # Vite build output (shared with web)
├── desktop/                     # NEW — all native code
│   ├── CMakeLists.txt           # Build configuration
│   ├── src/
│   │   ├── main.cpp             # Entry point, window creation
│   │   ├── bridge.cpp           # webview.bind() registrations
│   │   ├── bridge.h
│   │   ├── printer.h            # Cross-platform Printer interface
│   │   ├── printer_macos.mm     # macOS implementation
│   │   ├── printer_win.cpp      # Windows implementation
│   │   └── printer_linux.cpp    # Linux implementation

├── package.json                 # MODIFIED — add dev:desktop script
└── vite.config.ts               # MODIFIED — set base: './'
```

---

## Functional requirements

### FR1 — Window management
- Open a native window with title "Photo Print Tool"
- Default size 1400×900, minimum 1024×768
- Standard window chrome (close, minimize, maximize, resize)
- Application menu with File (Print, Quit), Edit (Undo, Redo, Cut, Copy, Paste), View (Reload, Toggle DevTools, Zoom In/Out)
- Load the app from `dist/index.html` relative to the binary path

### FR2 — Printer discovery
- Enumerate all installed printers on the system
- Return printer name, unique ID, and whether it's the default
- Return available paper sizes (name, dimensions in mm)
- Return available print qualities (DPI value + human-readable name)
- Return supported color modes (color / grayscale)
- Refresh printer list (re-enumerate on demand)

### FR3 — Direct printing
- Accept a print job with: rendered page data + printer settings
- Support these printer settings:
  - Target printer (by ID)
  - Paper size (by ID from printer's supported list)
  - Print quality (by DPI from printer's supported list)
  - Color mode (color / grayscale)
  - Copies
  - Orientation (portrait / landscape — must match app's current layout)
- Deliver the rendered page to the printer at native resolution
- Return job status (queued, printing, completed, failed)
- Support cancellation of in-progress jobs

### FR4 — Page rendering
- Accept the same HTML/CSS the app currently renders for `@media print`
- Render it to an image/PDF at the selected DPI
- The rendered output must match the existing `PrintPages` component layout exactly

### FR5 — Frontend integration
- Detect at boot whether the app is running natively (`window.__native__` exists)
- Show a condensed print panel (printer, paper type, quality, copies, print button) in the right sidebar when native
- Replace the browser `window.print()` call with the native print API
- Preserve the existing PWA print flow as fallback when running in browser

### FR6 — File picker
- Use the standard HTML `<input type="file">` — works natively in all webview engines
- No custom native file dialog needed unless we want multi-directory or drag-from-OS later

---

## Non-functional requirements

### NFR1 — Performance
- App cold start under 2 seconds on modern hardware
- Printer enumeration under 500ms
- Page rendering to print under 3 seconds for a typical 10-photo page at 300 DPI

### NFR2 — Cross-platform
- macOS 12+ (Apple Silicon + Intel)
- Windows 10+ (x64)
- Linux (GTK3 + WebKitGTK, x64)
- Single source tree with `#ifdef` / per-platform files for platform code

### NFR3 — Distribution
- Static-linked binary where possible (or list required system libraries)
- No external runtime dependencies beyond what ships with the OS
- macOS: `.app` bundle with code signing
- Windows: `.exe` with optional installer
- Linux: AppImage or static binary

### NFR4 — Developer experience
- `bun run dev:desktop` builds and launches the app
- Frontend hot-reload via Vite watch → rebuild `dist/` → relaunch
- Debug webview via DevTools toggle from the View menu

---

## Bridge API design

All communication between JS and C++ happens through `webview.bind()` — no RPC layer, no serialization beyond JSON.

### JS-side API (exposed on `window.__native__`)

```ts
interface NativeAPI {
  printer: {
    getPrinters(): Promise<PrinterInfo[]>
    print(options: NativePrintOptions): Promise<PrintResult>
    cancelPrintJob(jobId: string): Promise<void>
  }
}

interface PrinterInfo {
  id: string
  name: string
  isDefault: boolean
  paperSizes: PaperSize[]
  qualities: PrintQuality[]
  supportsColor: boolean
  supportsGrayscale: boolean
}

interface PaperSize {
  id: string
  name: string          // e.g. "4x6", "Letter", "A4"
  widthMm: number
  heightMm: number
}

interface PrintQuality {
  dpi: number            // e.g. 300, 600, 1200
  name: string           // e.g. "Draft", "Normal", "Best"
}

interface NativePrintOptions {
  printerId: string
  paperSizeId: string
  qualityDpi: number
  colorMode: 'color' | 'grayscale'
  copies: number
  orientation: 'portrait' | 'landscape'
  pageHtml: string       // The rendered HTML of one print page
  pageWidthMm: number    // To size the rendering correctly
  pageHeightMm: number
}

interface PrintResult {
  jobId: string
  status: 'queued' | 'completed' | 'failed'
  error?: string
}
```

### C++ binding signatures

```cpp
// bridge.cpp — registered with webview::bind()

// Returns JSON array of PrinterInfo
string getPrinters();

// Accepts JSON NativePrintOptions
// Renders HTML to bitmap, sends to printer
// Returns JSON PrintResult
string print(const string& json);

// Cancels a print job by ID
void cancelPrintJob(const string& jobId);
```

**Design decision**: `print()` receives raw HTML and renders it natively rather than expecting a pre-rendered bitmap. This avoids passing large image buffers across the JS/C++ boundary and lets the native side render at the printer's native DPI. Each platform renders HTML to a bitmap using its webview's capture mechanism, or uses a headless renderer.

---

## Platform-specific printer implementation

### macOS (`printer_macos.mm`)

| API | Implementation |
|-----|---------------|
| `getPrinters` | `[NSPrinter printerNames]` → query name, default via `NSPrintInfo.sharedPrinter`, paper sizes via `printer.paperSizeList`, resolutions via `NSPrintDPI` device key |
| `print` | Render HTML to `NSImage` via `WKWebView` → `NSBitmapImageRep`, create `NSPrintOperation` with configured `NSPrintInfo`, send to printer |
| Cancellation | `[NSPrintOperation.currentOperation cancel]` |

### Windows (`printer_win.cpp`)

| API | Implementation |
|-----|---------------|
| `getPrinters` | `EnumPrinters(PRINTER_ENUM_LOCAL \| PRINTER_ENUM_CONNECTIONS, ...)` → `PRINTER_INFO_2`, paper via `DeviceCapabilities(DC_PAPERNAMES/SIZES)`, DPI via `DeviceCapabilities(DC_ENUMRESOLUTIONS)` |
| `print` | Render HTML to bitmap via `WebView2. CapturePreview`, send via `OpenPrinter` → `StartDocPrinter` → `WritePrinter` (raw bitmap) or use GDI `PrintDlg` → `StartDoc` → `BitBlt` for EMF |
| Cancellation | `SetJob(jobId, 0, JOB_CONTROL_CANCEL)` |

### Linux (`printer_linux.cpp`)

| API | Implementation |
|-----|---------------|
| `getPrinters` | `cupsGetDests()` → iterate, PPD file → parse PageSize and Resolution options |
| `print` | Render HTML to PNG via offscreen WebKitGTK `WebKitWebView`, submit to CUPS via `cupsCreateJob` + `cupsStartDocument` + `cupsWriteRequestData` + `cupsFinishDocument` |
| Cancellation | `cupsCancelJob2(CUPS_HTTP_DEFAULT, printerUri, jobId)` |

### HTML rendering for print output

All three platforms need to render the provided HTML to a pixel buffer at the target DPI:

1. Create an offscreen webview (or reuse the app's webview temporarily)
2. Set its HTML content to the provided `pageHtml` string
3. Wait for layout + fonts to load
4. Capture the rendered page at the target DPI dimensions
5. Convert to printer-compatible format (bitmap/PNG/PDF)
6. Send to the printer via platform API

This is the trickiest part — each platform has different capture APIs. macOS can use `WKWebView takeSnapshot`, Windows `WebView2 CapturePreview`, Linux `WebKitWebView` can render to a Cairo surface.

An alternative is to have the JS side render to a `<canvas>` and pass the raw pixel data, but this loses the font/vector quality advantage of native rendering.

---

## Frontend changes

### New file: `src/lib/native-print.ts`

A thin adapter that wraps `window.__native__` and provides the same `handlePrint` interface regardless of environment:

```ts
export const nativePrint = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.__native__
  },

  async getPrinters(): Promise<PrinterInfo[]> {
    if (!this.isAvailable()) return []
    return JSON.parse(window.__native__.printer.getPrinters())
  },

  async print(html: string, settings: NativePrintOptions): Promise<PrintResult> {
    return JSON.parse(window.__native__.printer.print(JSON.stringify({ html, ...settings })))
  }
}
```

### Modified: `src/App.tsx`

- On mount, check `nativePrint.isAvailable()`
- Pass a flag down to `PrintSettingsPanel` to show/hide native controls
- `handlePrint` in native mode: gather settings, call `nativePrint.print()`, show a status indicator
- In browser mode: keep existing `window.print()` flow

### Modified: `src/components/panels/print-settings-panel.tsx`

When running natively, add to the Layout section (or as a new top section):

```
[NATIVE PRINT PANEL]
  ├── Printer: [dropdown of discovered printers]
  ├── Paper type: [dropdown filtered by printer's supported sizes]
  ├── Quality: [dropdown — Draft / Normal / Best (or printer-specific names)]
  ├── Color mode: [Color / Grayscale]
  ├── Copies: [number input]
  └── [Print Now button]
```

Settings that already exist in the app (paper size, orientation, margins, etc.) sync from the existing layout settings when entering native mode.

When `window.__native__` is not available, this panel is hidden — the app behaves exactly as it does today.

### Modified: `src/components/print/print-pages.tsx`

Add a `renderToHtml()` utility or expose the rendered HTML of a single page so it can be passed to the native `print()` API. Currently the component renders to the DOM for `@media print` — for native printing we need the raw HTML string of each page.

---

## Build system

### CMakeLists.txt structure

```cmake
cmake_minimum_required(VERSION 3.16)
project(photo-print VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Fetch content: webview, nlohmann_json
include(FetchContent)
FetchContent_Declare(webview GIT_REPOSITORY https://github.com/webview/webview.git)
FetchContent_Declare(nlohmann_json GIT_REPOSITORY https://github.com/nlohmann/json.git)
FetchContent_MakeAvailable(webview nlohmann_json)

# Platform-specific sources
if(APPLE)
  set(PLATFORM_SOURCES src/printer_macos.mm)
  find_library(COCOA_LIBRARY Cocoa)
  find_library(WEBKIT_LIBRARY WebKit)
  target_link_libraries(photo-print PRIVATE ${COCOA_LIBRARY} ${WEBKIT_LIBRARY})
elseif(WIN32)
  set(PLATFORM_SOURCES src/printer_win.cpp)
elseif(UNIX)
  set(PLATFORM_SOURCES src/printer_linux.cpp)
  find_package(PkgConfig REQUIRED)
  pkg_check_modules(WEBKIT REQUIRED webkitgtk-6.0)
  target_link_libraries(photo-print PRIVATE ${WEBKIT_LIBRARIES})
endif()

add_executable(photo-print
  src/main.cpp
  src/bridge.cpp
  ${PLATFORM_SOURCES}
)

target_link_libraries(photo-print PRIVATE webview nlohmann_json::nlohmann_json)
```

### Path resolution

The binary needs to find `dist/index.html`. Strategy:

1. Default: resolve relative to the binary's own location (`argv[0]`) → `../../dist/index.html` (dev) or `../dist/index.html` (installed layout)
2. Override via `PHOTO_PRINT_DIST` environment variable
3. If neither works, show an error dialog with instructions

For development, run from `desktop/build/` so `../../dist/index.html` resolves to the project root's `dist/`.

---

## Development workflow

### Scripts added to root `package.json`

```json
{
  "scripts": {
    "dev:desktop": "vite build && cmake -B desktop/build -S desktop && cmake --build desktop/build && ./desktop/build/bin/photo-print",
    "build:desktop": "vite build && cmake -B desktop/build -S desktop && cmake --build desktop/build --config Release"
  }
}
```

### Iteration loop

1. Make frontend changes → `vite build` → relaunch `./desktop/build/bin/photo-print`
2. Make C++ changes → `cmake --build desktop/build` → relaunch

For faster iteration, wire up a file watcher that auto-rebuilds and relaunches on C++ changes, but that's a refinement.

---

## Distribution

### macOS

```
Photo Print.app/
├── Contents/
│   ├── Info.plist
│   ├── MacOS/
│   │   └── photo-print
│   └── Resources/
│       ├── dist/              # Bundled dist/index.html + assets
│       ├── icon.icns
│       └── (etc.)
```

Bundle via `cmake --install` or a helper script that creates the `.app` directory structure.

### Windows

Single `photo-print.exe` with:
- Bundled `dist/` as resources (embedded at compile time)
- Or alongside `dist/` folder next to the exe

### Linux

AppImage with embedded `dist/` or a simple tarball.

---

## Future enhancements (post-MVP)

- Print to PDF (save as file instead of sending to printer)
- Remember last-used printer per paper size
- Printer status monitoring (low ink, paper jam via platform notifications)
- Drag-and-drop from Finder/Explorer into the app
- Headless mode for server-side print generation

---

## Out of scope for v1

- Custom print preview (the React preview is sufficient, the native print goes directly to the printer)
- Job queue / batch printing
- Paper tray selection
- Two-sided (duplex) printing
- Printer-specific media type settings (glossy, matte, etc.)

---

## Tasks

Tasks are ordered sequentially. Complete one before starting the next. After finishing a task, mark it as done.

- [x] **Task 1 — Desktop bootstrap**: Create `desktop/` directory, `CMakeLists.txt`, and `src/main.mm` that opens a webview window loading `dist/index.html`. Add application menu (File: Print/Quit, Edit: Undo/Redo/Cut/Copy/Paste, View: Reload/Toggle DevTools). Set `base: './'` in `vite.config.ts`. Add `dev:desktop` script to root `package.json`.
  - **Done when**: `cmake -B desktop/build -S desktop && cmake --build desktop/build` produces a binary, and running it opens a native window with the app loaded.

- [x] **Task 2 — Bridge skeleton**: Add `bridge.h`, `bridge.mm` with `webview::bind()` initialization. Add `printer.h` with the cross-platform `Printer` interface. Register a `window.__native__.ping()` call that returns `"pong"` to verify JS↔C++ communication.
  - **Done when**: Opening DevTools in the app and typing `window.__native__.ping()` returns `"pong"`.

- [x] **Task 3 — Printer discovery (macOS)**: Implement `printer_macos.mm` with `Printer::getPrinters()` that enumerates `[NSPrinter printerNames]` and returns name, ID, default status, paper sizes (name + dimensions), print qualities (DPI + name), and color support. Wire through `bridge.cpp` so `window.__native__.printer.getPrinters()` returns the JSON array.
  - **Done when**: Calling `window.__native__.printer.getPrinters()` from DevTools returns a complete list of installed printers with their paper sizes and qualities.

- [x] **Task 4 — Frontend native-print adapter**: Add `src/lib/native-print.ts` wrapping `window.__native__`. Update `App.tsx` to detect native mode on mount. Create React context that exposes printer list and native status. Verify communication with C++ backend.
  - **Done when**: The app detects native mode and the discovered printers are logged/available in React state.

- [x] **Task 5 — Native print panel UI**: Add a native print bar below the header with dropdowns for paper type, print quality, color mode, copies input, and a Print Now button. Printer dropdown populates from discovery API; paper and quality dropdowns filter based on selected printer.
  - **Done when**: The panel renders in native mode, printer dropdown shows real printers, and selecting a printer updates the available paper/quality options.

- [ ] **Task 6 — Offscreen HTML rendering (macOS)**: In `printer_macos.mm`, implement rendering a provided HTML string to an `NSImage` at the target DPI using an offscreen `WKWebView` snapshot. Handle layout wait and font loading. Return raw bitmap data suitable for the printer spooler.
  - **Done when**: Passing an HTML string with an image and dimensions returns a correctly-sized bitmap at the requested DPI.

- [ ] **Task 7 — Print submission (macOS)**: Complete the `Printer::print()` implementation — receive HTML + settings, render via offscreen webview, create `NSPrintOperation` with the correct printer/paper/quality, send to printer. Wire the frontend Print Now button through `nativePrint.print()` to the C++ backend. Show a status indicator while printing.
  - **Done when**: Clicking Print Now sends the page to the physical printer with the selected paper type and quality settings. Status feedback is shown in the UI.

- [ ] **Task 8 — Error handling & polish**: Handle edge cases: no printers installed, printer goes offline, print job failure, empty photo list. Show loading states during printer enumeration and print. Add job cancellation from the UI. Ensure the app doesn't crash on any error path.
  - **Done when**: All error scenarios show a clear message in the UI. Cancellation works. The app never crashes from misconfiguration or printer errors.
