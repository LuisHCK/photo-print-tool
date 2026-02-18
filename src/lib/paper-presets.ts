import type { PaperPreset } from '@/types/print'

export const PAPER_PRESETS: PaperPreset[] = [
    { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297 },
    { id: 'a5', name: 'A5', widthMm: 148, heightMm: 210 },
    { id: 'letter', name: 'Letter', widthMm: 215.9, heightMm: 279.4 },
    { id: 'legal', name: 'Legal', widthMm: 215.9, heightMm: 355.6 },
    { id: '4x6', name: '4 x 6 in', widthMm: 101.6, heightMm: 152.4 },
    { id: '5x7', name: '5 x 7 in', widthMm: 127, heightMm: 177.8 },
    { id: '8x10', name: '8 x 10 in', widthMm: 203.2, heightMm: 254 }
]
