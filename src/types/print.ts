export type Unit = 'mm' | 'cm' | 'in'

export type Orientation = 'portrait' | 'landscape'

export type FitMode = 'fit' | 'fill'

export type BuiltInLayoutId = 'single' | 'two' | 'four' | 'contact' | 'passport'

export type LayoutPresetId = string
export type PaperPresetId = string

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
    rotationDeg: number
    fitMode: FitMode
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
