// ABOUTME: Modal component for jumping to a specific story ID with validation and accessibility
// ABOUTME: Handles user input, real-time validation, and keyboard navigation support

import { useState, useEffect, useRef } from 'preact/hooks'
import type { StoryId } from '../../types/story'
import { validateStoryId } from '../../utils/navigation'
import styles from './JumpToIdModal.module.css'

interface JumpToIdModalProps {
  isOpen: boolean
  onClose: () => void
  onJump: (id: StoryId) => void
  availableIds: StoryId[]
}

export function JumpToIdModal({ isOpen, onClose, onJump, availableIds }: JumpToIdModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputRef = useRef<globalThis.HTMLInputElement | null>(null)
  const modalRef = useRef<globalThis.HTMLDivElement | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setError(null)
      setIsSubmitting(false)
      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: globalThis.KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, onClose])

  // Handle input change with real-time validation
  const handleInputChange = (event: globalThis.Event) => {
    const target = event.target as globalThis.HTMLInputElement
    const value = target.value
    setInputValue(value)

    // Clear previous error
    setError(null)

    // Don't validate empty input
    if (value.trim() === '') {
      return
    }

    // Validate the input
    const validation = validateStoryId(value, availableIds)
    if (!validation.valid) {
      setError(validation.error || 'Invalid input')
    }
  }

  // Handle enter key in input field
  const handleInputKeyDown = (event: globalThis.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit(event as unknown as globalThis.Event)
    }
  }

  // Handle form submission
  const handleSubmit = async (event: globalThis.Event) => {
    event.preventDefault()

    if (isSubmitting) return

    const validation = validateStoryId(inputValue, availableIds)

    if (!validation.valid) {
      setError(validation.error || 'Invalid input')
      return
    }

    if (validation.id === undefined) {
      setError('Invalid ID')
      return
    }

    setIsSubmitting(true)

    try {
      onJump(validation.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to jump to story')
      setIsSubmitting(false)
    }
  }

  // Handle click outside modal
  const handleOverlayClick = (event: globalThis.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  // Focus trap - keep focus within modal
  useEffect(() => {
    const handleFocusTrap = (event: globalThis.KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return

        const focusableElements = modal.querySelectorAll(
          'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as globalThis.HTMLElement
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as globalThis.HTMLElement

        if (event.shiftKey) {
          // Shift+Tab: move focus to previous element
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab: move focus to next element
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleFocusTrap)
    return () => document.removeEventListener('keydown', handleFocusTrap)
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const validation = validateStoryId(inputValue, availableIds)
  const canSubmit = validation.valid && !isSubmitting

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jump-modal-title"
        aria-describedby="jump-modal-description"
      >
        <div className={styles.header}>
          <h2 id="jump-modal-title" className={styles.title}>
            Jump to Story ID
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p id="jump-modal-description" className={styles.description}>
            Enter the ID of the story you want to jump to:
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="story-id-input" className={styles.label}>
                Story ID:
              </label>
              <input
                ref={inputRef}
                id="story-id-input"
                type="text"
                value={inputValue}
                onInput={handleInputChange}
                onKeyDown={handleInputKeyDown}
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                placeholder="Enter story ID..."
                aria-describedby={error ? 'error-message' : undefined}
                aria-invalid={error ? 'true' : 'false'}
                disabled={isSubmitting}
              />
              {error && (
                <div
                  id="error-message"
                  className={styles.errorMessage}
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
            </div>

            <div className={styles.buttons}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={!canSubmit}
                aria-describedby={!canSubmit ? 'submit-help' : undefined}
              >
                {isSubmitting ? 'Jumping...' : 'Jump'}
              </button>
              {!canSubmit && inputValue.trim() !== '' && (
                <div id="submit-help" className={styles.helpText}>
                  Please enter a valid story ID
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
