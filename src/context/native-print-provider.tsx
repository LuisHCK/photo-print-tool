import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { NativePrintContext, type NativePrintContextValue } from '@/context/native-print-context'
import { nativePrint, type PrinterInfo } from '@/lib/native-print'

const NATIVE_SETTINGS_KEY = 'photo-print.native-printer-settings.v1'

interface PersistedNativeSettings {
  printerId: string | null
  paperSizeId: string | null
  mediaTypeId: string | null
  qualityDpi: number | null
  colorMode: 'color' | 'grayscale'
  copies: number
}

const DEFAULT_NATIVE_SETTINGS: PersistedNativeSettings = {
  printerId: null,
  paperSizeId: null,
  mediaTypeId: null,
  qualityDpi: null,
  colorMode: 'color',
  copies: 1,
}

function loadNativeSettings(): PersistedNativeSettings {
  if (typeof window === 'undefined') return DEFAULT_NATIVE_SETTINGS

  try {
    const raw = window.localStorage.getItem(NATIVE_SETTINGS_KEY)
    if (!raw) return DEFAULT_NATIVE_SETTINGS

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_NATIVE_SETTINGS

    return {
      printerId: typeof parsed.printerId === 'string' ? parsed.printerId : null,
      paperSizeId: typeof parsed.paperSizeId === 'string' ? parsed.paperSizeId : null,
      mediaTypeId: typeof parsed.mediaTypeId === 'string' ? parsed.mediaTypeId : null,
      qualityDpi: typeof parsed.qualityDpi === 'number' ? parsed.qualityDpi : null,
      colorMode: parsed.colorMode === 'grayscale' ? 'grayscale' : 'color',
      copies:
        typeof parsed.copies === 'number' && parsed.copies >= 1
          ? Math.min(Math.floor(parsed.copies), 999)
          : 1,
    }
  } catch {
    return DEFAULT_NATIVE_SETTINGS
  }
}

function persistNativeSettings(settings: PersistedNativeSettings) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(NATIVE_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function NativePrintProvider({ children }: { children: ReactNode }) {
  const [initialSettings] = useState(loadNativeSettings)
  const [isNative, setIsNative] = useState(false)
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(initialSettings.printerId)
  const [selectedPaperSizeId, setSelectedPaperSizeId] = useState<string | null>(initialSettings.paperSizeId)
  const [selectedMediaTypeId, setSelectedMediaTypeId] = useState<string | null>(initialSettings.mediaTypeId)
  const [selectedQualityDpi, setSelectedQualityDpi] = useState<number | null>(initialSettings.qualityDpi)
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>(initialSettings.colorMode)
  const [copies, setCopies] = useState(initialSettings.copies)
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
        const default_ =
          list.find((p) => p.id === initialSettings.printerId) ??
          list.find((p) => p.isDefault) ??
          list[0]
        if (default_) {
          setSelectedPrinterId(default_.id)
          setSelectedPaperSizeId(
            default_.paperSizes.some((s) => s.id === initialSettings.paperSizeId)
              ? initialSettings.paperSizeId
              : default_.paperSizes[0]?.id ?? null,
          )
          setSelectedMediaTypeId(
            default_.paperTypes.some((m) => m.id === initialSettings.mediaTypeId)
              ? initialSettings.mediaTypeId
              : default_.paperTypes[0]?.id ?? null,
          )
          setSelectedQualityDpi(
            default_.qualities.some((q) => q.dpi === initialSettings.qualityDpi)
              ? initialSettings.qualityDpi
              : default_.qualities[0]?.dpi ?? null,
          )
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
  }, [initialSettings])

  useEffect(() => {
    persistNativeSettings({
      printerId: selectedPrinterId,
      paperSizeId: selectedPaperSizeId,
      mediaTypeId: selectedMediaTypeId,
      qualityDpi: selectedQualityDpi,
      colorMode,
      copies,
    })
  }, [
    selectedPrinterId,
    selectedPaperSizeId,
    selectedMediaTypeId,
    selectedQualityDpi,
    colorMode,
    copies,
  ])

  const handleSelectPrinter = useCallback(
    (id: string) => {
      setSelectedPrinterId(id)
      const p = printers.find((x) => x.id === id)
      if (p) {
        setSelectedPaperSizeId(p.paperSizes[0]?.id ?? null)
        setSelectedMediaTypeId(p.paperTypes[0]?.id ?? null)
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
      selectedMediaTypeId,
      setSelectedMediaTypeId,
      selectedQualityDpi,
      setSelectedQualityDpi,
      colorMode,
      setColorMode,
      copies,
      setCopies,
      loading,
      error,
      cancelPrintJob: () => nativePrint.cancelPrintJob(),
    }),
    [
      isNative,
      printers,
      selectedPrinterId,
      handleSelectPrinter,
      selectedPaperSizeId,
      selectedMediaTypeId,
      selectedQualityDpi,
      colorMode,
      copies,
      loading,
      error,
    ],
  )

  return <NativePrintContext.Provider value={value}>{children}</NativePrintContext.Provider>
}
