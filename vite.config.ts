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
      includeAssets: ['favicon.ico', 'favicon.png', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'og-image.png'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,svg,png,woff2,webmanifest}'],
        globIgnores: ['assets/index-*.css'],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-pages-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [200],
              },
              plugins: [
                {
                  handlerDidError: async () =>
                    (await (
                      globalThis as unknown as {
                        caches?: { match(request: string): Promise<Response | undefined> };
                      }
                    ).caches?.match('/')) ?? Response.error(),
                },
              ],
            },
          },
          {
            urlPattern: /\.(?:woff|ttf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'legacy-fonts-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
