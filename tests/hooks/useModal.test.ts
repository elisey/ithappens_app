// ABOUTME: Unit tests for useModal hook
// ABOUTME: Tests ESC key handling, outside clicks, focus management
/* eslint-disable no-undef */

import { fireEvent, renderHook } from '@testing-library/preact'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useModal } from '../../src/hooks/useModal'

describe('useModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns modalRef and handlers', () => {
    const { result } = renderHook(() => useModal(true))

    expect(result.current.modalRef).toBeDefined()
    expect(result.current.handleKeyDown).toBeInstanceOf(Function)
    expect(result.current.handleOverlayClick).toBeInstanceOf(Function)
  })

  test('calls onEscape when Escape pressed', () => {
    const onEscape = vi.fn()

    renderHook(() => useModal(true, { onEscape }))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    expect(onEscape).toHaveBeenCalled()
  })

  test('does not call onEscape when modal is closed', () => {
    const onEscape = vi.fn()

    renderHook(() => useModal(false, { onEscape }))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    expect(onEscape).not.toHaveBeenCalled()
  })

  test('calls onClickOutside for overlay clicks', () => {
    const onClickOutside = vi.fn()

    const { result } = renderHook(() => useModal(true, { onClickOutside }))

    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div'),
    }

    // Simulate clicking on overlay (target === currentTarget)
    mockEvent.target = mockEvent.currentTarget
    result.current.handleOverlayClick(mockEvent as unknown as MouseEvent)

    expect(onClickOutside).toHaveBeenCalled()
  })

  test('ignores clicks inside modal', () => {
    const onClickOutside = vi.fn()

    const { result } = renderHook(() => useModal(true, { onClickOutside }))

    const overlay = document.createElement('div')
    const modal = document.createElement('div')
    overlay.appendChild(modal)

    const mockEvent = {
      target: modal,
      currentTarget: overlay,
    }

    // Simulate clicking on modal content (target !== currentTarget)
    result.current.handleOverlayClick(mockEvent as unknown as MouseEvent)

    expect(onClickOutside).not.toHaveBeenCalled()
  })

  test('stores and restores focus', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()

    expect(document.activeElement).toBe(button)

    const { rerender } = renderHook(({ isOpen }) => useModal(isOpen, { restoreFocus: true }), {
      initialProps: { isOpen: true },
    })

    // Close modal
    rerender({ isOpen: false })

    // Focus should be restored to button
    expect(document.activeElement).toBe(button)

    document.body.removeChild(button)
  })

  test('does not restore focus when restoreFocus is false', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()

    expect(document.activeElement).toBe(button)

    const { rerender } = renderHook(({ isOpen }) => useModal(isOpen, { restoreFocus: false }), {
      initialProps: { isOpen: true },
    })

    // Blur button
    button.blur()

    // Close modal
    rerender({ isOpen: false })

    // Focus should not be restored
    expect(document.activeElement).not.toBe(button)

    document.body.removeChild(button)
  })

  test('handleKeyDown calls onEscape for Escape key', () => {
    const onEscape = vi.fn()

    const { result } = renderHook(() => useModal(true, { onEscape }))

    const mockEvent = {
      key: 'Escape',
    } as unknown as KeyboardEvent

    result.current.handleKeyDown(mockEvent)

    expect(onEscape).toHaveBeenCalled()
  })

  test('handleKeyDown ignores other keys', () => {
    const onEscape = vi.fn()

    const { result } = renderHook(() => useModal(true, { onEscape }))

    const mockEvent = {
      key: 'Enter',
    } as unknown as KeyboardEvent

    result.current.handleKeyDown(mockEvent)

    expect(onEscape).not.toHaveBeenCalled()
  })

  test('cleans up event listeners on unmount', () => {
    const onEscape = vi.fn()
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useModal(true, { onEscape }))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  test('updates event listeners when isOpen changes', () => {
    const onEscape = vi.fn()

    const { rerender } = renderHook(({ isOpen }) => useModal(isOpen, { onEscape }), {
      initialProps: { isOpen: true },
    })

    // Escape should work when open
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1)

    // Close modal
    rerender({ isOpen: false })

    // Escape should not work when closed
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1) // Still 1, not 2
  })
})
