// ABOUTME: Integration tests for keyboard navigation flow
// ABOUTME: Tests complete keyboard navigation scenarios with modals and conflicts
/* eslint-disable no-undef */

import { renderHook, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyboardNavigation } from '../../src/hooks/useKeyboardNavigation'

describe('Keyboard Navigation Integration', () => {
  let handlers: {
    onNext: ReturnType<typeof vi.fn>
    onPrevious: ReturnType<typeof vi.fn>
    onJump: ReturnType<typeof vi.fn>
    onHelp: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    handlers = {
      onNext: vi.fn(),
      onPrevious: vi.fn(),
      onJump: vi.fn(),
      onHelp: vi.fn(),
    }
    vi.clearAllMocks()
  })

  it('integrates keyboard shortcuts with application flow', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(handlers, {
        enabled: true,
        preventDefault: true,
      })
    )

    expect(result.current.isEnabled).toBe(true)

    // Test navigation shortcuts
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(handlers.onNext).toHaveBeenCalledTimes(1)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }))
    expect(handlers.onNext).toHaveBeenCalledTimes(2)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(handlers.onPrevious).toHaveBeenCalledTimes(1)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    expect(handlers.onPrevious).toHaveBeenCalledTimes(2)

    // Test jump shortcut
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
    expect(handlers.onJump).toHaveBeenCalledTimes(1)

    // Test help shortcuts
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(handlers.onHelp).toHaveBeenCalledTimes(1)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))
    expect(handlers.onHelp).toHaveBeenCalledTimes(2)
  })

  it('disables shortcuts when modal is open', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useKeyboardNavigation(handlers, { enabled }),
      { initialProps: { enabled: true } }
    )

    // Initially enabled
    expect(result.current.isEnabled).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(handlers.onNext).toHaveBeenCalledTimes(1)

    // Simulate modal opening (disable shortcuts)
    rerender({ enabled: false })
    await waitFor(() => {
      expect(result.current.isEnabled).toBe(false)
    })

    // Try to navigate (should not work)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(handlers.onNext).toHaveBeenCalledTimes(1) // Still 1, not 2

    // Simulate modal closing (enable shortcuts)
    rerender({ enabled: true })
    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true)
    })

    // Navigation should work again
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(handlers.onNext).toHaveBeenCalledTimes(2)
  })

  it('prevents default browser behavior', () => {
    renderHook(() =>
      useKeyboardNavigation(handlers, {
        enabled: true,
        preventDefault: true,
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(handlers.onNext).toHaveBeenCalledTimes(1)
  })

  it('ignores shortcuts when input element is focused', () => {
    renderHook(() => useKeyboardNavigation(handlers))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(handlers.onNext).not.toHaveBeenCalled()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }))
    expect(handlers.onNext).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('handles multiple handlers in sequence', () => {
    renderHook(() => useKeyboardNavigation(handlers))

    // Navigate through a sequence
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))

    expect(handlers.onNext).toHaveBeenCalledTimes(2)
    expect(handlers.onPrevious).toHaveBeenCalledTimes(1)
    expect(handlers.onJump).toHaveBeenCalledTimes(1)
    expect(handlers.onHelp).toHaveBeenCalledTimes(1)
  })
})
