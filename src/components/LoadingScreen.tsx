// ABOUTME: Full-screen loading indicator for dataset initialization
// ABOUTME: Shows text-based status updates during app initialization

import styles from './LoadingScreen.module.css'

export type LoadingStatus = 'initializing' | 'loading' | 'parsing' | 'indexing'

interface LoadingScreenProps {
  status?: LoadingStatus
  progress?: number
  error?: Error | null
  onRetry?: () => void
}

const STATUS_MESSAGES: Record<LoadingStatus, string> = {
  initializing: 'Инициализация приложения...',
  loading: 'Загрузка историй...',
  parsing: 'Обработка данных...',
  indexing: 'Подготовка к работе...',
}

export function LoadingScreen({ status, progress, error, onRetry }: LoadingScreenProps) {
  if (error) {
    return (
      <div className={styles.overlay} role="alert" aria-live="assertive">
        <div className={styles.content}>
          <p className={styles.errorMessage}>Ошибка загрузки</p>
          <p className={styles.errorDetails}>{error.message}</p>
          {onRetry && (
            <button
              className={styles.retryButton}
              onClick={onRetry}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onRetry()
                }
              }}
              aria-label="Повторить попытку загрузки"
            >
              Повторить
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.content}>
        <p className={styles.statusMessage}>{status ? STATUS_MESSAGES[status] : 'Загрузка...'}</p>
        {progress !== undefined && (
          <p className={styles.progress} aria-label={`Прогресс загрузки: ${progress}%`}>
            {progress}%
          </p>
        )}
      </div>
    </div>
  )
}
