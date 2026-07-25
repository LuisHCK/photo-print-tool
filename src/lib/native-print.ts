export interface PaperSize {
  id: string
  name: string
  widthMm: number
  heightMm: number
}

export interface PrintQuality {
  dpi: number
  name: string
}

export interface MediaType {
  id: string
  name: string
}

export interface PrinterInfo {
  id: string
  name: string
  isDefault: boolean
  paperSizes: PaperSize[]
  qualities: PrintQuality[]
  paperTypes: MediaType[]
  supportsColor: boolean
  supportsGrayscale: boolean
}

export interface NativePrintOptions {
  pageHtml: string
  pageWidthMm: number
  pageHeightMm: number
  printerId: string
  copies: number
  colorMode: 'color' | 'grayscale'
  qualityDpi: number
  mediaType?: string
  orientation: 'portrait' | 'landscape'
}

export interface PrintResult {
  jobId: string
  status: 'queued' | 'completed' | 'failed'
  error?: string
}

declare global {
  interface Window {
    __native__?: {
      ping(): Promise<string>
      printer: {
        getPrinters(): Promise<string>
        print(opts: NativePrintOptions): Promise<string>
      }
    }
  }
}

export const nativePrint = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.__native__
  },

  async getPrinters(): Promise<PrinterInfo[]> {
    const raw = await window.__native__!.printer.getPrinters()
    return raw as PrinterInfo[]
  },

  async print(options: NativePrintOptions): Promise<PrintResult> {
    const raw = await window.__native__!.printer.print(options)
    return raw as PrintResult
  },
}

export function serializePrintPages(): string {
  const section = document.querySelector('.print-pages')
  if (!section) return ''
  return Array.from(section.children)
    .map((el) => el.outerHTML)
    .join('\n')
}

export interface PrintSubmission {
  printerId: string
  paperSizeId: string
  paperSizes: PaperSize[]
  colorMode: 'color' | 'grayscale'
  qualityDpi: number
  copies: number
  mediaTypeId?: string
}

export async function submitNativePrint(
  settings: PrintSubmission
): Promise<{ ok: true } | { ok: false; message: string }> {
  const pageHtml = serializePrintPages()
  if (!pageHtml) return { ok: false, message: 'No print pages found' }

  const selectedPaper = settings.paperSizes.find(
    (s) => s.id === settings.paperSizeId
  )

  const result = await nativePrint.print({
    pageHtml,
    pageWidthMm: selectedPaper?.widthMm ?? 150,
    pageHeightMm: selectedPaper?.heightMm ?? 100,
    printerId: settings.printerId,
    copies: settings.copies,
    colorMode: settings.colorMode,
    qualityDpi: settings.qualityDpi,
    mediaType: settings.mediaTypeId ?? undefined,
    orientation: 'portrait',
  })

  if (result.status === 'failed') {
    return { ok: false, message: result.error ?? 'Print failed' }
  }

  return { ok: true }
}
