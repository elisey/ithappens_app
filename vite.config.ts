// ABOUTME: Vite configuration with Preact preset and path aliases
// ABOUTME: Настройка алиасов путей для удобного импорта файлов через @/
import { resolve } from 'path'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Ensure environment variables are available at build time
    'import.meta.env.VITE_USE_SAMPLE_DATA': JSON.stringify(process.env.VITE_USE_SAMPLE_DATA),
    'import.meta.env.VITE_ENABLE_PERF_LOGGING': JSON.stringify(
      process.env.VITE_ENABLE_PERF_LOGGING
    ),
  },
})
