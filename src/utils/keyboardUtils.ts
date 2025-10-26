// ABOUTME: Utility functions for keyboard handling and shortcut management
// ABOUTME: Provides key normalization, element detection, and display formatting
/* eslint-disable no-undef */

/**
 * Normalizes keyboard event key to a consistent format
 */
export function normalizeKey(event: KeyboardEvent): string {
  return event.key
}

/**
 * Checks if the focused element is an input-type element where keyboard shortcuts should be disabled
 */
export function isInputElement(element: Element | null): boolean {
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'

  // Also check for contentEditable
  const isContentEditable =
    element.getAttribute('contenteditable') === 'true' ||
    element.getAttribute('contenteditable') === ''

  return isInput || isContentEditable
}

/**
 * Checks if any modifier keys (Ctrl, Alt, Meta/Cmd, Shift) are pressed
 */
export function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
}

/**
 * Formats a key string for display in UI (converts to symbols where appropriate)
 */
export function formatKeyForDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Enter: '⏎',
    Escape: 'Esc',
    Space: '␣',
    Tab: '⇥',
    Backspace: '⌫',
    Delete: '⌦',
    Home: '⇱',
    End: '⇲',
  }

  return keyMap[key] || key
}

/**
 * Returns OS-specific keyboard shortcuts
 */
export function getOSShortcuts() {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent)

  return {
    modifier: isMac ? '⌘' : 'Ctrl',
    copy: isMac ? '⌘C' : 'Ctrl+C',
    paste: isMac ? '⌘V' : 'Ctrl+V',
    cut: isMac ? '⌘X' : 'Ctrl+X',
    selectAll: isMac ? '⌘A' : 'Ctrl+A',
    undo: isMac ? '⌘Z' : 'Ctrl+Z',
    redo: isMac ? '⌘⇧Z' : 'Ctrl+Y',
    isMac,
  }
}

/**
 * Checks if a key is supported in the current browser
 */
export function isKeySupported(key: string): boolean {
  // All modern browsers support basic keys
  // This is primarily for future extension
  const supportedKeys = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Enter',
    'Escape',
    'Space',
    'Home',
    'End',
    'a',
    'd',
    'j',
    'g',
    'h',
    '?',
    '0',
    ']',
  ]

  return supportedKeys.includes(key)
}

/**
 * Checks if the keyboard shortcut should be ignored based on context
 */
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  // Ignore if an input element is focused
  if (isInputElement(document.activeElement)) {
    return true
  }

  // Ignore if modifier keys are pressed (except Shift for '?')
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return true
  }

  return false
}
