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
  qualityModeId: string | null
  colorMode: 'color' | 'grayscale'
  copies: number
}

const DEFAULT_NATIVE_SETTINGS: PersistedNativeSettings = {
  printerId: null,
  paperSizeId: null,
  mediaTypeId: null,
  qualityDpi: null,
  qualityModeId: null,
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
      qualityModeId: typeof parsed.qualityModeId === 'string' ? parsed.qualityModeId : null,
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

function highestQualityDpi(qualities: PrinterInfo['qualities']): number | null {
  if (qualities.length === 0) return null
  return qualities.reduce((best, q) => (q.dpi > best ? q.dpi : best), qualities[0].dpi)
}

function resolveQualityDpi(
  qualities: PrinterInfo['qualities'],
  preferred: number | null,
): number | null {
  if (qualities.length === 0) return null
  if (preferred === null) return highestQualityDpi(qualities)

  const exact = qualities.find((q) => q.dpi === preferred)
  if (exact) return exact.dpi

  // The printer's real resolutions may differ from older saved values
  // (e.g. the old hardcoded 300/600). Keep the closest one.
  return qualities.reduce((nearest, q) =>
    Math.abs(q.dpi - preferred) < Math.abs(nearest.dpi - preferred) ? q : nearest,
  ).dpi
}

function resolveQualityModeId(
  modes: PrinterInfo['qualityModes'],
  preferred: string | null,
): string | null {
  if (modes.length === 0) return null
  if (preferred !== null && modes.some((m) => m.id === preferred)) return preferred

  // Photo printing should default to the driver's best mode. Fall back to the
  // PPD default (then the first choice) for drivers that don't name them.
  const best =
    modes.find((m) => /best/i.test(m.name)) ??
    modes.find((m) => /high/i.test(m.name)) ??
    modes.find((m) => m.isDefault) ??
    modes[0]
  return best.id
}

export function NativePrintProvider({ children }: { children: ReactNode }) {
  const [initialSettings] = useState(loadNativeSettings)
  const [isNative, setIsNative] = useState(false)
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(initialSettings.printerId)
  const [selectedPaperSizeId, setSelectedPaperSizeId] = useState<string | null>(initialSettings.paperSizeId)
  const [selectedMediaTypeId, setSelectedMediaTypeId] = useState<string | null>(initialSettings.mediaTypeId)
  const [selectedQualityDpi, setSelectedQualityDpi] = useState<number | null>(initialSettings.qualityDpi)
  const [selectedQualityModeId, setSelectedQualityModeId] = useState<string | null>(initialSettings.qualityModeId)
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
            resolveQualityDpi(default_.qualities, initialSettings.qualityDpi),
          )
          setSelectedQualityModeId(
            resolveQualityModeId(default_.qualityModes, initialSettings.qualityModeId),
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
      qualityModeId: selectedQualityModeId,
      colorMode,
      copies,
    })
  }, [
    selectedPrinterId,
    selectedPaperSizeId,
    selectedMediaTypeId,
    selectedQualityDpi,
    selectedQualityModeId,
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
        setSelectedQualityDpi(highestQualityDpi(p.qualities))
        setSelectedQualityModeId(resolveQualityModeId(p.qualityModes, null))
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
      selectedQualityModeId,
      setSelectedQualityModeId,
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
      selectedQualityModeId,
      colorMode,
      copies,
      loading,
      error,
    ],
  )

  return <NativePrintContext.Provider value={value}>{children}</NativePrintContext.Provider>
}
