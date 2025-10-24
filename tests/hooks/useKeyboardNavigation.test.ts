// ABOUTME: Unit tests for useKeyboardNavigation hook
// ABOUTME: Tests keyboard event handling, shortcuts, and context awareness
/* eslint-disable no-undef */

import { renderHook, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKeyboardNavigation } from '../../src/hooks/useKeyboardNavigation'

describe('useKeyboardNavigation', () => {
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
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('arrow key navigation', () => {
    it('navigates with arrow keys', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(rightEvent)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)

      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      document.dispatchEvent(leftEvent)
      expect(handlers.onPrevious).toHaveBeenCalledTimes(1)
    })
  })

  describe('alternative shortcuts', () => {
    it('supports alternative shortcuts (j/k)', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const jEvent = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(jEvent)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)

      const kEvent = new KeyboardEvent('keydown', { key: 'k' })
      document.dispatchEvent(kEvent)
      expect(handlers.onPrevious).toHaveBeenCalledTimes(1)
    })

    it('supports jump shortcut (g)', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const gEvent = new KeyboardEvent('keydown', { key: 'g' })
      document.dispatchEvent(gEvent)
      expect(handlers.onJump).toHaveBeenCalledTimes(1)
    })

    it('supports help shortcuts (?/h)', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const qEvent = new KeyboardEvent('keydown', { key: '?' })
      document.dispatchEvent(qEvent)
      expect(handlers.onHelp).toHaveBeenCalledTimes(1)

      const hEvent = new KeyboardEvent('keydown', { key: 'h' })
      document.dispatchEvent(hEvent)
      expect(handlers.onHelp).toHaveBeenCalledTimes(2)
    })
  })

  describe('input element handling', () => {
    it('ignores shortcuts when input is focused', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('ignores shortcuts when textarea is focused', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      const event = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('ignores shortcuts on contentEditable elements', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      document.body.appendChild(div)
      div.focus()

      const event = new KeyboardEvent('keydown', { key: 'k' })
      document.dispatchEvent(event)

      expect(handlers.onPrevious).not.toHaveBeenCalled()

      document.body.removeChild(div)
    })
  })

  describe('enable/disable functionality', () => {
    it('can be disabled and enabled', async () => {
      const { result } = renderHook(() => useKeyboardNavigation(handlers))

      expect(result.current.isEnabled).toBe(true)

      result.current.disable()
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(false)
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(event)
      expect(handlers.onNext).not.toHaveBeenCalled()

      result.current.enable()
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      document.dispatchEvent(event)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)
    })

    it('can be initially disabled via options', () => {
      renderHook(() => useKeyboardNavigation(handlers, { enabled: false }))

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()
    })
  })

  describe('preventDefault behavior', () => {
    it('prevents default browser behavior by default', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('respects preventDefault option', () => {
      renderHook(() => useKeyboardNavigation(handlers, { preventDefault: false }))

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('modifier key handling', () => {
    it('ignores shortcuts with Ctrl modifier', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()
    })

    it('ignores shortcuts with Alt modifier', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()
    })

    it('ignores shortcuts with Meta modifier', () => {
      renderHook(() => useKeyboardNavigation(handlers))

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()
    })
  })

  describe('custom shortcuts', () => {
    it('handles multiple shortcuts for same action', () => {
      renderHook(() =>
        useKeyboardNavigation(handlers, {
          shortcuts: {
            next: ['ArrowRight', 'd', 'l'],
          },
        })
      )

      const arrow = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(arrow)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)

      const d = new KeyboardEvent('keydown', { key: 'd' })
      document.dispatchEvent(d)
      expect(handlers.onNext).toHaveBeenCalledTimes(2)

      const l = new KeyboardEvent('keydown', { key: 'l' })
      document.dispatchEvent(l)
      expect(handlers.onNext).toHaveBeenCalledTimes(3)
    })

    it('allows overriding default shortcuts', () => {
      renderHook(() =>
        useKeyboardNavigation(handlers, {
          shortcuts: {
            next: ['n'],
            previous: ['p'],
          },
        })
      )

      const nEvent = new KeyboardEvent('keydown', { key: 'n' })
      document.dispatchEvent(nEvent)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)

      const pEvent = new KeyboardEvent('keydown', { key: 'p' })
      document.dispatchEvent(pEvent)
      expect(handlers.onPrevious).toHaveBeenCalledTimes(1)

      // Old shortcuts should not work
      const jEvent = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(jEvent)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardNavigation(handlers))

      unmount()

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(event)

      expect(handlers.onNext).not.toHaveBeenCalled()
    })
  })

  describe('handler updates', () => {
    it('uses updated handlers without re-registering listeners', () => {
      const { rerender } = renderHook(({ handlers }) => useKeyboardNavigation(handlers), {
        initialProps: { handlers },
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      document.dispatchEvent(event)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)

      const newHandlers = {
        ...handlers,
        onNext: vi.fn(),
      }

      rerender({ handlers: newHandlers })

      document.dispatchEvent(event)
      expect(newHandlers.onNext).toHaveBeenCalledTimes(1)
      expect(handlers.onNext).toHaveBeenCalledTimes(1)
    })
  })
})
