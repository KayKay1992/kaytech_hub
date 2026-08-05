import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // offline.html (in public/) is a plain file in the dist output, so
        // this glob picks it up like any other precached asset — sw.js
        // looks it up via workbox-precaching's matchPrecache, which knows
        // how to resolve the revisioned cache key back to its plain URL.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'KayTech Hub',
        short_name: 'KayTech',
        description: 'Practical, job-ready tech courses, business mentorship, and a co-working space in Port Harcourt.',
        theme_color: '#10142B',
        background_color: '#F5F6FA',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        // Lets `npm run dev` also register a (dev-mode) service worker so
        // install/offline behavior can be poked at without a full build —
        // DevTools throttling/offline still needs `npm run build && npm run
        // preview` for the real precached-asset behavior, see README notes.
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
