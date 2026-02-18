import type { LayoutPreset, PaperPreset } from '@/types/print'

const STORAGE_KEY = 'photo-print.custom-presets.v1'
const STORAGE_VERSION = 1
const MAX_LAYOUT_DIMENSION = 50
const MIN_MM = 0.001

interface StoredCustomPresets {
    version: number
    papers: PaperPreset[]
    layouts: LayoutPreset[]
}

function safeJsonParse(value: string): unknown {
    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

function hasLocalStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function sanitizeString(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
}

function sanitizeNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : NaN
}

function sanitizePaperPreset(value: unknown): PaperPreset | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const candidate = value as Record<string, unknown>
    const id = sanitizeString(candidate.id)
    const name = sanitizeString(candidate.name)
    const widthMm = sanitizeNumber(candidate.widthMm)
    const heightMm = sanitizeNumber(candidate.heightMm)

    if (!id || !name || widthMm <= MIN_MM || heightMm <= MIN_MM) {
        return null
    }

    return { id, name, widthMm, heightMm }
}

function sanitizeLayoutPreset(value: unknown): LayoutPreset | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const candidate = value as Record<string, unknown>
    const id = sanitizeString(candidate.id)
    const name = sanitizeString(candidate.name)
    const columns = sanitizeNumber(candidate.columns)
    const rows = sanitizeNumber(candidate.rows)
    const defaultCellWidthMm = sanitizeNumber(candidate.defaultCellWidthMm)
    const defaultCellHeightMm = sanitizeNumber(candidate.defaultCellHeightMm)
    const supportsAutoFlow = candidate.supportsAutoFlow === true
    const repeatSinglePhoto = candidate.repeatSinglePhoto === true

    if (
        !id ||
        !name ||
        !Number.isInteger(columns) ||
        !Number.isInteger(rows) ||
        columns < 1 ||
        rows < 1 ||
        columns > MAX_LAYOUT_DIMENSION ||
        rows > MAX_LAYOUT_DIMENSION ||
        defaultCellWidthMm <= MIN_MM ||
        defaultCellHeightMm <= MIN_MM
    ) {
        return null
    }

    return {
        id,
        name,
        columns,
        rows,
        supportsAutoFlow,
        repeatSinglePhoto,
        defaultCellWidthMm,
        defaultCellHeightMm
    }
}

export function loadCustomPresets(): {
    papers: PaperPreset[]
    layouts: LayoutPreset[]
} {
    if (!hasLocalStorage()) {
        return { papers: [], layouts: [] }
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
        return { papers: [], layouts: [] }
    }

    const parsed = safeJsonParse(raw)

    if (!parsed || typeof parsed !== 'object') {
        return { papers: [], layouts: [] }
    }

    const payload = parsed as Partial<StoredCustomPresets>

    if (payload.version !== STORAGE_VERSION) {
        return { papers: [], layouts: [] }
    }

    const papers = Array.isArray(payload.papers)
        ? payload.papers
              .map((preset) => sanitizePaperPreset(preset))
              .filter((preset): preset is PaperPreset => preset !== null)
        : []

    const layouts = Array.isArray(payload.layouts)
        ? payload.layouts
              .map((preset) => sanitizeLayoutPreset(preset))
              .filter((preset): preset is LayoutPreset => preset !== null)
        : []

    return { papers, layouts }
}

export function saveCustomPresets(papers: PaperPreset[], layouts: LayoutPreset[]) {
    if (!hasLocalStorage()) {
        return
    }

    const payload: StoredCustomPresets = {
        version: STORAGE_VERSION,
        papers,
        layouts
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function slugifyPresetName(name: string) {
    const normalized = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    return normalized || 'preset'
}

export function buildUniqueCustomPresetId(
    prefix: 'paper' | 'layout',
    name: string,
    existingIds: Set<string>
) {
    const base = `custom-${prefix}-${slugifyPresetName(name)}`

    if (!existingIds.has(base)) {
        return base
    }

    let suffix = 2
    while (existingIds.has(`${base}-${suffix}`)) {
        suffix += 1
    }

    return `${base}-${suffix}`
}
