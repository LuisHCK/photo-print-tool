import type { PrintSizePreset } from '@/types/print'

export const PRINT_SIZE_PRESETS: PrintSizePreset[] = [
    { id: '4x6', name: '4 × 6 in', widthMm: 101.6, heightMm: 152.4 },
    { id: '5x7', name: '5 × 7 in', widthMm: 127, heightMm: 177.8 },
    { id: '8x10', name: '8 × 10 in', widthMm: 203.2, heightMm: 254 },
    { id: '3-5x5', name: '3.5 × 5 in', widthMm: 88.9, heightMm: 127 },
    { id: 'wallet', name: 'Wallet (2.5 × 3.5 in)', widthMm: 63.5, heightMm: 88.9 }
]

export function guessPrintSizeFromPhoto(
    widthPx: number,
    heightPx: number
): PrintSizePreset {
    const ratio = widthPx / heightPx
    const targetRatio = 4 / 6
    const tolerance = 0.15
    if (Math.abs(ratio - targetRatio) < tolerance) {
        return PRINT_SIZE_PRESETS[0]
    }
    if (Math.abs(ratio - 5 / 7) < tolerance) {
        return PRINT_SIZE_PRESETS[1]
    }
    if (Math.abs(ratio - 8 / 10) < tolerance) {
        return PRINT_SIZE_PRESETS[2]
    }
    return PRINT_SIZE_PRESETS[0]
}
