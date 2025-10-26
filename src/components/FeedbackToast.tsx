// ABOUTME: Toast notification component for user feedback (success, error, info)
// ABOUTME: Auto-dismisses after configurable duration with enter/exit animations

import { useEffect, useState } from 'preact/hooks'
import styles from './FeedbackToast.module.css'

export interface ToastProps {
  message: string
  type?: 'info' | 'success' | 'error'
  duration?: number
  position?: 'top' | 'bottom'
  onClose?: () => void
}

const ICONS = {
  info: 'ℹ️',
  success: '✓',
  error: '⚠️',
}

export function FeedbackToast({
  message,
  type = 'info',
  duration = 3000,
  position = 'bottom',
  onClose,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration <= 0) return

    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        onClose?.()
      }, 200) // Match exit animation duration
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`${styles.container} ${styles[position]}`}>
      <div
        className={`${styles.toast} ${styles[type]} ${
          isExiting ? styles.exiting : styles.entering
        }`}
        role="status"
        aria-live={type === 'error' ? 'assertive' : 'polite'}
      >
        <span className={styles.icon} aria-hidden="true">
          {ICONS[type]}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  )
}

// Hook for managing toast notifications
export function useToast() {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = (props: ToastProps) => {
    setToast(props)
  }

  const hideToast = () => {
    setToast(null)
  }

  return {
    toast,
    showToast,
    hideToast,
  }
}
