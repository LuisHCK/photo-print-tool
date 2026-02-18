import type { Unit } from '@/types/print'

const MM_PER_IN = 25.4
const MM_PER_CM = 10

export function toMm(value: number, unit: Unit): number {
    if (unit === 'mm') {
        return value
    }

    if (unit === 'cm') {
        return value * MM_PER_CM
    }

    return value * MM_PER_IN
}

export function fromMm(valueMm: number, unit: Unit): number {
    if (unit === 'mm') {
        return valueMm
    }

    if (unit === 'cm') {
        return valueMm / MM_PER_CM
    }

    return valueMm / MM_PER_IN
}

export function formatValue(valueMm: number, unit: Unit): string {
    const value = fromMm(valueMm, unit)
    const fractionDigits = unit === 'mm' ? 1 : 2
    return value.toFixed(fractionDigits)
}

export function parseInputToMm(value: string, unit: Unit): number | null {
    const parsed = Number(value)

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null
    }

    return toMm(parsed, unit)
}
