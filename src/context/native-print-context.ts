import { createContext } from 'react'
import type { PrinterInfo } from '@/lib/native-print'

export interface NativePrintContextValue {
  isNative: boolean
  printers: PrinterInfo[]
  selectedPrinterId: string | null
  setSelectedPrinterId: (id: string) => void
  selectedPaperSizeId: string | null
  setSelectedPaperSizeId: (id: string) => void
  selectedQualityDpi: number | null
  setSelectedQualityDpi: (dpi: number) => void
  colorMode: 'color' | 'grayscale'
  setColorMode: (mode: 'color' | 'grayscale') => void
  copies: number
  setCopies: (n: number) => void
  loading: boolean
  error: string | null
}

export const NativePrintContext = createContext<NativePrintContextValue | null>(null)
