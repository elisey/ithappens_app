// ABOUTME: Unit tests for theme utility functions
// ABOUTME: Tests system detection, localStorage operations, and theme application

import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  applyTheme,
  createThemeMediaQuery,
  generateThemeVariables,
  getSystemTheme,
  isDarkModeSupported,
  isValidTheme,
  loadThemePreference,
  resolveTheme,
  saveThemePreference,
} from '../../src/utils/themeUtils'

describe('themeUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('getSystemTheme', () => {
    test('returns light when system prefers light', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
      })

      expect(getSystemTheme()).toBe('light')
    })

    test('returns dark when system prefers dark', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      })

      expect(getSystemTheme()).toBe('dark')
    })
  })

  describe('isDarkModeSupported', () => {
    test('returns true when dark mode is supported', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        media: '(prefers-color-scheme: dark)',
      })

      expect(isDarkModeSupported()).toBe(true)
    })

    test('returns false when dark mode is not supported', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        media: 'not all',
      })

      expect(isDarkModeSupported()).toBe(false)
    })
  })

  describe('applyTheme', () => {
    test('sets data-theme attribute for light theme', () => {
      const element = document.createElement('div')
      applyTheme(element, 'light')

      expect(element.getAttribute('data-theme')).toBe('light')
    })

    test('sets data-theme attribute for dark theme', () => {
      const element = document.createElement('div')
      applyTheme(element, 'dark')

      expect(element.getAttribute('data-theme')).toBe('dark')
    })

    test('removes data-theme attribute for auto theme', () => {
      const element = document.createElement('div')
      element.setAttribute('data-theme', 'dark')
      applyTheme(element, 'auto')

      expect(element.getAttribute('data-theme')).toBe(null)
    })
  })

  describe('saveThemePreference', () => {
    test('saves theme to localStorage', () => {
      saveThemePreference('dark')

      expect(localStorage.getItem('ithappens-theme-preference')).toBe('dark')
    })

    test('overwrites existing preference', () => {
      saveThemePreference('light')
      expect(localStorage.getItem('ithappens-theme-preference')).toBe('light')

      saveThemePreference('dark')
      expect(localStorage.getItem('ithappens-theme-preference')).toBe('dark')
    })

    test('handles localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => saveThemePreference('dark')).not.toThrow()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
      setItemSpy.mockRestore()
    })
  })

  describe('loadThemePreference', () => {
    test('loads theme from localStorage', () => {
      localStorage.setItem('ithappens-theme-preference', 'dark')

      expect(loadThemePreference()).toBe('dark')
    })

    test('returns null when no preference is saved', () => {
      expect(loadThemePreference()).toBe(null)
    })

    test('returns null for invalid values', () => {
      localStorage.setItem('ithappens-theme-preference', 'invalid')

      expect(loadThemePreference()).toBe(null)
    })

    test('handles localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(loadThemePreference()).toBe(null)
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
      getItemSpy.mockRestore()
    })
  })

  describe('resolveTheme', () => {
    test('returns light when preference is light', () => {
      expect(resolveTheme('light')).toBe('light')
    })

    test('returns dark when preference is dark', () => {
      expect(resolveTheme('dark')).toBe('dark')
    })

    test('returns system theme when preference is auto', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
      })

      expect(resolveTheme('auto')).toBe('light')
    })

    test('uses system dark theme in auto mode', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      })

      expect(resolveTheme('auto')).toBe('dark')
    })
  })

  describe('createThemeMediaQuery', () => {
    test('returns MediaQueryList for prefers-color-scheme', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
      }

      window.matchMedia = vi.fn().mockReturnValue(mockMediaQueryList)

      const result = createThemeMediaQuery()

      expect(result).toBe(mockMediaQueryList)
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })
  })

  describe('generateThemeVariables', () => {
    test('generates light theme variables', () => {
      const variables = generateThemeVariables('light')

      expect(variables['--color-bg-primary']).toBe('#ffffff')
      expect(variables['--color-text-primary']).toBe('#333333')
      expect(variables['--color-border']).toBe('#e0e0e0')
    })

    test('generates dark theme variables', () => {
      const variables = generateThemeVariables('dark')

      expect(variables['--color-bg-primary']).toBe('#1a1a1a')
      expect(variables['--color-text-primary']).toBe('#e0e0e0')
      expect(variables['--color-border']).toBe('#404040')
    })

    test('includes all required variables', () => {
      const variables = generateThemeVariables('light')

      expect(variables).toHaveProperty('--color-bg-primary')
      expect(variables).toHaveProperty('--color-bg-secondary')
      expect(variables).toHaveProperty('--color-text-primary')
      expect(variables).toHaveProperty('--color-text-secondary')
      expect(variables).toHaveProperty('--color-border')
    })
  })

  describe('isValidTheme', () => {
    test('returns true for valid themes', () => {
      expect(isValidTheme('light')).toBe(true)
      expect(isValidTheme('dark')).toBe(true)
      expect(isValidTheme('auto')).toBe(true)
    })

    test('returns false for invalid themes', () => {
      expect(isValidTheme('invalid')).toBe(false)
      expect(isValidTheme('')).toBe(false)
      expect(isValidTheme('LIGHT')).toBe(false)
      expect(isValidTheme('Dark')).toBe(false)
    })
  })
})
