// ABOUTME: Modal dialog component for jumping to a specific story by ID
// ABOUTME: Provides input validation, error messages, and accessibility features
/* eslint-disable no-undef */

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'preact/compat'
import { useModal } from '../hooks/useModal'
import { validateStoryIdInput, getValidationHint } from '../utils/validation'
import styles from './JumpModal.module.css'

export interface JumpModalProps {
  isOpen: boolean
  onClose: () => void
  onJump: (id: number) => void
  availableIds: number[]
  currentId: number
}

export function JumpModal({ isOpen, onClose, onJump, availableIds, currentId }: JumpModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { modalRef, handleOverlayClick } = useModal(isOpen, {
    onEscape: onClose,
    onClickOutside: onClose,
    trapFocus: true,
    restoreFocus: true,
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setError(null)
    }
  }, [isOpen])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setInputValue(value)

    // Clear error on input change
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const validation = validateStoryIdInput(inputValue, availableIds)

    if (!validation.isValid) {
      setError(validation.error || 'Invalid input')
      return
    }

    if (validation.value === currentId) {
      setError('Already viewing this story')
      return
    }

    if (validation.value !== undefined) {
      onJump(validation.value)
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  const validation = validateStoryIdInput(inputValue, availableIds)
  const hint = getValidationHint(inputValue, availableIds)
  const isValid = validation.isValid && validation.value !== currentId
  const showError = error !== null
  const inputClassName = `${styles.input} ${showError ? styles.invalid : ''} ${isValid ? styles.valid : ''}`

  const min = availableIds.length > 0 ? Math.min(...availableIds) : 1
  const max = availableIds.length > 0 ? Math.max(...availableIds) : 1

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jump-modal-title"
        aria-describedby={showError ? 'jump-modal-error' : 'jump-modal-hint'}
      >
        <div className={styles.header}>
          <h2 id="jump-modal-title" className={styles.title}>
            Jump to Story
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="story-id-input" className={styles.label}>
              Story ID
            </label>
            <input
              id="story-id-input"
              type="text"
              inputMode="numeric"
              className={inputClassName}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`Enter ID from ${min} to ${max}`}
              aria-invalid={showError}
              aria-describedby={showError ? 'jump-modal-error' : 'jump-modal-hint'}
              autoComplete="off"
            />
            {showError && (
              <p id="jump-modal-error" className={styles.error} role="alert">
                {error}
              </p>
            )}
            {!showError && hint && (
              <p id="jump-modal-hint" className={styles.hint}>
                {hint}
              </p>
            )}
          </div>

          <div className={styles.buttons}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={!isValid}
            >
              Jump
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
