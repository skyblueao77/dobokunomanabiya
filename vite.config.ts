import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'og-image.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff,ttf,webmanifest}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
      },
    }),
  ],
})
