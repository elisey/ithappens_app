// ABOUTME: Custom hook for managing keyboard navigation shortcuts
// ABOUTME: Handles global keyboard events with configurable shortcuts and context awareness
/* eslint-disable no-undef */

import { useEffect, useState, useCallback, useRef, useMemo } from 'preact/hooks'
import { shouldIgnoreShortcut, normalizeKey } from '../utils/keyboardUtils'

export interface KeyboardShortcuts {
  next: string[]
  previous: string[]
  jump: string[]
  help: string[]
}

export interface UseKeyboardNavigationOptions {
  enabled?: boolean
  shortcuts?: Partial<KeyboardShortcuts>
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface KeyboardNavigationHandlers {
  onNext: () => void
  onPrevious: () => void
  onJump?: () => void
  onHelp?: () => void
}

export const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  next: ['ArrowRight', 'j'],
  previous: ['ArrowLeft', 'k'],
  jump: ['g'],
  help: ['?', 'h'],
}

export function useKeyboardNavigation(
  handlers: KeyboardNavigationHandlers,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    enabled: initialEnabled = true,
    shortcuts: customShortcuts = {},
    preventDefault = true,
    stopPropagation = false,
  } = options

  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const handlersRef = useRef(handlers)

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  // Sync internal enabled state with options.enabled prop
  useEffect(() => {
    setIsEnabled(initialEnabled)
  }, [initialEnabled])

  // Merge default shortcuts with custom ones (memoized to prevent unnecessary re-renders)
  const shortcuts: KeyboardShortcuts = useMemo(
    () => ({
      ...DEFAULT_SHORTCUTS,
      ...customShortcuts,
    }),
    [customShortcuts]
  )

  const disable = useCallback(() => {
    setIsEnabled(false)
  }, [])

  const enable = useCallback(() => {
    setIsEnabled(true)
  }, [])

  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts in certain contexts
      if (shouldIgnoreShortcut(event)) {
        return
      }

      const key = normalizeKey(event)
      const currentHandlers = handlersRef.current

      // Check which action this key corresponds to
      let actionHandled = false

      if (shortcuts.next.includes(key) && currentHandlers.onNext) {
        currentHandlers.onNext()
        actionHandled = true
      } else if (shortcuts.previous.includes(key) && currentHandlers.onPrevious) {
        currentHandlers.onPrevious()
        actionHandled = true
      } else if (shortcuts.jump.includes(key) && currentHandlers.onJump) {
        currentHandlers.onJump()
        actionHandled = true
      } else if (shortcuts.help.includes(key) && currentHandlers.onHelp) {
        currentHandlers.onHelp()
        actionHandled = true
      }

      // Prevent default and stop propagation if action was handled
      if (actionHandled) {
        if (preventDefault) {
          event.preventDefault()
        }
        if (stopPropagation) {
          event.stopPropagation()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEnabled, shortcuts, preventDefault, stopPropagation])

  return {
    isEnabled,
    shortcuts,
    disable,
    enable,
  }
}
