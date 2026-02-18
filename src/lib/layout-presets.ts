import type { BuiltInLayoutId, LayoutPreset } from '@/types/print'

export const LAYOUT_PRESETS: Array<LayoutPreset & { id: BuiltInLayoutId }> = [
    {
        id: 'single',
        name: 'Full Page (1)',
        columns: 1,
        rows: 1,
        supportsAutoFlow: true,
        repeatSinglePhoto: false,
        defaultCellWidthMm: 127,
        defaultCellHeightMm: 177.8
    },
    {
        id: 'two',
        name: '2 Photos',
        columns: 2,
        rows: 1,
        supportsAutoFlow: true,
        repeatSinglePhoto: false,
        defaultCellWidthMm: 100,
        defaultCellHeightMm: 150
    },
    {
        id: 'four',
        name: '4 Photos',
        columns: 2,
        rows: 2,
        supportsAutoFlow: true,
        repeatSinglePhoto: false,
        defaultCellWidthMm: 89,
        defaultCellHeightMm: 127
    },
    {
        id: 'contact',
        name: 'Contact Sheet',
        columns: 3,
        rows: 4,
        supportsAutoFlow: true,
        repeatSinglePhoto: false,
        defaultCellWidthMm: 50,
        defaultCellHeightMm: 75
    },
    {
        id: 'passport',
        name: 'Passport / ID',
        columns: 2,
        rows: 4,
        supportsAutoFlow: false,
        repeatSinglePhoto: true,
        defaultCellWidthMm: 35,
        defaultCellHeightMm: 45
    }
]
