import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
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
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
})
