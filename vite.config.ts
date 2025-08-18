// ABOUTME: Vite configuration with Preact preset and path aliases
// ABOUTME: Настройка алиасов путей для удобного импорта файлов через @/
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})