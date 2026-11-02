import type { PrintSizePreset } from '@/types/print'

export const PRINT_SIZE_PRESETS: PrintSizePreset[] = [
    { id: 'carnet', name: 'Carnet (4.5 × 3.5 cm)', widthMm: 35, heightMm: 45 },
    { id: 'passport', name: 'Passport (5 × 4 cm)', widthMm: 40, heightMm: 50 },
    { id: 'us-visa', name: 'US visa (5 × 5 cm)', widthMm: 50, heightMm: 50 },
    { id: 'diploma', name: 'Diploma (5 × 4 cm)', widthMm: 40, heightMm: 50 },
    { id: '4x6', name: 'Photo 4 × 6 in', widthMm: 101.6, heightMm: 152.4 },
    { id: '5x7', name: 'Photo 5 × 7 in', widthMm: 127, heightMm: 177.8 },
    { id: '8x10', name: 'Photo 8 × 10 in', widthMm: 203.2, heightMm: 254 }
]

function findPreset(id: PrintSizePreset['id']): PrintSizePreset {
    return PRINT_SIZE_PRESETS.find((preset) => preset.id === id) ?? PRINT_SIZE_PRESETS[0]
}

export function guessPrintSizeFromPhoto(
    widthPx: number,
    heightPx: number
): PrintSizePreset {
    const ratio = widthPx / heightPx
    const tolerance = 0.15

    if (Math.abs(ratio - 4 / 6) < tolerance) {
        return findPreset('4x6')
    }
    if (Math.abs(ratio - 5 / 7) < tolerance) {
        return findPreset('5x7')
    }
    if (Math.abs(ratio - 8 / 10) < tolerance) {
        return findPreset('8x10')
    }
    return findPreset('4x6')
}
