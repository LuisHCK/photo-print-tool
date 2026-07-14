export type Unit = 'mm' | 'cm' | 'in'

export type Orientation = 'portrait' | 'landscape'

export type FitMode = 'fit' | 'fill'

export type GridAlignment =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

export type BuiltInLayoutId = 'single' | 'two' | 'four' | 'contact' | 'passport'

export type LayoutPresetId = string
export type PaperPresetId = string

export type PrintSizeId = '4x6' | '5x7' | '8x10' | '3-5x5' | 'wallet' | 'custom'

export interface PrintSizePreset {
    id: PrintSizeId
    name: string
    widthMm: number
    heightMm: number
}

export type SettingsSectionId =
    | 'layout'
    | 'sizeAndSpacing'
    | 'guidesAndAlignment'
    | 'selectedPhoto'

export interface PaperPreset {
    id: PaperPresetId
    name: string
    widthMm: number
    heightMm: number
}

export interface LayoutPreset {
    id: LayoutPresetId
    name: string
    columns: number
    rows: number
    supportsAutoFlow: boolean
    repeatSinglePhoto: boolean
    defaultCellWidthMm: number
    defaultCellHeightMm: number
}

export interface PhotoItem {
    id: string
    name: string
    url: string
    widthPx: number
    heightPx: number
    copies: number
    rotationDeg: number
    fitMode: FitMode
    manualPositionEnabled: boolean
    nudgeUpPct: number
    nudgeRightPct: number
    nudgeDownPct: number
    nudgeLeftPct: number
    selected: boolean
}

export interface SlotAssignment {
    slotIndex: number
    photo: PhotoItem | null
}

export interface PageAssignment {
    pageIndex: number
    slots: SlotAssignment[]
}

export interface PrintSettingsSnapshot {
    paperId: PaperPresetId
    layoutId: LayoutPresetId
    orientation: Orientation
    unit: Unit
    layoutColumns: number
    layoutRows: number
    maxCopiesPerPage?: number
    cellWidthMm: number
    cellHeightMm: number
    marginMm: number
    gapMm?: number
    horizontalGapMm: number
    verticalGapMm: number
    showCropGuides: boolean
    gridAlignment: GridAlignment
}

export interface CustomPreset {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    settings: PrintSettingsSnapshot
}
