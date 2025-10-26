// ABOUTME: Context provider for centralized keyboard shortcut management
// ABOUTME: Handles global keyboard state, handler registration, and temporary disabling for modals

import type { ComponentChildren } from 'preact'
import { createContext } from 'preact'
import { useContext, useState, useCallback, useMemo } from 'preact/hooks'
import { DEFAULT_SHORTCUTS, type KeyboardShortcuts } from '../hooks/useKeyboardNavigation'

interface KeyboardContextValue {
  isEnabled: boolean
  shortcuts: KeyboardShortcuts
  registerHandler: (key: string, handler: () => void, priority?: number) => void
  unregisterHandler: (key: string) => void
  temporarilyDisable: () => () => void
  disable: () => void
  enable: () => void
}

const KeyboardContext = createContext<KeyboardContextValue | undefined>(undefined)

export interface KeyboardProviderProps {
  children: ComponentChildren
  shortcuts?: Partial<KeyboardShortcuts>
}

export function KeyboardProvider({ children, shortcuts: customShortcuts }: KeyboardProviderProps) {
  const [isEnabled, setIsEnabled] = useState(true)

  const shortcuts = useMemo(
    () => ({
      ...DEFAULT_SHORTCUTS,
      ...customShortcuts,
    }),
    [customShortcuts]
  )

  // Handler registration functionality for future use
  // Currently keyboard shortcuts are managed by useKeyboardNavigation hook
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const registerHandler = useCallback((_key: string, _handler: () => void) => {
    // Implementation reserved for future use
  }, [])

  // Handler unregistration functionality for future use
  // Currently keyboard shortcuts are managed by useKeyboardNavigation hook
  const unregisterHandler = useCallback(() => {
    // Implementation reserved for future use
  }, [])

  const disable = useCallback(() => {
    setIsEnabled(false)
  }, [])

  const enable = useCallback(() => {
    setIsEnabled(true)
  }, [])

  const temporarilyDisable = useCallback(() => {
    const wasEnabled = isEnabled
    setIsEnabled(false)

    // Return a function to restore the previous state
    return () => {
      if (wasEnabled) {
        setIsEnabled(true)
      }
    }
  }, [isEnabled])

  const value = useMemo(
    () => ({
      isEnabled,
      shortcuts,
      registerHandler,
      unregisterHandler,
      temporarilyDisable,
      disable,
      enable,
    }),
    [isEnabled, shortcuts, registerHandler, unregisterHandler, temporarilyDisable, disable, enable]
  )

  return <KeyboardContext.Provider value={value}>{children}</KeyboardContext.Provider>
}

export function useKeyboard(): KeyboardContextValue {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider')
  }
  return context
}
