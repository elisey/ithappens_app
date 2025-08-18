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
})
