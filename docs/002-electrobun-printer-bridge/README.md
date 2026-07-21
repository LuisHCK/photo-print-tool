# 002 — Electrobun Printer Bridge

Fork ElectroBun to add a native `Printer` API that exposes printer discovery, paper/quality settings, and direct print job submission to the main process, then bridges it to the webview via RPC.

---

## Goal

Replace `window.print()` with a native print dialog and direct printer control (paper size, quality, tray, orientation) — matching the UX of the Windows Photo Printer tool — across macOS, Windows, and Linux.

---

## Architecture overview

```
Webview (React app)
  │
  ├── window.electrobun.printer.getPrinters()
  ├── window.electrobun.printer.showPrintDialog(options)
  ├── window.electrobun.printer.print(options)
  │
  └── RPC (typed, async)
        │
  Bun main process (src/bun/)
        │
  └── Printer API — electrobun/bun
        │
        └── Native bindings (ObjC / C++ / Zig)
              │
              ├── macOS: NSPrintInfo + CUPS
              ├── Windows: PrintDlgEx + WinSpool
              └── Linux: CUPS + GTK print dialog
```

---

## Fork structure

The fork lives in your own repository (e.g. `github.com/yourname/electrobun`). The photo-print project references it via git dependency in `package.json`.

### Forked ElectroBun — new files

```
package/src/
├── bun/
│   └── printer.ts              # NEW — Printer API exported to electrobun/bun
├── native/
│   ├── shared/
│   │   └── Printer.h           # NEW — shared C++ Printer interface
│   ├── macos/
│   │   ├── Printer.mm          # NEW — macOS printer bindings
│   │   └── PrinterDelegate.h   # NEW — macOS print dialog delegate
│   ├── win/
│   │   └── Printer.cpp         # NEW — Windows printer bindings
│   └── linux/
│       └── Printer.cpp         # NEW — Linux printer bindings (CUPS)
├── zig/
│   └── printer_bridge.zig      # NEW — Zig FFI bindings for printer APIs
└── electrobun.config.ts        # MODIFIED — register printer module
```

---

## API design

### Bun-side API (`electrobun/bun`)

```ts
// Printer types
interface PrinterInfo {
  id: string
  name: string
  isDefault: boolean
  status: "ready" | "busy" | "error"
  location?: string
  paperSizes: PaperSize[]
  resolutions: Resolution[]
  supportsColor: boolean
  duplexModes: DuplexMode[]
}

interface PaperSize {
  id: string
  name: string            // e.g. "A4", "Letter", "4x6"
  widthMm: number
  heightMm: number
  isCustom: boolean
}

interface Resolution {
  dpi: number              // e.g. 300, 600, 1200
  name: string             // e.g. "Draft", "Normal", "Best"
}

interface PrintSettings {
  printerId: string
  paperSizeId: string
  resolution: number       // dpi
  copies: number
  orientation: "portrait" | "landscape"
  duplex: "none" | "long-edge" | "short-edge"
  colorMode: "color" | "grayscale"
  marginsMm?: { top: number; right: number; bottom: number; left: number }
  collate?: boolean
}

interface PrintJob {
  id: string
  status: "queued" | "printing" | "completed" | "failed" | "cancelled"
  error?: string
}

// Printer API
export class Printer {
  static getPrinters(): Promise<PrinterInfo[]>
  static getDefaultPrinter(): Promise<PrinterInfo | null>
  static showPrintDialog(settings?: Partial<PrintSettings>): Promise<PrintSettings | null>
  static print(settings: PrintSettings, data: Uint8Array): Promise<PrintJob>
  static getPrintJobStatus(jobId: string): Promise<PrintJobStatus>
  static cancelPrintJob(jobId: string): Promise<void>
}
```

### Webview-side API (via RPC)

Same shape, exposed through the preload script and RPC bridge:

```ts
// Available on window.electrobun.printer.*
// Implemented via RPC calls to the Bun process
```

### RPC type definition

`src/shared/print-rpc.ts` (in the photo-print app):

```ts
export type PrintRPC = {
  bun: RPCSchema<{
    requests: {
      getPrinters: { params: {}; response: PrinterInfo[] }
      getDefaultPrinter: { params: {}; response: PrinterInfo | null }
      showPrintDialog: { params: { settings?: Partial<PrintSettings> }; response: PrintSettings | null }
      print: { params: { settings: PrintSettings; data: ArrayBuffer }; response: PrintJob }
      getPrintJobStatus: { params: { jobId: string }; response: PrintJobStatus }
      cancelPrintJob: { params: { jobId: string }; response: void }
    }
    messages: {
      printJobProgress: { jobId: string; progress: number }
      printJobComplete: { jobId: string }
      printJobFailed: { jobId: string; error: string }
    }
  }>
  webview: RPCSchema<{}>
}
```

---

## Platform-specific implementation

### macOS — `native/macos/Printer.mm`

| API | macOS implementation |
|-----|---------------------|
| `getPrinters` | `NSPrinter` — enumerate `[NSPrinter printerNames]`, query attributes |
| `showPrintDialog` | `NSPrintPanel` — run modal print panel, return configured `NSPrintInfo` |
| `print` | Create `NSPrintOperation` with `NSView` + `NSPrintInfo`, or use CUPS `ipp` API directly for headless printing |
| Paper sizes | `NSPrinter.paperSizeList` (converts from points to mm) |
| Resolution | `NSPrinter` device description keys (`NSPrintDPI`) |
| Status | `NSPrintOperation` delegate callbacks |

Print data flow:
1. Webview renders print page to canvas or generates PDF via `electrobun.webview.printToPDF()`
2. Pass `Uint8Array` (PDF or raster data) over RPC to Bun process
3. Bun process passes to native layer
4. Native layer sends to printer via `NSPrintOperation` with data provider or CUPS IPP

### Windows — `native/win/Printer.cpp`

| API | Windows implementation |
|-----|----------------------|
| `getPrinters` | `EnumPrinters` with `PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS` |
| `showPrintDialog` | `PrintDlgEx` — common print dialog with `PRINTDLGEX` struct |
| `print` | `OpenPrinter` → `StartDocPrinter` / `StartPagePrinter` / `WritePrinter` / `EndPagePrinter` / `EndDocPrinter` / `ClosePrinter` |
| Paper sizes | `DeviceCapabilities(DC_PAPERNAMES, DC_PAPERSIZE, ...)` |
| Resolution | `DeviceCapabilities(DC_ENUMRESOLUTIONS, ...)` |
| Status | `GetJob` polling or printer change notifications |

### Linux — `native/linux/Printer.cpp`

| API | Linux implementation |
|-----|---------------------|
| `getPrinters` | CUPS `cupsGetDests()` / `cupsEnumDests()` |
| `showPrintDialog` | GTK `GtkPrintUnixDialog` or custom dialog via CUPS options |
| `print` | CUPS `cupsCreateJob()` + `cupsStartDocument()` + `cupsWriteRequestData()` + `cupsFinishDocument()` |
| Paper sizes | CUPS `ppdFile` → `ppd_option_t` for PageSize |
| Resolution | CUPS PPD → `ppd_option_t` for Resolution |
| Status | CUPS `cupsGetJobs()` polling |

---

## Integration with photo-print

### Changes to the photo-print app

| File | Change |
|------|--------|
| `src/bun/index.ts` | Import `Printer` from forked `electrobun/bun`, add RPC handlers for print operations |
| `src/shared/print-rpc.ts` | New — shared RPC type definitions for print bridge |
| `src/mainview/preload.ts` | Expose `window.electrobun.printer` via RPC preload |
| `src/hooks/use-print-job.ts` | Add `handleNativePrint` action that calls native print API instead of `window.print()` |
| `src/App.tsx` | Route print button through native print handler |
| `src/components/panels/print-settings-panel.tsx` | Add native print quality/resolution controls (visible when running as native app) |

### Print flow

```
1. User clicks "Print"
2. Frontend calls window.electrobun.printer.showPrintDialog(currentSettings)
3. Native dialog opens — user selects printer, paper, quality, etc.
4. Dialog returns PrintSettings (or null if cancelled)
5. Frontend updates any settings based on user's choices
6. Frontend renders print pages to a canvas/PDF
7. Frontend calls window.electrobun.printer.print(settings, dataBuffer)
8. RPC sends data to Bun process
9. Bun process calls Printer.print() — native layer sends to printer
10. Progress events flow back via RPC messages
```

### Relevant types in photo-print app

The existing `PrintSettingsSnapshot` type in `src/types/print.ts` maps to the new native `PrintSettings`:

```ts
// Existing type (maps to native)
interface PrintSettingsSnapshot {
  paperId: PaperPresetId       // → printerSettings.paperSizeId
  orientation: Orientation     // → printerSettings.orientation
  layoutColumns: number        // (layout math stays in frontend)
  layoutRows: number
  cellWidthMm: number
  cellHeightMm: number
  // ... etc
}
```

New native-specific fields can be added conditionally:

```ts
interface NativePrintSettings {
  printerId: string
  resolution: number          // dpi — new
  colorMode: "color" | "grayscale"  // new
  duplexMode: DuplexMode      // new
  copies: number              // replaces web-based copies handling
}
```

---

## Fork maintenance strategy

### Keeping up with upstream ElectroBun

```bash
# Add upstream remote
git remote add upstream https://github.com/blackboardsh/electrobun.git

# Pull latest upstream changes
git fetch upstream
git checkout main
git merge upstream/main --no-ff

# Keep printer bridge files separate so merges are clean
# All printer-specific code lives in:
#   package/src/native/*/Printer.*
#   package/src/bun/printer.ts
#   package/src/zig/printer_bridge.zig
```

### Version pinning

In `package.json` of photo-print:

```json
{
  "dependencies": {
    "electrobun": "github:yourname/electrobun#v0.1.0-print-bridge"
  }
}
```

---

## Testing strategy

| Test | Method |
|------|--------|
| Printer discovery | Unit test native `getPrinters()` on each platform |
| Dialog UX | Manual — run app, click print, verify native dialog opens |
| PDF generation | Compare `printToPDF()` output against expected dimensions |
| Print job submission | Print to "Save as PDF" / "Print to File" virtual printer |
| RPC round-trip | Verify typed RPC calls return correct types |
| Error handling | Disconnect printer, submit empty data, verify error messages |
| Cross-platform | CI matrix on macOS, Windows, Linux (GitHub Actions) |

---

## Milestones

| Phase | Tasks |
|-------|-------|
| **Phase 1** | Fork repo, set up build environment. Implement `Printer.getPrinters()` on macOS. |
| **Phase 2** | Implement `Printer.showPrintDialog()` on macOS. Wire up RPC. |
| **Phase 3** | Implement `Printer.print()` on macOS with PDF data input. |
| **Phase 4** | Port to Windows (PrintDlgEx + WinSpool). |
| **Phase 5** | Port to Linux (CUPS + GTK dialog). |
| **Phase 6** | Integrate with photo-print app — replace `window.print()` with native flow. |
| **Phase 7** | Polish — error handling, progress events, cancellation, edge cases. |

---

## Future enhancements

- Print to PDF (save as file instead of printer)
- Printer presets (remember per-printer settings)
- Job queue management
- Printer status monitoring (low ink, paper jam)
- Hot-plug printer detection
