// ABOUTME: Loading spinner component with animation and accessibility features
// ABOUTME: Компонент индикатора загрузки с анимацией и поддержкой доступности

import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
}

export function LoadingSpinner({ message = 'Загрузка...', size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={`${styles.spinner} ${styles[size]}`} aria-hidden="true">
        <div className={styles.dot1}></div>
        <div className={styles.dot2}></div>
        <div className={styles.dot3}></div>
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  )
}
