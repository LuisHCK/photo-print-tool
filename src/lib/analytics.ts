declare global {
    interface Window {
        umami?: {
            track: (event: string, data?: Record<string, string | number | boolean>) => void
        }
    }
}

const UMAMI_URL = import.meta.env.VITE_UMAMI_URL as string | undefined
const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined

export function initAnalytics() {
    if (typeof document === 'undefined' || !UMAMI_URL || !UMAMI_WEBSITE_ID) {
        return
    }

    if (document.querySelector(`script[data-website-id="${UMAMI_WEBSITE_ID}"]`)) {
        return
    }

    const script = document.createElement('script')
    script.defer = true
    script.src = UMAMI_URL
    script.setAttribute('data-website-id', UMAMI_WEBSITE_ID)
    document.head.appendChild(script)
}

export function trackEvent(
    event: string,
    data?: Record<string, string | number | boolean>
) {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
        return
    }

    try {
        window.umami?.track(event, data)
    } catch {
        // analytics unavailable
    }
}
