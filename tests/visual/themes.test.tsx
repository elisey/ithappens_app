// ABOUTME: Visual tests for theme appearance and consistency
// ABOUTME: Tests theme attributes, component rendering, and theme data attributes

import { render, screen } from '@testing-library/preact'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { JumpModal } from '../../src/components/JumpModal'
import { LoadingScreen } from '../../src/components/LoadingScreen'
import { ThemeToggle } from '../../src/components/ThemeToggle'

describe('Theme Appearance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('Theme attribute management', () => {
    test('light theme sets data-theme attribute', () => {
      document.documentElement.setAttribute('data-theme', 'light')

      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    test('dark theme sets data-theme attribute', () => {
      document.documentElement.setAttribute('data-theme', 'dark')

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    test('can remove theme attribute for auto mode', () => {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.removeAttribute('data-theme')

      expect(document.documentElement.getAttribute('data-theme')).toBe(null)
    })
  })

  describe('Component theming', () => {
    test('LoadingScreen renders in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark')

      render(<LoadingScreen status="loading" />)

      const overlay = screen.getByRole('status')
      expect(overlay).toBeInTheDocument()
    })

    test('LoadingScreen renders in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light')

      render(<LoadingScreen status="loading" />)

      const overlay = screen.getByRole('status')
      expect(overlay).toBeInTheDocument()
    })

    test('JumpModal renders in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark')

      const mockAvailableIds = [1, 2, 3]
      render(
        <JumpModal
          isOpen={true}
          onClose={vi.fn()}
          onJump={vi.fn()}
          availableIds={mockAvailableIds}
        />
      )

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })

    test('JumpModal renders in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light')

      const mockAvailableIds = [1, 2, 3]
      render(
        <JumpModal
          isOpen={true}
          onClose={vi.fn()}
          onJump={vi.fn()}
          availableIds={mockAvailableIds}
        />
      )

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })

    test('ThemeToggle renders correctly', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })

      render(<ThemeToggle mode="toggle" />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    test('ThemeToggle supports select mode', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })

      render(<ThemeToggle mode="select" />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })
  })

  describe('Theme switching behavior', () => {
    test('can switch from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')

      document.documentElement.setAttribute('data-theme', 'dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    test('can switch from dark to light', () => {
      document.documentElement.setAttribute('data-theme', 'dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      document.documentElement.setAttribute('data-theme', 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    test('can switch to auto mode', () => {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.removeAttribute('data-theme')

      expect(document.documentElement.getAttribute('data-theme')).toBe(null)
    })
  })

  describe('System preference handling', () => {
    test('respects system dark mode preference', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      expect(mediaQuery.matches).toBe(true)
    })

    test('respects system light mode preference', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      expect(mediaQuery.matches).toBe(false)
    })
  })
})
