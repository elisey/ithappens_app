// ABOUTME: Unit tests for useTheme hook
// ABOUTME: Tests theme detection, persistence, system preference changes, and theme application
/* eslint-disable no-undef */

import { renderHook, waitFor } from '@testing-library/preact'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useTheme } from '../../src/hooks/useTheme'

describe('useTheme', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>
  let listeners: ((e: MediaQueryListEvent) => void)[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    listeners = []

    // Clear localStorage
    localStorage.clear()

    // Clear document theme attribute
    document.documentElement.removeAttribute('data-theme')

    // Mock matchMedia
    mockMatchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        listeners.push(listener)
      }),
      removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((l) => l !== listener)
      }),
      addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
        listeners.push(listener)
      }),
      removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((l) => l !== listener)
      }),
    }))

    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia
  })

  test('detects system theme preference', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.systemTheme).toBe('light')
  })

  test('defaults to auto theme when no preference saved', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('auto')
  })

  test('resolves to system theme in auto mode', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('auto')
    expect(result.current.resolvedTheme).toBe('light')
  })

  test('persists theme choice to localStorage', () => {
    const { result } = renderHook(() => useTheme())

    result.current.setTheme('dark')

    expect(localStorage.getItem('ithappens-theme-preference')).toBe('dark')
  })

  test('loads theme preference from localStorage', () => {
    localStorage.setItem('ithappens-theme-preference', 'dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  test('toggles between light and dark themes', async () => {
    const { result, rerender } = renderHook(() => useTheme())

    // Start with auto (resolves to light)
    expect(result.current.resolvedTheme).toBe('light')

    // Toggle should switch to dark
    result.current.toggleTheme()
    rerender()

    await waitFor(() => {
      expect(result.current.theme).toBe('dark')
    })

    // Toggle again should switch to light
    result.current.toggleTheme()
    rerender()

    await waitFor(() => {
      expect(result.current.theme).toBe('light')
    })
  })

  test('applies theme to document element', async () => {
    const { result, rerender } = renderHook(() => useTheme())

    result.current.setTheme('dark')
    rerender()

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  test('removes theme attribute in auto mode', async () => {
    const { result, rerender } = renderHook(() => useTheme())

    result.current.setTheme('dark')
    rerender()

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    result.current.setTheme('auto')
    rerender()

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe(null)
    })
  })

  test('responds to system theme changes in auto mode', async () => {
    // Mock dark mode preference
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        listeners.push(listener)
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })

    const { result, rerender } = renderHook(() => useTheme())

    // Set to auto mode
    result.current.setTheme('auto')

    // Simulate system theme change
    const event = { matches: true } as MediaQueryListEvent
    listeners.forEach((listener) => listener(event))

    await waitFor(() => {
      expect(result.current.systemTheme).toBe('dark')
    })

    rerender()
    expect(result.current.resolvedTheme).toBe('dark')
  })

  test('does not respond to system changes when theme is manually set', async () => {
    const { result, rerender } = renderHook(() => useTheme())

    // Manually set theme to light
    result.current.setTheme('light')
    rerender()

    await waitFor(() => {
      expect(result.current.theme).toBe('light')
    })

    // Simulate system theme change to dark
    const event = { matches: true } as MediaQueryListEvent
    listeners.forEach((listener) => listener(event))

    await waitFor(() => {
      expect(result.current.systemTheme).toBe('dark')
    })

    // Resolved theme should still be light (manual override)
    expect(result.current.resolvedTheme).toBe('light')
  })

  test('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useTheme())

    expect(listeners.length).toBeGreaterThan(0)

    unmount()

    expect(listeners.length).toBe(0)
  })

  test('handles invalid localStorage values gracefully', () => {
    localStorage.setItem('ithappens-theme-preference', 'invalid-theme')

    const { result } = renderHook(() => useTheme())

    // Should default to auto
    expect(result.current.theme).toBe('auto')
  })

  test('setTheme validates theme value', async () => {
    const { result, rerender } = renderHook(() => useTheme())

    result.current.setTheme('light')
    rerender()

    await waitFor(() => {
      expect(result.current.theme).toBe('light')
    })

    result.current.setTheme('dark')
    rerender()

    await waitFor(() => {
      expect(result.current.theme).toBe('dark')
    })

    result.current.setTheme('auto')
    rerender()

    await waitFor(() => {
      expect(result.current.theme).toBe('auto')
    })
  })

  test('resolvedTheme matches theme when not in auto mode', async () => {
    const { result, rerender } = renderHook(() => useTheme())

    result.current.setTheme('light')
    rerender()

    await waitFor(() => {
      expect(result.current.resolvedTheme).toBe('light')
    })

    result.current.setTheme('dark')
    rerender()

    await waitFor(() => {
      expect(result.current.resolvedTheme).toBe('dark')
    })
  })

  test('detects dark mode system preference correctly', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.systemTheme).toBe('dark')
  })
})
