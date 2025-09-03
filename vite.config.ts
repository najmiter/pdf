import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-vendor': ['pdfjs-dist', 'pdf-lib', 'vue-pdf-embed'],
          'ui-vendor': ['@iconify/vue', 'lucide-vue-next', 'radix-vue'],
          'utils-vendor': ['jszip', '@vueuse/core', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
});
