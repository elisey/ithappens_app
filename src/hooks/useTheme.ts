// ABOUTME: React hook for managing theme state with system preference detection
// ABOUTME: Handles theme persistence, auto-switching, and provides theme control interface
/* eslint-disable no-undef */

import { useEffect, useState } from 'preact/hooks'
import type { Theme, ResolvedTheme } from '../utils/themeUtils'
import {
  applyTheme,
  createThemeMediaQuery,
  getSystemTheme,
  loadThemePreference,
  resolveTheme,
  saveThemePreference,
} from '../utils/themeUtils'

export interface UseThemeResult {
  /** Current theme preference (light, dark, or auto) */
  theme: Theme
  /** Actual resolved theme (light or dark) */
  resolvedTheme: ResolvedTheme
  /** Set the theme preference */
  setTheme: (theme: Theme) => void
  /** Toggle between light and dark (sets preference, not auto) */
  toggleTheme: () => void
  /** Current system theme preference */
  systemTheme: ResolvedTheme
}

/**
 * Hook for managing application theme with system preference detection
 *
 * Features:
 * - Automatic system theme detection
 * - localStorage persistence
 * - Auto-updates when system theme changes
 * - Manual theme override
 */
export function useTheme(): UseThemeResult {
  // Initialize with saved preference or default to auto
  const [theme, setThemeState] = useState<Theme>(() => {
    return loadThemePreference() ?? 'auto'
  })

  // Track system theme separately
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    return getSystemTheme()
  })

  // Resolve the actual theme to apply
  const resolvedTheme = resolveTheme(theme)

  // Apply theme to document on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'auto') {
      applyTheme(root, 'auto')
    } else {
      applyTheme(root, theme)
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = createThemeMediaQuery()
    if (!mediaQuery) return

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Set theme and save to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    saveThemePreference(newTheme)
  }

  // Toggle between light and dark (not auto)
  const toggleTheme = () => {
    const current = resolvedTheme
    const next: Theme = current === 'light' ? 'dark' : 'light'
    setTheme(next)
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    systemTheme,
  }
}
