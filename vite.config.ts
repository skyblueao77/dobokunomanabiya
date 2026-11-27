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
      includeAssets: ['favicon.ico', 'favicon.png', 'favicon.svg', 'icon-192.png'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Precache only lightweight core shell assets; lazy route chunks & KaTeX fonts cache on demand
        globPatterns: ['assets/index-*.js', 'registerSW.js', 'manifest.webmanifest', 'favicon.{ico,png,svg}', 'icon-192.png'],
        globIgnores: ['assets/index-*.css', 'og-image.png'],
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
                  handlerDidError: async () => {
                    const cacheApi = (
                      globalThis as unknown as {
                        caches?: {
                          match(request: string): Promise<Response | undefined>;
                          open(name: string): Promise<{
                            match(request: string): Promise<Response | undefined>;
                            keys(): Promise<readonly Request[]>;
                          }>;
                        };
                      }
                    ).caches;
                    if (!cacheApi) return Response.error();
                    const rootCached = await cacheApi.match('/');
                    if (rootCached) return rootCached;
                    const pageCache = await cacheApi.open('html-pages-cache');
                    const keys = await pageCache.keys();
                    if (keys.length > 0) {
                      const anyCached = await pageCache.match(keys[0].url);
                      if (anyCached) return anyCached;
                    }
                    return Response.error();
                  },
                },
              ],
            },
          },
          {
            urlPattern: /\/assets\/.*\.(?:js|css|woff2)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hashed-assets-cache',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [200],
              },
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
