// ABOUTME: Unit tests for device detection utilities
// ABOUTME: Tests platform detection, viewport queries, and capability checking

import { describe, test, expect } from 'vitest'
import {
  isTouchDevice,
  isIOS,
  isAndroid,
  isMobile,
  getViewportSize,
  isLandscape,
  supportsVibration,
  prefersReducedMotion,
  prefersDarkMode,
  getPixelRatio,
  isStandalone,
} from '../../src/utils/deviceUtils'

describe('Device Utilities', () => {
  describe('Touch Detection', () => {
    test('isTouchDevice returns boolean', () => {
      const result = isTouchDevice()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Platform Detection', () => {
    test('isIOS returns boolean', () => {
      const result = isIOS()
      expect(typeof result).toBe('boolean')
    })

    test('isAndroid returns boolean', () => {
      const result = isAndroid()
      expect(typeof result).toBe('boolean')
    })

    test('isMobile returns boolean', () => {
      const result = isMobile()
      expect(typeof result).toBe('boolean')
    })

    test('iOS and Android are mutually exclusive', () => {
      // A device cannot be both iOS and Android
      if (isIOS()) {
        expect(isAndroid()).toBe(false)
      }
      if (isAndroid()) {
        expect(isIOS()).toBe(false)
      }
    })
  })

  describe('Viewport Utilities', () => {
    test('getViewportSize returns valid dimensions', () => {
      const size = getViewportSize()

      expect(size).toHaveProperty('width')
      expect(size).toHaveProperty('height')
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
      expect(typeof size.width).toBe('number')
      expect(typeof size.height).toBe('number')
    })

    test('isLandscape matches viewport orientation', () => {
      const result = isLandscape()
      const size = getViewportSize()

      expect(result).toBe(size.width > size.height)
    })
  })

  describe('Capability Detection', () => {
    test('supportsVibration returns boolean', () => {
      const result = supportsVibration()
      expect(typeof result).toBe('boolean')
    })

    test('prefersReducedMotion returns boolean', () => {
      const result = prefersReducedMotion()
      expect(typeof result).toBe('boolean')
    })

    test('prefersDarkMode returns boolean', () => {
      const result = prefersDarkMode()
      expect(typeof result).toBe('boolean')
    })

    test('getPixelRatio returns positive number', () => {
      const ratio = getPixelRatio()
      expect(typeof ratio).toBe('number')
      expect(ratio).toBeGreaterThan(0)
    })

    test('isStandalone returns boolean', () => {
      const result = isStandalone()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Media Query Consistency', () => {
    test('prefersReducedMotion matches media query', () => {
      const result = prefersReducedMotion()
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

      expect(result).toBe(mediaQuery.matches)
    })

    test('prefersDarkMode matches media query', () => {
      const result = prefersDarkMode()
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      expect(result).toBe(mediaQuery.matches)
    })
  })
})
