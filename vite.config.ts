import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En GitHub Pages el sitio vive en /<repo>/; en local, en la raíz.
const base = process.env.GITHUB_PAGES ? '/Food_selector/' : '/'

export default defineConfig({
  base,
  build: { chunkSizeWarningLimit: 1000 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // el registro lo hace src/main.tsx para recargar una vez cuando hay versión nueva
      injectRegister: false,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'La Nevera — ¿qué cocino hoy?',
        short_name: 'La Nevera',
        description: 'Elige lo que tienes y mira qué puedes cocinar.',
        lang: 'es',
        theme_color: '#EEF0EC',
        background_color: '#EEF0EC',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // exceljs (plantillas) solo se usa en el Recetario: se guarda al primer uso.
        // de las fuentes basta el subconjunto latino (incluye tildes y ñ)
        globIgnores: ['**/exceljs*.js', '**/*-{cyrillic,cyrillic-ext,greek,vietnamese,latin-ext}-*.woff2', '**/*.woff'],
        runtimeCaching: [
          {
            urlPattern: /exceljs.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'excel' },
          },
        ],
      },
    }),
  ],
})
