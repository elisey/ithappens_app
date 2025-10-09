// ABOUTME: Vitest configuration for testing Preact components with jsdom environment
// ABOUTME: Настройка тестирования с поддержкой TypeScript, путей импорта и coverage отчетов
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.bench.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'src/main.tsx',
      ],
    },
    benchmark: {
      include: ['**/*.bench.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
