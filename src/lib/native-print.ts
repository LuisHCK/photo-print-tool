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

export interface CancelOptions {
  printerId: string
  jobId: number
}

declare global {
  interface Window {
    __native__?: {
      ping(): Promise<string>
      printer: {
        getPrinters(): Promise<PrinterInfo[]>
        print(opts: NativePrintOptions): Promise<PrintResult>
        cancelPrintJob(opts: CancelOptions): Promise<void>
      }
    }
  }
}

let lastPrintJob: CancelOptions | null = null

export function getLastPrintJob(): CancelOptions | null {
  return lastPrintJob
}

export function clearLastPrintJob(): void {
  lastPrintJob = null
}

export const nativePrint = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.__native__
  },

  async getPrinters(): Promise<PrinterInfo[]> {
    return await window.__native__!.printer.getPrinters()
  },

  async print(options: NativePrintOptions): Promise<PrintResult> {
    const result = await window.__native__!.printer.print(options)
    if (result.jobId) {
      lastPrintJob = { printerId: options.printerId, jobId: Number(result.jobId) }
    }
    return result
  },

  async cancelPrintJob(): Promise<void> {
    if (!lastPrintJob) return
    await window.__native__!.printer.cancelPrintJob(lastPrintJob)
    lastPrintJob = null
  },
}

export async function serializePrintPages(): Promise<string> {
  const section = document.querySelector('.print-pages')
  if (!section) return ''

  const clone = section.cloneNode(true) as HTMLElement
  const imgs = clone.querySelectorAll<HTMLImageElement>('img[src^="blob:"]')

  await Promise.all(Array.from(imgs).map(async (img) => {
    try {
      const resp = await fetch(img.src)
      const blob = await resp.blob()
      img.src = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch { /* keep original src */ }
  }))

  return Array.from(clone.children)
    .map((el) => (el as HTMLElement).outerHTML)
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
  const pageHtml = await serializePrintPages()
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
