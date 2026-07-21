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

export interface PrinterInfo {
  id: string
  name: string
  isDefault: boolean
  paperSizes: PaperSize[]
  qualities: PrintQuality[]
  supportsColor: boolean
  supportsGrayscale: boolean
}

declare global {
  interface Window {
    __native__?: {
      ping(): Promise<string>
      printer: {
        getPrinters(): Promise<string>
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
}
