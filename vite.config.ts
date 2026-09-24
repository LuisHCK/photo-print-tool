import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

const isDesktop = process.env.VITE_DESKTOP === '1'

// The desktop .app loads from file:// where the origin is null. Module
// scripts, crossorigin stylesheets and the PWA manifest are fetched in CORS
// mode and get blocked ("Origin null is not allowed..."). For desktop builds
// we inline the JS/CSS into index.html and drop the external <link>/<meta>
// tags so index.html is the only request.
function desktopHtml() {
    return {
        name: 'desktop-html',
        transformIndexHtml(html: string) {
            return html
                .replace(
                    /<link[^>]+rel="(?:shortcut icon|apple-touch-icon|manifest|icon)"[^>]*>\s*/g,
                    ''
                )
                .replace(/<meta[^>]+(?:og:image|twitter:image)[^>]*>\s*/g, '')
                .replace(/\s+crossorigin/g, '')
        }
    }
}

// https://vite.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            // The desktop .app loads from file:// where a service worker is
            // useless and can fail to register. Disable it for desktop builds.
            disable: process.env.VITE_DESKTOP === '1',
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'apple-touch-icon.png',
                'favicon-96x96.png',
                'favicon.svg',
                'web-app-manifest-192x192.png',
                'web-app-manifest-512x512.png'
            ],
            workbox: {
                globPatterns: ['**/*.{js,css,html,woff2}'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/analytics\.luisjcenteno\.dev\/.*/i,
                        handler: 'NetworkOnly'
                    }
                ]
            },
            manifest: {
                id: '/',
                name: 'Photo Print Tool',
                short_name: 'Photo Print',
                description:
                    'Prepare precise photo print jobs with predictable physical dimensions.',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: '/web-app-manifest-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/web-app-manifest-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ],
                theme_color: '#faf9f5',
                background_color: '#faf9f5',
                display: 'standalone',
                display_override: ['standalone', 'minimal-ui', 'browser']
            }
        }),
        ...(isDesktop ? [viteSingleFile(), desktopHtml()] : [])
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
})
