// ABOUTME: Test suite for useScrollReset hook
// ABOUTME: Tests scroll position management for story content navigation
/* eslint-disable no-undef */
import { renderHook } from '@testing-library/preact'
import { useRef } from 'preact/hooks'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useScrollReset } from '../../src/hooks/useScrollReset'

describe('useScrollReset', () => {
  let scrollableElement: HTMLDivElement

  beforeEach(() => {
    scrollableElement = document.createElement('div')
    Object.defineProperty(scrollableElement, 'scrollTop', {
      writable: true,
      value: 0,
    })
    document.body.appendChild(scrollableElement)
  })

  afterEach(() => {
    document.body.removeChild(scrollableElement)
    vi.clearAllMocks()
  })

  it('resets scroll position when resetOn dependency changes', () => {
    const { rerender } = renderHook(
      ({ storyId }) => {
        const ref = useRef<HTMLDivElement>(scrollableElement)
        useScrollReset(ref, { resetOn: [storyId] })
        return ref
      },
      { initialProps: { storyId: 1 } }
    )

    // Set scroll position
    scrollableElement.scrollTop = 500

    // Change story ID
    rerender({ storyId: 2 })

    // Scroll should be reset
    expect(scrollableElement.scrollTop).toBe(0)
  })

  it('does not reset scroll without resetOn dependencies', () => {
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(scrollableElement)
      useScrollReset(ref)
      return ref
    })

    scrollableElement.scrollTop = 500

    // Scroll should remain unchanged
    expect(scrollableElement.scrollTop).toBe(500)
  })

  it('handles null ref gracefully', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null)
      useScrollReset(ref, { resetOn: [1] })
      return ref
    })

    // Should not throw error
    expect(() => result.current).not.toThrow()
  })

  it('resets to top on multiple dependency changes', () => {
    const { rerender } = renderHook(
      ({ storyId }) => {
        const ref = useRef<HTMLDivElement>(scrollableElement)
        useScrollReset(ref, { resetOn: [storyId] })
        return ref
      },
      { initialProps: { storyId: 1 } }
    )

    scrollableElement.scrollTop = 300
    rerender({ storyId: 2 })
    expect(scrollableElement.scrollTop).toBe(0)

    scrollableElement.scrollTop = 400
    rerender({ storyId: 3 })
    expect(scrollableElement.scrollTop).toBe(0)
  })

  it('uses smooth scroll behavior when specified', () => {
    const scrollToMock = vi.fn()
    scrollableElement.scrollTo = scrollToMock

    const { rerender } = renderHook(
      ({ storyId }) => {
        const ref = useRef<HTMLDivElement>(scrollableElement)
        useScrollReset(ref, { resetOn: [storyId], behavior: 'smooth' })
        return ref
      },
      { initialProps: { storyId: 1 } }
    )

    rerender({ storyId: 2 })

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('uses instant scroll behavior by default', () => {
    const scrollToMock = vi.fn()
    scrollableElement.scrollTo = scrollToMock

    const { rerender } = renderHook(
      ({ storyId }) => {
        const ref = useRef<HTMLDivElement>(scrollableElement)
        useScrollReset(ref, { resetOn: [storyId] })
        return ref
      },
      { initialProps: { storyId: 1 } }
    )

    rerender({ storyId: 2 })

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('does not reset when dependencies remain unchanged', () => {
    const scrollToMock = vi.fn()
    scrollableElement.scrollTo = scrollToMock

    const { rerender } = renderHook(
      ({ storyId }) => {
        const ref = useRef<HTMLDivElement>(scrollableElement)
        useScrollReset(ref, { resetOn: [storyId] })
        return ref
      },
      { initialProps: { storyId: 1 } }
    )

    scrollToMock.mockClear()
    rerender({ storyId: 1 })

    expect(scrollToMock).not.toHaveBeenCalled()
  })
})
