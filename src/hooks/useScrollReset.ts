// ABOUTME: Hook for managing scroll position in story content
// ABOUTME: Automatically resets scroll when navigating between stories
/* eslint-disable no-undef */

import { useEffect } from 'preact/hooks'

type ScrollBehaviorType = 'auto' | 'smooth'

export interface UseScrollResetOptions {
  resetOn?: unknown[]
  behavior?: ScrollBehaviorType
}

/**
 * Hook to manage scroll position reset on dependency changes
 * @param ref - Reference to the scrollable element
 * @param options - Configuration options for scroll behavior
 */
export function useScrollReset(
  ref: { current: HTMLElement | null },
  options?: UseScrollResetOptions
): void {
  const { resetOn = [], behavior = 'auto' } = options || {}

  useEffect(() => {
    if (!ref.current) return
    if (resetOn.length === 0) return

    const element = ref.current

    if (element.scrollTo) {
      element.scrollTo({ top: 0, behavior })
    } else {
      element.scrollTop = 0
    }
    // Dependencies are intentionally from resetOn array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetOn)
}
