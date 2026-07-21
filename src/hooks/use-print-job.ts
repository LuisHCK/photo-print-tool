import { useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { LAYOUT_PRESETS } from '@/lib/layout-presets'
import { PAPER_PRESETS } from '@/lib/paper-presets'
import { PRINT_SIZE_PRESETS, guessPrintSizeFromPhoto } from '@/lib/print-sizes'
import {
    buildPageAssignments,
    calcEffectivePpi,
    computeOptimalGrid,
    getPageSizeMm,
    getPreviewScale
} from '@/lib/print-layout'
import { formatValue, parseInputToMm } from '@/lib/units'
import type {
    CutGuideStyle,
    FitMode,
    GridAlignment,
    LayoutPreset,
    LayoutPresetId,
    Orientation,
    PageAssignment,
    PaperPreset,
    PaperPresetId,
    CustomPreset,
    PrintSettingsSnapshot,
    PrintSizeId,
    PhotoItem,
    SettingsSectionId,
    Unit
} from '@/types/print'
import { trackEvent } from '@/lib/analytics'

const CUSTOM_PRESETS_KEY = 'photo-print.custom-presets.v1'
const OPEN_SECTIONS_KEY = 'photo-print.open-sections.v1'
const GUIDE_STYLE_KEY = 'photo-print.guide-style.v1'
const DEFAULT_PRINT_SIZE_ID: PrintSizeId = '4x6'
const DEFAULT_GRID_ALIGNMENT: GridAlignment = 'top-left'
const GRID_ALIGNMENTS: GridAlignment[] = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
]

function safeParsePresets(raw: string): CustomPreset[] {
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed.filter((entry): entry is CustomPreset => {
            if (!entry || typeof entry !== 'object') {
                return false
            }

            const candidate = entry as Partial<CustomPreset>
            return (
                typeof candidate.id === 'string' &&
                typeof candidate.name === 'string' &&
                typeof candidate.createdAt === 'string' &&
                typeof candidate.updatedAt === 'string' &&
                typeof candidate.settings === 'object' &&
                candidate.settings !== null
            )
        })
    } catch {
        return []
    }
}

function loadOpenSections(): Record<SettingsSectionId, boolean> {
    if (typeof window === 'undefined') {
        return { layout: true, sizeAndSpacing: false, guidesAndAlignment: false, selectedPhoto: false }
    }

    try {
        const raw = window.localStorage.getItem(OPEN_SECTIONS_KEY)
        if (!raw) {
            return { layout: true, sizeAndSpacing: false, guidesAndAlignment: false, selectedPhoto: false }
        }

        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') {
            return { layout: true, sizeAndSpacing: false, guidesAndAlignment: false, selectedPhoto: false }
        }

        return {
            layout: parsed.layout === true,
            sizeAndSpacing: parsed.sizeAndSpacing === true,
            guidesAndAlignment: parsed.guidesAndAlignment === true,
            selectedPhoto: parsed.selectedPhoto === true
        }
    } catch {
        return { layout: true, sizeAndSpacing: false, guidesAndAlignment: false, selectedPhoto: false }
    }
}

function loadCutGuideStyle(): CutGuideStyle {
    if (typeof window === 'undefined') {
        return 'crosses'
    }

    try {
        const raw = window.localStorage.getItem(GUIDE_STYLE_KEY)
        if (raw === 'crosses' || raw === 'dotted' || raw === 'dashed') {
            return raw
        }
    } catch {
        // localStorage unavailable
    }

    return 'crosses'
}

function persistCutGuideStyle(style: CutGuideStyle) {
    if (typeof window === 'undefined') {
        return
    }

    try {
        window.localStorage.setItem(GUIDE_STYLE_KEY, style)
    } catch {
        // localStorage may be full or unavailable
    }
}

function persistOpenSections(sections: Record<SettingsSectionId, boolean>) {
    if (typeof window === 'undefined') {
        return
    }

    try {
        window.localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(sections))
    } catch {
        // localStorage may be full or unavailable
    }
}

function loadCustomPresetsFromStorage(): CustomPreset[] {
    if (typeof window === 'undefined') {
        return []
    }

    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY)
    if (!raw) {
        return []
    }

    return safeParsePresets(raw)
}

function saveCustomPresetsToStorage(presets: CustomPreset[]) {
    if (typeof window === 'undefined') {
        return
    }

    window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets))
}

function formatNumericInput(valueMm: number, unit: Unit) {
    return formatValue(valueMm, unit)
}

async function loadImageSize(file: File, url: string) {
    const image = new Image()
    image.src = url

    await image.decode()

    return {
        id: `${file.name}-${crypto.randomUUID()}`,
        name: file.name,
        url,
        widthPx: image.naturalWidth,
        heightPx: image.naturalHeight,
        copies: 1,
        rotationDeg: 0,
        fitMode: 'fill' as const,
        manualPositionEnabled: false,
        nudgeUpPct: 0,
        nudgeRightPct: 0,
        nudgeDownPct: 0,
        nudgeLeftPct: 0,
        selected: true
    }
}

export interface NumericInputController {
    value: string
    onChange: (nextValue: string) => void
    onBlur: () => void
    onEnter: () => void
}

export interface PrintJobState {
    photos: PhotoItem[]
    activePhotoId: string | null
    paperId: PaperPresetId
    layoutId: LayoutPresetId
    orientation: Orientation
    unit: Unit
    pageIndex: number
    pages: PageAssignment[]
    currentPage: PageAssignment | null
    pageSize: { widthMm: number; heightMm: number }
    previewScale: number
    slotsPerPage: number
    hasOverflow: boolean
    ppiWarnings: Array<{ photo: PhotoItem; ppi: number }>
    activePhoto: PhotoItem | null
    selectedPaperName: string
    cellWidthMm: number
    cellHeightMm: number
    horizontalGapMm: number
    verticalGapMm: number
    marginMm: number
    gridWidthMm: number
    gridHeightMm: number
    selectedLayoutColumns: number
    selectedLayoutRows: number
    maxCopiesPerPage: number
    gridAlignment: GridAlignment
    showCropGuides: boolean
    cutGuideStyle: CutGuideStyle
    widthInput: NumericInputController
    heightInput: NumericInputController
    marginInput: NumericInputController
    horizontalGapInput: NumericInputController
    verticalGapInput: NumericInputController
    paperPresets: PaperPreset[]
    layoutPresets: LayoutPreset[]
    customPresets: CustomPreset[]
    printSizeId: PrintSizeId
    isUploading: boolean
    openSections: Record<SettingsSectionId, boolean>
}

export interface PrintJobActions {
    setPaperId: (paperId: PaperPresetId) => void
    setOrientation: (nextOrientation: Orientation) => void
    setPageIndex: Dispatch<SetStateAction<number>>
    updateLayout: (nextLayoutId: LayoutPresetId) => void
    updateLayoutColumns: (nextColumns: number) => void
    updateLayoutRows: (nextRows: number) => void
    setMaxCopiesPerPage: (nextMaxCopies: number) => void
    setPhotosPerPage: (count: number) => void
    setGridAlignment: (nextAlignment: GridAlignment) => void
    setShowCropGuides: (show: boolean) => void
    setCutGuideStyle: (style: CutGuideStyle) => void
    updateUnit: (nextUnit: Unit) => void
    setActivePhotoId: (photoId: string | null) => void
    handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
    togglePhotoSelection: (photoId: string, selected: boolean) => void
    removePhoto: (photoId: string) => void
    updateActivePhotoRotation: (delta: number) => void
    updateActivePhotoCopies: (nextCopies: number) => void
    updateActivePhotoFitMode: (nextFitMode: FitMode) => void
    updateActivePhotoManualPositionEnabled: (enabled: boolean) => void
    updateActivePhotoNudge: (
        direction: 'up' | 'right' | 'down' | 'left',
        value: number
    ) => void
    saveCustomPreset: (name: string) => { id: string; mode: 'created' | 'updated' } | null
    loadCustomPreset: (presetId: string) => void
    deleteCustomPreset: (presetId: string) => void
    setPrintSizeId: (id: PrintSizeId) => void
    setSectionOpen: (section: SettingsSectionId, open: boolean) => void
    recomputeLayout: () => void
}

export function usePrintJob(): {
    state: PrintJobState
    actions: PrintJobActions
} {
    const [photos, setPhotos] = useState<PhotoItem[]>([])
    const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
    const [paperId, setPaperId] = useState<PaperPresetId>('letter')
    const [layoutId, setLayoutId] = useState<LayoutPresetId>('four')
    const [orientation, setOrientation] = useState<Orientation>('portrait')
    const [unit, setUnit] = useState<Unit>('cm')
    const [marginMm, setMarginMm] = useState<number>(8)
    const [horizontalGapMm, setHorizontalGapMm] = useState<number>(4)
    const [verticalGapMm, setVerticalGapMm] = useState<number>(4)
    const [cellWidthMm, setCellWidthMm] = useState<number>(89)
    const [cellHeightMm, setCellHeightMm] = useState<number>(127)
    const [layoutColumns, setLayoutColumns] = useState<number>(2)
    const [layoutRows, setLayoutRows] = useState<number>(2)
    const [maxCopiesPerPage, setMaxCopiesPerPage] = useState<number>(4)
    const [gridAlignment, setGridAlignment] = useState<GridAlignment>(DEFAULT_GRID_ALIGNMENT)
    const [showCropGuides, setShowCropGuides] = useState<boolean>(true)
    const [cutGuideStyle, setCutGuideStyle] = useState<CutGuideStyle>(() => loadCutGuideStyle())
    const [pageIndex, setPageIndex] = useState(0)
    const [cellWidthInput, setCellWidthInput] = useState<string>(() => formatNumericInput(89, 'cm'))
    const [cellHeightInput, setCellHeightInput] = useState<string>(() =>
        formatNumericInput(127, 'cm')
    )
    const [marginInput, setMarginInput] = useState<string>(() => formatNumericInput(8, 'cm'))
    const [horizontalGapInput, setHorizontalGapInput] = useState<string>(() =>
        formatNumericInput(4, 'cm')
    )
    const [verticalGapInput, setVerticalGapInput] = useState<string>(() =>
        formatNumericInput(4, 'cm')
    )
    const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() =>
        loadCustomPresetsFromStorage()
    )

    const [printSizeId, setPrintSizeId] = useState<PrintSizeId>(DEFAULT_PRINT_SIZE_ID)
    const [isUploading, setIsUploading] = useState(false)
    const [openSections, setOpenSectionsState] = useState<Record<SettingsSectionId, boolean>>(() =>
        loadOpenSections()
    )

    function setSectionOpen(section: SettingsSectionId, open: boolean) {
        setOpenSectionsState((prev) => {
            const next = { ...prev, [section]: open }
            persistOpenSections(next)
            return next
        })
    }

    const paperPresets = PAPER_PRESETS
    const layoutPresets = LAYOUT_PRESETS

    const selectedPaper =
        paperPresets.find((paperPreset) => paperPreset.id === paperId) ?? paperPresets[0]
    const selectedLayout =
        layoutPresets.find((layoutPreset) => layoutPreset.id === layoutId) ?? layoutPresets[0]

    const effectiveLayout = useMemo(
        () => ({
            ...selectedLayout,
            columns: layoutColumns,
            rows: layoutRows
        }),
        [layoutColumns, layoutRows, selectedLayout]
    )

    const selectedPhotos = useMemo(() => photos.filter((photo) => photo.selected), [photos])
    const queuedPhotos = useMemo(
        () =>
            selectedPhotos.flatMap((photo) => {
                const copies = Number.isInteger(photo.copies) ? Math.max(photo.copies, 1) : 1
                return Array.from({ length: copies }, () => photo)
            }),
        [selectedPhotos]
    )

    const pages = useMemo(
        () => buildPageAssignments(effectiveLayout, queuedPhotos, maxCopiesPerPage),
        [effectiveLayout, maxCopiesPerPage, queuedPhotos]
    )

    const currentPage = pages[pageIndex] ?? null
    const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? null

    const pageSize = getPageSizeMm(selectedPaper, orientation)
    const previewScale = getPreviewScale(pageSize.widthMm, pageSize.heightMm)
    const gridCapacity = layoutColumns * layoutRows
    const slotsPerPage = Math.min(maxCopiesPerPage, gridCapacity)

    const gridWidthMm = layoutColumns * cellWidthMm + (layoutColumns - 1) * horizontalGapMm
    const gridHeightMm = layoutRows * cellHeightMm + (layoutRows - 1) * verticalGapMm
    const availableWidthMm = pageSize.widthMm - marginMm * 2
    const availableHeightMm = pageSize.heightMm - marginMm * 2

    const hasOverflow =
        gridWidthMm > availableWidthMm + 0.001 || gridHeightMm > availableHeightMm + 0.001

    const ppiWarnings = useMemo(() => {
        return selectedPhotos
            .map((photo) => ({
                photo,
                ppi: calcEffectivePpi(photo, cellWidthMm, cellHeightMm)
            }))
            .filter((entry) => entry.ppi < 150)
            .slice(0, 3)
    }, [cellHeightMm, cellWidthMm, selectedPhotos])

    function commitNumericMm(
        value: string,
        currentUnit: Unit,
        currentValueMm: number,
        setter: (nextValue: number) => void
    ) {
        const nextMm = parseInputToMm(value, currentUnit)
        if (nextMm) {
            setter(nextMm)
            return nextMm
        }

        return currentValueMm
    }

    function clampCopiesToCapacity(value: number, columns: number, rows: number) {
        const capacity = columns * rows
        return Math.min(Math.max(value, 1), capacity)
    }

    function createNumericInputController(
        value: string,
        setValue: (next: string) => void,
        currentValueMm: number,
        setMmValue: (nextValue: number) => void
    ): NumericInputController {
        return {
            value,
            onChange: setValue,
            onBlur: () => {
                const nextValueMm = commitNumericMm(value, unit, currentValueMm, setMmValue)
                setValue(formatNumericInput(nextValueMm, unit))
            },
            onEnter: () => {
                const nextValueMm = commitNumericMm(value, unit, currentValueMm, setMmValue)
                setValue(formatNumericInput(nextValueMm, unit))
            }
        }
    }

    async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? [])

        if (files.length === 0) {
            return
        }

        setIsUploading(true)

        const loadedPhotos = await Promise.all(
            files.map(async (file) => {
                const url = URL.createObjectURL(file)
                return loadImageSize(file, url)
            })
        )

        setPhotos((previous) => [...previous, ...loadedPhotos])
        setIsUploading(false)

        if (!activePhotoId) {
            setActivePhotoId(loadedPhotos[0]?.id ?? null)
        }

        const firstPhoto = loadedPhotos[0]
        if (firstPhoto) {
            const guessed = guessPrintSizeFromPhoto(firstPhoto.widthPx, firstPhoto.heightPx)
            setPrintSizeId(guessed.id)

            const selectedPaper = paperPresets.find((p) => p.id === paperId) ?? paperPresets[0]
            const pageSize = getPageSizeMm(selectedPaper, orientation)
            const grid = computeOptimalGrid(
                pageSize.widthMm,
                pageSize.heightMm,
                guessed.widthMm,
                guessed.heightMm,
                marginMm,
                horizontalGapMm,
                verticalGapMm,
                loadedPhotos.length
            )

            setCellWidthMm(guessed.widthMm)
            setCellHeightMm(guessed.heightMm)
            setLayoutColumns(grid.cols)
            setLayoutRows(grid.rows)
            setMaxCopiesPerPage(grid.photosPerPage)
            setCellWidthInput(formatNumericInput(guessed.widthMm, unit))
            setCellHeightInput(formatNumericInput(guessed.heightMm, unit))
        }

        setSectionOpen('layout', true)
        setSectionOpen('sizeAndSpacing', false)
        setSectionOpen('selectedPhoto', false)

        trackEvent('import_photos', { count: loadedPhotos.length })

        event.target.value = ''
    }

    function togglePhotoSelection(photoId: string, selected: boolean) {
        setPhotos((previous) =>
            previous.map((photo) => (photo.id === photoId ? { ...photo, selected } : photo))
        )
    }

    function removePhoto(photoId: string) {
        setPhotos((previous) => {
            const target = previous.find((photo) => photo.id === photoId)
            if (target) {
                URL.revokeObjectURL(target.url)
            }

            return previous.filter((photo) => photo.id !== photoId)
        })

        if (activePhotoId === photoId) {
            setActivePhotoId(null)
        }
    }

    function updateLayout(nextLayoutId: LayoutPresetId) {
        const nextLayout =
            layoutPresets.find((layoutPreset) => layoutPreset.id === nextLayoutId) ??
            LAYOUT_PRESETS[0]

        setLayoutId(nextLayout.id)
        setLayoutColumns(nextLayout.columns)
        setLayoutRows(nextLayout.rows)
        setMaxCopiesPerPage(nextLayout.columns * nextLayout.rows)
        setCellWidthMm(nextLayout.defaultCellWidthMm)
        setCellHeightMm(nextLayout.defaultCellHeightMm)
        setCellWidthInput(formatNumericInput(nextLayout.defaultCellWidthMm, unit))
        setCellHeightInput(formatNumericInput(nextLayout.defaultCellHeightMm, unit))
        setPageIndex(0)
    }

    function updateLayoutColumns(nextColumns: number) {
        if (!Number.isInteger(nextColumns) || nextColumns < 1) {
            return
        }

        setLayoutColumns(nextColumns)
        setMaxCopiesPerPage((previous) =>
            clampCopiesToCapacity(previous, nextColumns, layoutRows)
        )
        setPageIndex(0)
    }

    function updateLayoutRows(nextRows: number) {
        if (!Number.isInteger(nextRows) || nextRows < 1) {
            return
        }

        setLayoutRows(nextRows)
        setMaxCopiesPerPage((previous) =>
            clampCopiesToCapacity(previous, layoutColumns, nextRows)
        )
        setPageIndex(0)
    }

    function updateMaxCopiesPerPage(nextMaxCopies: number) {
        if (!Number.isInteger(nextMaxCopies) || nextMaxCopies < 1) {
            return
        }

        setMaxCopiesPerPage(clampCopiesToCapacity(nextMaxCopies, layoutColumns, layoutRows))
        setPageIndex(0)
    }

    function setPhotosPerPage(count: number) {
        if (!Number.isInteger(count) || count < 1) {
            return
        }

        const pageSize = getPageSizeMm(selectedPaper, orientation)
        const availableWidthMm = Math.max(pageSize.widthMm - marginMm * 2, 0)
        const cols = Math.max(1, Math.floor((availableWidthMm + horizontalGapMm) / (cellWidthMm + horizontalGapMm)))
        const rows = Math.max(1, Math.ceil(count / cols))

        setLayoutColumns(cols)
        setLayoutRows(rows)
        setMaxCopiesPerPage(clampCopiesToCapacity(count, cols, rows))
        setPageIndex(0)
    }

    function updateUnit(nextUnit: Unit) {
        setUnit(nextUnit)
        setCellWidthInput(formatNumericInput(cellWidthMm, nextUnit))
        setCellHeightInput(formatNumericInput(cellHeightMm, nextUnit))
        setMarginInput(formatNumericInput(marginMm, nextUnit))
        setHorizontalGapInput(formatNumericInput(horizontalGapMm, nextUnit))
        setVerticalGapInput(formatNumericInput(verticalGapMm, nextUnit))
    }

    function updateActivePhotoRotation(delta: number) {
        if (!activePhoto) {
            return
        }

        setPhotos((previous) =>
            previous.map((photo) => {
                if (photo.id !== activePhoto.id) {
                    return photo
                }

                const nextRotation = (photo.rotationDeg + delta + 360) % 360
                return { ...photo, rotationDeg: nextRotation }
            })
        )
    }

    function updateActivePhotoCopies(nextCopies: number) {
        if (!activePhoto || !Number.isInteger(nextCopies) || nextCopies < 1) {
            return
        }

        setPhotos((previous) =>
            previous.map((photo) =>
                photo.id === activePhoto.id ? { ...photo, copies: nextCopies } : photo
            )
        )
        setPageIndex(0)
    }

    function updateActivePhotoFitMode(nextFitMode: FitMode) {
        if (!activePhoto) {
            return
        }

        setPhotos((previous) =>
            previous.map((photo) =>
                photo.id === activePhoto.id ? { ...photo, fitMode: nextFitMode } : photo
            )
        )
    }

    function updateActivePhotoManualPositionEnabled(enabled: boolean) {
        if (!activePhoto) {
            return
        }

        setPhotos((previous) =>
            previous.map((photo) =>
                photo.id === activePhoto.id ? { ...photo, manualPositionEnabled: enabled } : photo
            )
        )
    }

    function updateActivePhotoNudge(
        direction: 'up' | 'right' | 'down' | 'left',
        value: number
    ) {
        if (!activePhoto || !Number.isFinite(value) || value < 0) {
            return
        }

        setPhotos((previous) =>
            previous.map((photo) => {
                if (photo.id !== activePhoto.id) {
                    return photo
                }

                if (direction === 'up') {
                    return { ...photo, nudgeUpPct: value }
                }

                if (direction === 'right') {
                    return { ...photo, nudgeRightPct: value }
                }

                if (direction === 'down') {
                    return { ...photo, nudgeDownPct: value }
                }

                return { ...photo, nudgeLeftPct: value }
            })
        )
    }

    function buildCurrentSettingsSnapshot(): PrintSettingsSnapshot {
        return {
            paperId,
            layoutId,
            orientation,
            unit,
            layoutColumns,
            layoutRows,
            maxCopiesPerPage,
            cellWidthMm,
            cellHeightMm,
            marginMm,
            horizontalGapMm,
            verticalGapMm,
            showCropGuides,
            cutGuideStyle,
            gridAlignment
        }
    }

    function applySettingsSnapshot(snapshot: PrintSettingsSnapshot) {
        const nextPaper =
            paperPresets.find((preset) => preset.id === snapshot.paperId) ?? paperPresets[0]
        const nextLayout =
            layoutPresets.find((preset) => preset.id === snapshot.layoutId) ?? layoutPresets[0]

        const nextColumns = Number.isInteger(snapshot.layoutColumns)
            ? Math.max(snapshot.layoutColumns, 1)
            : nextLayout.columns
        const nextRows = Number.isInteger(snapshot.layoutRows)
            ? Math.max(snapshot.layoutRows, 1)
            : nextLayout.rows
        const nextMaxCopiesPerPage = Number.isInteger(snapshot.maxCopiesPerPage)
            ? Math.max(snapshot.maxCopiesPerPage ?? 1, 1)
            : nextColumns * nextRows

        const nextWidthMm = Number.isFinite(snapshot.cellWidthMm)
            ? Math.max(snapshot.cellWidthMm, 0.1)
            : nextLayout.defaultCellWidthMm
        const nextHeightMm = Number.isFinite(snapshot.cellHeightMm)
            ? Math.max(snapshot.cellHeightMm, 0.1)
            : nextLayout.defaultCellHeightMm
        const nextMarginMm = Number.isFinite(snapshot.marginMm)
            ? Math.max(snapshot.marginMm, 0)
            : marginMm
        const fallbackGapMm = Number.isFinite(snapshot.gapMm) ? Math.max(snapshot.gapMm ?? 0, 0) : 4
        const nextHorizontalGapMm = Number.isFinite(snapshot.horizontalGapMm)
            ? Math.max(snapshot.horizontalGapMm, 0)
            : fallbackGapMm
        const nextVerticalGapMm = Number.isFinite(snapshot.verticalGapMm)
            ? Math.max(snapshot.verticalGapMm, 0)
            : fallbackGapMm
        const nextShowCropGuides =
            typeof snapshot.showCropGuides === 'boolean' ? snapshot.showCropGuides : true
        const nextCutGuideStyle: CutGuideStyle =
            snapshot.cutGuideStyle === 'crosses' || snapshot.cutGuideStyle === 'dotted' || snapshot.cutGuideStyle === 'dashed'
                ? snapshot.cutGuideStyle
                : 'crosses'
        const nextGridAlignment = GRID_ALIGNMENTS.includes(snapshot.gridAlignment)
            ? snapshot.gridAlignment
            : DEFAULT_GRID_ALIGNMENT

        setPaperId(nextPaper.id)
        setLayoutId(nextLayout.id)
        setOrientation(snapshot.orientation)
        setUnit(snapshot.unit)
        setLayoutColumns(nextColumns)
        setLayoutRows(nextRows)
        setMaxCopiesPerPage(clampCopiesToCapacity(nextMaxCopiesPerPage, nextColumns, nextRows))
        setCellWidthMm(nextWidthMm)
        setCellHeightMm(nextHeightMm)
        setMarginMm(nextMarginMm)
        setHorizontalGapMm(nextHorizontalGapMm)
        setVerticalGapMm(nextVerticalGapMm)
        setGridAlignment(nextGridAlignment)
        setShowCropGuides(nextShowCropGuides)
        setCutGuideStyle(nextCutGuideStyle)

        setCellWidthInput(formatNumericInput(nextWidthMm, snapshot.unit))
        setCellHeightInput(formatNumericInput(nextHeightMm, snapshot.unit))
        setMarginInput(formatNumericInput(nextMarginMm, snapshot.unit))
        setHorizontalGapInput(formatNumericInput(nextHorizontalGapMm, snapshot.unit))
        setVerticalGapInput(formatNumericInput(nextVerticalGapMm, snapshot.unit))
        setPageIndex(0)
    }

    function saveCustomPreset(
        name: string
    ): { id: string; mode: 'created' | 'updated' } | null {
        const trimmedName = name.trim()
        if (!trimmedName) {
            return null
        }

        const now = new Date().toISOString()
        const existingPreset = customPresets.find(
            (preset) => preset.name.toLowerCase() === trimmedName.toLowerCase()
        )

        if (existingPreset) {
            const updatedPreset: CustomPreset = {
                ...existingPreset,
                name: trimmedName,
                updatedAt: now,
                settings: buildCurrentSettingsSnapshot()
            }

            setCustomPresets((previous) => {
                const next = previous.map((preset) =>
                    preset.id === existingPreset.id ? updatedPreset : preset
                )
                saveCustomPresetsToStorage(next)
                return next
            })

            return { id: existingPreset.id, mode: 'updated' }
        }

        const id = crypto.randomUUID()
        const nextPreset: CustomPreset = {
            id,
            name: trimmedName,
            createdAt: now,
            updatedAt: now,
            settings: buildCurrentSettingsSnapshot()
        }

        setCustomPresets((previous) => {
            const next = [...previous, nextPreset]
            saveCustomPresetsToStorage(next)
            return next
        })

        trackEvent('save_preset', { name: trimmedName })

        return { id, mode: 'created' }
    }

    function loadCustomPreset(presetId: string) {
        const preset = customPresets.find((entry) => entry.id === presetId)
        if (!preset) {
            return
        }

        trackEvent('load_preset', { name: preset.name })
        applySettingsSnapshot(preset.settings)
    }

    function deleteCustomPreset(presetId: string) {
        const target = customPresets.find((entry) => entry.id === presetId)
        setCustomPresets((previous) => {
            const next = previous.filter((preset) => preset.id !== presetId)
            saveCustomPresetsToStorage(next)
            return next
        })
        trackEvent('delete_preset', { name: target?.name ?? 'unknown' })
    }

    function handlePrintSizeChange(nextId: PrintSizeId) {
        setPrintSizeId(nextId)

        trackEvent('change_print_size', { id: nextId })

        const preset = PRINT_SIZE_PRESETS.find((p) => p.id === nextId)
        if (!preset) {
            return
        }

        const newWidthMm = preset.widthMm
        const newHeightMm = preset.heightMm

        setCellWidthMm(newWidthMm)
        setCellHeightMm(newHeightMm)
        setCellWidthInput(formatNumericInput(newWidthMm, unit))
        setCellHeightInput(formatNumericInput(newHeightMm, unit))

        const currentPaper = paperPresets.find((p) => p.id === paperId) ?? paperPresets[0]
        const pageSize = getPageSizeMm(currentPaper, orientation)
        const grid = computeOptimalGrid(
            pageSize.widthMm,
            pageSize.heightMm,
            newWidthMm,
            newHeightMm,
            marginMm,
            horizontalGapMm,
            verticalGapMm,
            selectedPhotos.length
        )

        setLayoutColumns(grid.cols)
        setLayoutRows(grid.rows)
        setMaxCopiesPerPage(grid.photosPerPage)
        setPageIndex(0)
    }

    function recomputeLayout() {
        const currentPaper = paperPresets.find((p) => p.id === paperId) ?? paperPresets[0]
        const pageSize = getPageSizeMm(currentPaper, orientation)
        const grid = computeOptimalGrid(
            pageSize.widthMm,
            pageSize.heightMm,
            cellWidthMm,
            cellHeightMm,
            marginMm,
            horizontalGapMm,
            verticalGapMm,
            selectedPhotos.length
        )

        setLayoutColumns(grid.cols)
        setLayoutRows(grid.rows)
        setMaxCopiesPerPage(grid.photosPerPage)
        setPageIndex(0)
    }

    const state: PrintJobState = {
        photos,
        activePhotoId,
        paperId,
        layoutId,
        orientation,
        unit,
        pageIndex,
        pages,
        currentPage,
        pageSize,
        previewScale,
        slotsPerPage,
        hasOverflow,
        ppiWarnings,
        activePhoto,
        selectedPaperName: selectedPaper.name,
        cellWidthMm,
        cellHeightMm,
        horizontalGapMm,
        verticalGapMm,
        marginMm,
        gridWidthMm,
        gridHeightMm,
        selectedLayoutColumns: layoutColumns,
        selectedLayoutRows: layoutRows,
        maxCopiesPerPage,
        gridAlignment,
        showCropGuides,
        cutGuideStyle,
        widthInput: createNumericInputController(
            cellWidthInput,
            setCellWidthInput,
            cellWidthMm,
            setCellWidthMm
        ),
        heightInput: createNumericInputController(
            cellHeightInput,
            setCellHeightInput,
            cellHeightMm,
            setCellHeightMm
        ),
        marginInput: createNumericInputController(
            marginInput,
            setMarginInput,
            marginMm,
            setMarginMm
        ),
        horizontalGapInput: createNumericInputController(
            horizontalGapInput,
            setHorizontalGapInput,
            horizontalGapMm,
            setHorizontalGapMm
        ),
        verticalGapInput: createNumericInputController(
            verticalGapInput,
            setVerticalGapInput,
            verticalGapMm,
            setVerticalGapMm
        ),
        paperPresets,
        layoutPresets,
        customPresets,
        printSizeId,
        isUploading,
        openSections
    }

    const actions: PrintJobActions = {
        setPaperId,
        setOrientation,
        setPageIndex,
        updateLayout,
        updateLayoutColumns,
        updateLayoutRows,
        setMaxCopiesPerPage: updateMaxCopiesPerPage,
        setPhotosPerPage,
        setGridAlignment,
        setShowCropGuides,
        setCutGuideStyle: (style: CutGuideStyle) => {
            setCutGuideStyle(style)
            persistCutGuideStyle(style)
        },
        updateUnit,
        setActivePhotoId,
        handleFileUpload,
        togglePhotoSelection,
        removePhoto,
        updateActivePhotoRotation,
        updateActivePhotoCopies,
        updateActivePhotoFitMode,
        updateActivePhotoManualPositionEnabled,
        updateActivePhotoNudge,
        saveCustomPreset,
        loadCustomPreset,
        deleteCustomPreset,
        setPrintSizeId: handlePrintSizeChange,
        setSectionOpen,
        recomputeLayout
    }

    return { state, actions }
}
