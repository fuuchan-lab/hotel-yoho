import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// 地図のタイル（国土地理院）。一度見た範囲は、電波が弱い時にも表示する
const TILE_HOSTS = /^https:\/\/cyberjapandata\.gsi\.go\.jp\//

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1600 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'ホテル予報 Hotel Forecast',
        short_name: 'ホテル予報',
        description: '日本の主要都市のホテルの空室・料金高騰を、天気予報のように2か月先まで予報。大型イベントのカレンダー付き',
        lang: 'ja',
        id: './',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['travel', 'business'],
        start_url: './',
        scope: './',
        background_color: '#0e4f7a',
        theme_color: '#0e4f7a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // help.html・privacy.html はアプリ（SPA）ではない単独のページ。指定しないと、オフライン対応の仕組みがアプリの画面を返してしまう
        navigateFallbackDenylist: [/\/(help|privacy)\.html(\?.*)?$/, /\/\.well-known\//],
        runtimeCaching: [
          {
            urlPattern: TILE_HOSTS,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 日本の排他的経済水域の範囲（めったに変わらない）
            urlPattern: /\/data\/(area|rail)\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'map-data', cacheableResponse: { statuses: [0, 200] } },
          },
          {
            // イベント情報は、新しいものがあれば次に開いた時に反映する
            urlPattern: /\/data\/events\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'events', cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
})
