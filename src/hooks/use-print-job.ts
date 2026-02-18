import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type Dispatch,
    type SetStateAction
} from 'react'
import {
    buildUniqueCustomPresetId,
    loadCustomPresets,
    saveCustomPresets
} from '@/lib/custom-presets-storage'
import { LAYOUT_PRESETS } from '@/lib/layout-presets'
import { PAPER_PRESETS } from '@/lib/paper-presets'
import {
    buildPageAssignments,
    calcEffectivePpi,
    getPageSizeMm,
    getPreviewScale
} from '@/lib/print-layout'
import { formatValue, parseInputToMm } from '@/lib/units'
import type {
    FitMode,
    LayoutPreset,
    LayoutPresetId,
    Orientation,
    PageAssignment,
    PaperPreset,
    PaperPresetId,
    PhotoItem,
    Unit
} from '@/types/print'

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
        rotationDeg: 0,
        fitMode: 'fill' as const,
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
    gapMm: number
    marginMm: number
    gridWidthMm: number
    gridHeightMm: number
    selectedLayoutColumns: number
    selectedLayoutRows: number
    widthInput: NumericInputController
    heightInput: NumericInputController
    marginInput: NumericInputController
    gapInput: NumericInputController
    paperPresets: PaperPreset[]
    layoutPresets: LayoutPreset[]
    customPaperPresets: PaperPreset[]
    customLayoutPresets: LayoutPreset[]
}

export interface PaperPresetDraft {
    id?: PaperPresetId
    name: string
    widthMm: number
    heightMm: number
}

export interface LayoutPresetDraft {
    id?: LayoutPresetId
    name: string
    columns: number
    rows: number
    defaultCellWidthMm: number
    defaultCellHeightMm: number
    supportsAutoFlow: boolean
    repeatSinglePhoto: boolean
}

export interface PrintJobActions {
    setPaperId: (paperId: PaperPresetId) => void
    setOrientation: (nextOrientation: Orientation) => void
    setPageIndex: Dispatch<SetStateAction<number>>
    updateLayout: (nextLayoutId: LayoutPresetId) => void
    updateUnit: (nextUnit: Unit) => void
    setActivePhotoId: (photoId: string | null) => void
    handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
    togglePhotoSelection: (photoId: string, selected: boolean) => void
    removePhoto: (photoId: string) => void
    updateActivePhotoRotation: (delta: number) => void
    updateActivePhotoFitMode: (nextFitMode: FitMode) => void
    saveCustomPaperPreset: (draft: PaperPresetDraft) => PaperPresetId | null
    deleteCustomPaperPreset: (presetId: PaperPresetId) => void
    duplicatePaperPreset: (sourcePresetId: PaperPresetId) => PaperPresetId | null
    saveCustomLayoutPreset: (draft: LayoutPresetDraft) => LayoutPresetId | null
    deleteCustomLayoutPreset: (presetId: LayoutPresetId) => void
    duplicateLayoutPreset: (sourcePresetId: LayoutPresetId) => LayoutPresetId | null
}

function uniqueById<T extends { id: string }>(items: T[]) {
    const seen = new Set<string>()
    return items.filter((item) => {
        if (seen.has(item.id)) {
            return false
        }

        seen.add(item.id)
        return true
    })
}

function isPositiveFiniteNumber(value: number) {
    return Number.isFinite(value) && value > 0
}

function isPositiveInteger(value: number) {
    return Number.isInteger(value) && value > 0
}

const MAX_LAYOUT_DIMENSION = 50

function normalizePaperDraft(draft: PaperPresetDraft): PaperPresetDraft | null {
    const name = draft.name.trim()

    if (
        !name ||
        !isPositiveFiniteNumber(draft.widthMm) ||
        !isPositiveFiniteNumber(draft.heightMm)
    ) {
        return null
    }

    return {
        id: draft.id,
        name,
        widthMm: draft.widthMm,
        heightMm: draft.heightMm
    }
}

function normalizeLayoutDraft(draft: LayoutPresetDraft): LayoutPresetDraft | null {
    const name = draft.name.trim()

    if (
        !name ||
        !isPositiveInteger(draft.columns) ||
        !isPositiveInteger(draft.rows) ||
        draft.columns > MAX_LAYOUT_DIMENSION ||
        draft.rows > MAX_LAYOUT_DIMENSION ||
        !isPositiveFiniteNumber(draft.defaultCellWidthMm) ||
        !isPositiveFiniteNumber(draft.defaultCellHeightMm)
    ) {
        return null
    }

    return {
        id: draft.id,
        name,
        columns: draft.columns,
        rows: draft.rows,
        defaultCellWidthMm: draft.defaultCellWidthMm,
        defaultCellHeightMm: draft.defaultCellHeightMm,
        supportsAutoFlow: draft.supportsAutoFlow,
        repeatSinglePhoto: draft.repeatSinglePhoto
    }
}

export function usePrintJob(): {
    state: PrintJobState
    actions: PrintJobActions
} {
    const initialCustomPresets = useMemo(() => loadCustomPresets(), [])

    const [photos, setPhotos] = useState<PhotoItem[]>([])
    const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
    const [paperId, setPaperId] = useState<PaperPresetId>('a4')
    const [layoutId, setLayoutId] = useState<LayoutPresetId>('four')
    const [orientation, setOrientation] = useState<Orientation>('portrait')
    const [unit, setUnit] = useState<Unit>('cm')
    const [marginMm, setMarginMm] = useState<number>(8)
    const [gapMm, setGapMm] = useState<number>(4)
    const [cellWidthMm, setCellWidthMm] = useState<number>(89)
    const [cellHeightMm, setCellHeightMm] = useState<number>(127)
    const [pageIndex, setPageIndex] = useState(0)
    const [cellWidthInput, setCellWidthInput] = useState<string>(() => formatNumericInput(89, 'cm'))
    const [cellHeightInput, setCellHeightInput] = useState<string>(() =>
        formatNumericInput(127, 'cm')
    )
    const [marginInput, setMarginInput] = useState<string>(() => formatNumericInput(8, 'cm'))
    const [gapInput, setGapInput] = useState<string>(() => formatNumericInput(4, 'cm'))
    const [customPaperPresets, setCustomPaperPresets] = useState<PaperPreset[]>(
        () => initialCustomPresets.papers
    )
    const [customLayoutPresets, setCustomLayoutPresets] = useState<LayoutPreset[]>(
        () => initialCustomPresets.layouts
    )

    const paperPresets = useMemo(() => {
        const builtInIds = new Set<string>(PAPER_PRESETS.map((preset) => preset.id))
        const validCustom = customPaperPresets.filter((preset) => !builtInIds.has(preset.id))
        return uniqueById([...PAPER_PRESETS, ...validCustom])
    }, [customPaperPresets])

    const layoutPresets = useMemo(() => {
        const builtInIds = new Set<string>(LAYOUT_PRESETS.map((preset) => preset.id))
        const validCustom = customLayoutPresets.filter((preset) => !builtInIds.has(preset.id))
        return uniqueById([...LAYOUT_PRESETS, ...validCustom])
    }, [customLayoutPresets])

    useEffect(() => {
        saveCustomPresets(customPaperPresets, customLayoutPresets)
    }, [customLayoutPresets, customPaperPresets])

    const selectedPaper =
        paperPresets.find((paperPreset) => paperPreset.id === paperId) ?? paperPresets[0]
    const selectedLayout =
        layoutPresets.find((layoutPreset) => layoutPreset.id === layoutId) ?? layoutPresets[0]

    const selectedPhotos = useMemo(() => photos.filter((photo) => photo.selected), [photos])

    const pages = useMemo(
        () => buildPageAssignments(selectedLayout, selectedPhotos),
        [selectedLayout, selectedPhotos]
    )

    const currentPage = pages[pageIndex] ?? null
    const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? null

    const pageSize = getPageSizeMm(selectedPaper, orientation)
    const previewScale = getPreviewScale(pageSize.widthMm, pageSize.heightMm)
    const slotsPerPage = selectedLayout.columns * selectedLayout.rows

    const gridWidthMm = selectedLayout.columns * cellWidthMm + (selectedLayout.columns - 1) * gapMm
    const gridHeightMm = selectedLayout.rows * cellHeightMm + (selectedLayout.rows - 1) * gapMm
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

        const loadedPhotos = await Promise.all(
            files.map(async (file) => {
                const url = URL.createObjectURL(file)
                return loadImageSize(file, url)
            })
        )

        setPhotos((previous) => [...previous, ...loadedPhotos])

        if (!activePhotoId) {
            setActivePhotoId(loadedPhotos[0]?.id ?? null)
        }

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
        setCellWidthMm(nextLayout.defaultCellWidthMm)
        setCellHeightMm(nextLayout.defaultCellHeightMm)
        setCellWidthInput(formatNumericInput(nextLayout.defaultCellWidthMm, unit))
        setCellHeightInput(formatNumericInput(nextLayout.defaultCellHeightMm, unit))
        setPageIndex(0)
    }

    function saveCustomPaperPreset(draft: PaperPresetDraft): PaperPresetId | null {
        const normalized = normalizePaperDraft(draft)

        if (!normalized) {
            return null
        }

        const builtInIds = new Set<string>(PAPER_PRESETS.map((preset) => preset.id))

        if (normalized.id && builtInIds.has(normalized.id)) {
            return null
        }

        const existingIds = new Set(paperPresets.map((preset) => preset.id))
        const nextId =
            normalized.id ?? buildUniqueCustomPresetId('paper', normalized.name, existingIds)

        const nextPreset: PaperPreset = {
            id: nextId,
            name: normalized.name,
            widthMm: normalized.widthMm,
            heightMm: normalized.heightMm
        }

        setCustomPaperPresets((previous) => {
            const withoutTarget = previous.filter((preset) => preset.id !== nextId)
            return [...withoutTarget, nextPreset]
        })

        setPaperId(nextId)
        return nextId
    }

    function deleteCustomPaperPreset(presetId: PaperPresetId) {
        setCustomPaperPresets((previous) => previous.filter((preset) => preset.id !== presetId))

        if (paperId === presetId) {
            setPaperId(PAPER_PRESETS[0].id)
        }
    }

    function duplicatePaperPreset(sourcePresetId: PaperPresetId): PaperPresetId | null {
        const sourcePreset = paperPresets.find((preset) => preset.id === sourcePresetId)

        if (!sourcePreset) {
            return null
        }

        return saveCustomPaperPreset({
            name: `${sourcePreset.name} Copy`,
            widthMm: sourcePreset.widthMm,
            heightMm: sourcePreset.heightMm
        })
    }

    function saveCustomLayoutPreset(draft: LayoutPresetDraft): LayoutPresetId | null {
        const normalized = normalizeLayoutDraft(draft)

        if (!normalized) {
            return null
        }

        const builtInIds = new Set<string>(LAYOUT_PRESETS.map((preset) => preset.id))

        if (normalized.id && builtInIds.has(normalized.id)) {
            return null
        }

        const existingIds = new Set(layoutPresets.map((preset) => preset.id))
        const nextId =
            normalized.id ?? buildUniqueCustomPresetId('layout', normalized.name, existingIds)

        const nextPreset: LayoutPreset = {
            id: nextId,
            name: normalized.name,
            columns: normalized.columns,
            rows: normalized.rows,
            supportsAutoFlow: normalized.supportsAutoFlow,
            repeatSinglePhoto: normalized.repeatSinglePhoto,
            defaultCellWidthMm: normalized.defaultCellWidthMm,
            defaultCellHeightMm: normalized.defaultCellHeightMm
        }

        setCustomLayoutPresets((previous) => {
            const withoutTarget = previous.filter((preset) => preset.id !== nextId)
            return [...withoutTarget, nextPreset]
        })

        updateLayout(nextId)
        return nextId
    }

    function deleteCustomLayoutPreset(presetId: LayoutPresetId) {
        setCustomLayoutPresets((previous) => previous.filter((preset) => preset.id !== presetId))

        if (layoutId === presetId) {
            updateLayout(LAYOUT_PRESETS[0].id)
        }
    }

    function duplicateLayoutPreset(sourcePresetId: LayoutPresetId): LayoutPresetId | null {
        const sourcePreset = layoutPresets.find((preset) => preset.id === sourcePresetId)

        if (!sourcePreset) {
            return null
        }

        return saveCustomLayoutPreset({
            name: `${sourcePreset.name} Copy`,
            columns: sourcePreset.columns,
            rows: sourcePreset.rows,
            supportsAutoFlow: sourcePreset.supportsAutoFlow,
            repeatSinglePhoto: sourcePreset.repeatSinglePhoto,
            defaultCellWidthMm: sourcePreset.defaultCellWidthMm,
            defaultCellHeightMm: sourcePreset.defaultCellHeightMm
        })
    }

    function updateUnit(nextUnit: Unit) {
        setUnit(nextUnit)
        setCellWidthInput(formatNumericInput(cellWidthMm, nextUnit))
        setCellHeightInput(formatNumericInput(cellHeightMm, nextUnit))
        setMarginInput(formatNumericInput(marginMm, nextUnit))
        setGapInput(formatNumericInput(gapMm, nextUnit))
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
        gapMm,
        marginMm,
        gridWidthMm,
        gridHeightMm,
        selectedLayoutColumns: selectedLayout.columns,
        selectedLayoutRows: selectedLayout.rows,
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
        gapInput: createNumericInputController(gapInput, setGapInput, gapMm, setGapMm),
        paperPresets,
        layoutPresets,
        customPaperPresets,
        customLayoutPresets
    }

    const actions: PrintJobActions = {
        setPaperId,
        setOrientation,
        setPageIndex,
        updateLayout,
        updateUnit,
        setActivePhotoId,
        handleFileUpload,
        togglePhotoSelection,
        removePhoto,
        updateActivePhotoRotation,
        updateActivePhotoFitMode,
        saveCustomPaperPreset,
        deleteCustomPaperPreset,
        duplicatePaperPreset,
        saveCustomLayoutPreset,
        deleteCustomLayoutPreset,
        duplicateLayoutPreset
    }

    return { state, actions }
}
