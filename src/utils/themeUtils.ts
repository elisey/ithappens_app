// ABOUTME: Utility functions for theme management and system preference detection
// ABOUTME: Handles localStorage persistence, system theme detection, and theme application
/* eslint-disable no-undef */

export type Theme = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'ithappens-theme-preference'
const THEME_ATTRIBUTE = 'data-theme'

/**
 * Detects the current system theme preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

/**
 * Checks if dark mode is supported by the browser
 */
export function isDarkModeSupported(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all'
}

/**
 * Applies the theme to the specified element
 */
export function applyTheme(element: HTMLElement, theme: ResolvedTheme | 'auto'): void {
  if (theme === 'auto') {
    // Remove the attribute to let CSS media query handle it
    element.removeAttribute(THEME_ATTRIBUTE)
  } else {
    element.setAttribute(THEME_ATTRIBUTE, theme)
  }
}

/**
 * Saves the user's theme preference to localStorage
 */
export function saveThemePreference(theme: Theme): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('[Theme] Failed to save theme preference:', error)
  }
}

/**
 * Loads the user's theme preference from localStorage
 */
export function loadThemePreference(): Theme | null {
  try {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored
    }
    return null
  } catch (error) {
    console.warn('[Theme] Failed to load theme preference:', error)
    return null
  }
}

/**
 * Resolves the actual theme based on preference and system settings
 */
export function resolveTheme(preference: Theme): ResolvedTheme {
  if (preference === 'auto') {
    return getSystemTheme()
  }
  return preference
}

/**
 * Creates a MediaQueryList for system theme changes
 */
export function createThemeMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined') return null
  return window.matchMedia('(prefers-color-scheme: dark)')
}

/**
 * Generates CSS variable overrides for a theme (for testing/debugging)
 */
export function generateThemeVariables(theme: ResolvedTheme): Record<string, string> {
  const variables: Record<string, string> = {}

  if (theme === 'light') {
    variables['--color-bg-primary'] = '#ffffff'
    variables['--color-bg-secondary'] = '#f5f5f5'
    variables['--color-text-primary'] = '#333333'
    variables['--color-text-secondary'] = '#666666'
    variables['--color-border'] = '#e0e0e0'
  } else {
    variables['--color-bg-primary'] = '#1a1a1a'
    variables['--color-bg-secondary'] = '#2a2a2a'
    variables['--color-text-primary'] = '#e0e0e0'
    variables['--color-text-secondary'] = '#b0b0b0'
    variables['--color-border'] = '#404040'
  }

  return variables
}

/**
 * Validates a theme value
 */
export function isValidTheme(value: string): value is Theme {
  return value === 'light' || value === 'dark' || value === 'auto'
}
