// ABOUTME: Test setup file with global configurations for testing environment
// ABOUTME: Настройка глобального окружения для тестов, включая jest-dom матчеры
import '@testing-library/jest-dom'

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
})
