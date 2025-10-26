// ABOUTME: Hook for managing modal window behavior including keyboard and overlay interactions
// ABOUTME: Handles ESC key, outside clicks, focus trapping, and focus restoration
/* eslint-disable no-undef */

import type { JSX } from 'preact'
import { useEffect, useRef, type RefObject } from 'preact/compat'
import { useFocusTrap } from './useFocusTrap'

export interface UseModalOptions {
  onEscape?: () => void
  onClickOutside?: () => void
  trapFocus?: boolean
  restoreFocus?: boolean
}

export interface UseModalReturn {
  modalRef: RefObject<HTMLDivElement>
  handleKeyDown: (e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => void
  handleOverlayClick: (e: JSX.TargetedMouseEvent<HTMLDivElement>) => void
}

/**
 * Hook for managing modal window behavior
 */
export function useModal(isOpen: boolean, options: UseModalOptions = {}): UseModalReturn {
  const { onEscape, onClickOutside, trapFocus = true, restoreFocus = true } = options

  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the element that had focus before modal opened
  useEffect(() => {
    if (isOpen && restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }
  }, [isOpen, restoreFocus])

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && restoreFocus && previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [isOpen, restoreFocus])

  // Handle ESC key globally
  useEffect(() => {
    if (!isOpen || !onEscape) {
      return
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onEscape])

  // Use focus trap hook
  useFocusTrap(modalRef, isOpen && trapFocus)

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && onEscape) {
      onEscape()
    }
  }

  const handleOverlayClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    // Only trigger if clicked directly on overlay (not bubbled from modal content)
    if (e.target === e.currentTarget && onClickOutside) {
      onClickOutside()
    }
  }

  return {
    modalRef,
    handleKeyDown,
    handleOverlayClick,
  }
}
