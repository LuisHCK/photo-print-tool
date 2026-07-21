import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { NativePrintContext, type NativePrintContextValue } from '@/context/native-print-context'
import { nativePrint, type PrinterInfo } from '@/lib/native-print'

export function NativePrintProvider({ children }: { children: ReactNode }) {
  const [isNative, setIsNative] = useState(false)
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null)
  const [selectedPaperSizeId, setSelectedPaperSizeId] = useState<string | null>(null)
  const [selectedQualityDpi, setSelectedQualityDpi] = useState<number | null>(null)
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color')
  const [copies, setCopies] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!nativePrint.isAvailable()) return
    setIsNative(true)

    let cancelled = false
    setLoading(true)

    nativePrint
      .getPrinters()
      .then((list) => {
        if (cancelled) return
        setPrinters(list)
        const default_ = list.find((p) => p.isDefault) ?? list[0]
        if (default_) {
          setSelectedPrinterId(default_.id)
          setSelectedPaperSizeId(default_.paperSizes[0]?.id ?? null)
          setSelectedQualityDpi(default_.qualities[0]?.dpi ?? null)
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to enumerate printers')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSelectPrinter = useCallback(
    (id: string) => {
      setSelectedPrinterId(id)
      const p = printers.find((x) => x.id === id)
      if (p) {
        setSelectedPaperSizeId(p.paperSizes[0]?.id ?? null)
        setSelectedQualityDpi(p.qualities[0]?.dpi ?? null)
      }
    },
    [printers],
  )

  const value: NativePrintContextValue = useMemo(
    () => ({
      isNative,
      printers,
      selectedPrinterId,
      setSelectedPrinterId: handleSelectPrinter,
      selectedPaperSizeId,
      setSelectedPaperSizeId,
      selectedQualityDpi,
      setSelectedQualityDpi,
      colorMode,
      setColorMode,
      copies,
      setCopies,
      loading,
      error,
    }),
    [
      isNative,
      printers,
      selectedPrinterId,
      handleSelectPrinter,
      selectedPaperSizeId,
      selectedQualityDpi,
      colorMode,
      copies,
      loading,
      error,
    ],
  )

  return <NativePrintContext.Provider value={value}>{children}</NativePrintContext.Provider>
}
