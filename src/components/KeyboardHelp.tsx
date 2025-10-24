// ABOUTME: Help dialog component displaying available keyboard shortcuts
// ABOUTME: Shows formatted shortcuts with descriptions in a modal overlay
/* eslint-disable no-undef */

import { useEffect } from 'preact/hooks'
import type { KeyboardShortcuts } from '../hooks/useKeyboardNavigation'
import { formatKeyForDisplay } from '../utils/keyboardUtils'
import styles from './KeyboardHelp.module.css'

export interface KeyboardHelpProps {
  isVisible: boolean
  onClose: () => void
  shortcuts: KeyboardShortcuts
}

interface ShortcutItem {
  keys: string[]
  description: string
}

export function KeyboardHelp({ isVisible, onClose, shortcuts }: KeyboardHelpProps) {
  // Handle Escape key to close
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  if (!isVisible) {
    return null
  }

  const shortcutItems: ShortcutItem[] = [
    { keys: shortcuts.next, description: 'Next story' },
    { keys: shortcuts.previous, description: 'Previous story' },
    { keys: shortcuts.jump, description: 'Jump to story by ID' },
    { keys: shortcuts.help, description: 'Show this help' },
    { keys: ['Escape'], description: 'Close modals' },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        data-visible={isVisible}
      >
        <div className={styles.header}>
          <h2 id="keyboard-help-title" className={styles.title}>
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        <ul className={styles.shortcutList}>
          {shortcutItems.map((item, index) => (
            <li key={index} className={styles.shortcutItem}>
              <span className={styles.description}>{item.description}</span>
              <span className={styles.keys}>
                {item.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className={styles.key}>{formatKeyForDisplay(key)}</kbd>
                    {keyIndex < item.keys.length - 1 && (
                      <span className={styles.separator}> or </span>
                    )}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
