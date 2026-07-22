import type { TFunction } from 'i18next'

function formatMediaTypeId(id: string): string {
  if (/^\d+$/.test(id)) {
    return `Paper Type ${id}`
  }
  return id
    .replace(/^custom-/i, '')
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function mediaTypeName(id: string, t?: TFunction): string {
  if (t) {
    const key = `mediaTypes.${id}`
    const translated = t(key, { defaultValue: null })
    if (translated !== null) return translated
  }
  return formatMediaTypeId(id)
}
