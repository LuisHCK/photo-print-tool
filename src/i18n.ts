import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from '@/locales/en-us.json'
import esLatam from '@/locales/es-latam.json'

export const SUPPORTED_LANGUAGES = ['en-US', 'es-419'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const FALLBACK_LANGUAGE: SupportedLanguage = 'en-US'
const STORAGE_KEY = 'photo-print.language'

const HTML_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
    'en-US': 'en-US',
    'es-419': 'es-419'
}

function normalizeLanguageTag(value: string) {
    return value.trim().toLowerCase()
}

function resolveSupportedLanguage(value: string | null | undefined): SupportedLanguage | null {
    if (!value) {
        return null
    }

    const normalized = normalizeLanguageTag(value)

    if (normalized === 'en-us' || normalized === 'en' || normalized.startsWith('en-')) {
        return 'en-US'
    }

    if (
        normalized === 'es-latam' ||
        normalized === 'es-419' ||
        normalized === 'es' ||
        normalized.startsWith('es-')
    ) {
        return 'es-419'
    }

    for (const supported of SUPPORTED_LANGUAGES) {
        if (normalizeLanguageTag(supported) === normalized) {
            return supported
        }
    }

    return null
}

export function getCurrentSupportedLanguage(): SupportedLanguage {
    return (
        resolveSupportedLanguage(i18n.resolvedLanguage) ??
        resolveSupportedLanguage(i18n.language) ??
        FALLBACK_LANGUAGE
    )
}

function setMetaContent(selector: string, content: string) {
    if (typeof document === 'undefined') {
        return
    }

    const element = document.querySelector(selector)
    if (element) {
        element.setAttribute('content', content)
    }
}

function applyLocalizedMetadata() {
    if (typeof document === 'undefined') {
        return
    }

    const title = i18n.t('meta.title')
    const description = i18n.t('meta.description')
    const appTitle = i18n.t('app.title')

    document.title = title
    document.documentElement.lang = HTML_LANGUAGE_MAP[getCurrentSupportedLanguage()]
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="twitter:title"]', title)
    setMetaContent('meta[property="twitter:description"]', description)
    setMetaContent('meta[name="apple-mobile-web-app-title"]', appTitle)
}

function resolveInitialLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') {
        return FALLBACK_LANGUAGE
    }

    const saved = resolveSupportedLanguage(window.localStorage.getItem(STORAGE_KEY))
    if (saved) {
        return saved
    }

    const browserCandidates = [
        ...(window.navigator.languages ?? []),
        window.navigator.language
    ]

    for (const candidate of browserCandidates) {
        const resolved = resolveSupportedLanguage(candidate)
        if (resolved) {
            return resolved
        }
    }

    return FALLBACK_LANGUAGE
}

i18n.use(initReactI18next).init({
    resources: {
        'en-US': { translation: enUS },
        'es-419': { translation: esLatam }
    },
    showSupportNotice: false,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    lng: resolveInitialLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: {
        escapeValue: false
    }
})

if (typeof window !== 'undefined') {
    i18n.on('languageChanged', (lng) => {
        const resolved = resolveSupportedLanguage(lng)
        if (resolved) {
            window.localStorage.setItem(STORAGE_KEY, resolved)
        }

        applyLocalizedMetadata()
    })

    applyLocalizedMetadata()
}

export default i18n
