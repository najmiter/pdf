import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 4,
      },
      manifest: {
        name: 'PdfRizz',
        short_name: 'PdfRizz',
        theme_color: '#FFAD66',
        background_color: '#ffffff',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep each heavy library in its own lazy chunk so it only downloads
        // when the matching dynamic import actually runs
        manualChunks: {
          pdfjs: ['pdfjs-dist', 'vue-pdf-embed'],
          'pdf-lib': ['pdf-lib'],
          jszip: ['jszip'],
          'ui-vendor': ['@iconify/vue', 'lucide-vue-next', 'radix-vue'],
          'utils-vendor': ['@vueuse/core', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
});
