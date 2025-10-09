// ABOUTME: Hook for trapping focus within a container element (e.g., modal dialogs)
// ABOUTME: Handles Tab/Shift+Tab navigation and autofocus on first focusable element
/* eslint-disable no-undef */

import { useEffect, type RefObject } from 'preact/compat'

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS))
  return elements.filter((el) => {
    return (
      el.offsetParent !== null &&
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true'
    )
  })
}

/**
 * Traps focus within a container element, cycling through focusable elements
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, isActive: boolean): void {
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return
    }

    const container = containerRef.current
    const focusableElements = getFocusableElements(container)

    if (focusableElements.length === 0) {
      return
    }

    const firstElement = focusableElements[0]

    // Focus first element on mount
    firstElement?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }

      // Refresh focusable elements in case DOM changed
      const currentFocusableElements = getFocusableElements(container)
      if (currentFocusableElements.length === 0) {
        return
      }

      const currentFirst = currentFocusableElements[0]
      const currentLast = currentFocusableElements[currentFocusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === currentFirst) {
          event.preventDefault()
          currentLast?.focus()
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === currentLast) {
          event.preventDefault()
          currentFirst?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, containerRef])
}
