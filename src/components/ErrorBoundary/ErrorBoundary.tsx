// ABOUTME: Error boundary component with retry functionality and detailed error information
// ABOUTME: Компонент границы ошибок с функцией повтора и детальной информацией об ошибках

import { useState } from 'preact/hooks'
import type { BaseAppError, ErrorSolution } from '../../types/errors'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  error: BaseAppError | null
  onRetry: () => void
  onReload?: () => void
  retryCount?: number
  maxRetries?: number
}

export function ErrorBoundary({
  error,
  onRetry,
  onReload,
  retryCount = 0,
  maxRetries = 3,
}: ErrorBoundaryProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!error) {
    return null
  }

  const canRetry = error.retryable && retryCount < maxRetries
  const showRetryCount = retryCount > 0

  const handleSolutionAction = (action: string) => {
    switch (action) {
      case 'retry':
        onRetry()
        break
      case 'reload':
        if (onReload) {
          onReload()
        } else {
          window.location.reload()
        }
        break
    }
  }

  return (
    <div className={styles.container} role="alert">
      <div className={styles.errorIcon} aria-hidden="true">
        ⚠️
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>Что-то пошло не так</h2>

        <p className={styles.message}>{error.userMessage}</p>

        {showRetryCount && (
          <p className={styles.retryInfo}>
            Попытка {retryCount} из {maxRetries}
          </p>
        )}

        <div className={styles.actions}>
          {canRetry && (
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={onRetry}
              type="button"
            >
              Попробовать еще раз
            </button>
          )}

          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => (onReload ? onReload() : window.location.reload())}
            type="button"
          >
            Перезагрузить страницу
          </button>
        </div>

        {error.solutions.length > 0 && (
          <div className={styles.solutions}>
            <h3 className={styles.solutionsTitle}>Возможные решения:</h3>
            <div className={styles.solutionsList}>
              {error.solutions.map((solution: ErrorSolution, index: number) => (
                <div key={index} className={styles.solution}>
                  <h4 className={styles.solutionTitle}>{solution.title}</h4>
                  <p className={styles.solutionDescription}>{solution.description}</p>
                  {solution.action && (
                    <button
                      className={`${styles.button} ${styles.small}`}
                      onClick={() => handleSolutionAction(solution.action!)}
                      type="button"
                    >
                      {solution.action === 'retry'
                        ? 'Попробовать'
                        : solution.action === 'reload'
                          ? 'Перезагрузить'
                          : 'Выполнить'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <details className={styles.details}>
          <summary className={styles.detailsToggle} onClick={() => setShowDetails(!showDetails)}>
            Техническая информация
          </summary>
          {showDetails && (
            <div className={styles.technicalInfo}>
              <p>
                <strong>Тип ошибки:</strong> {error.type}
              </p>
              <p>
                <strong>Время:</strong> {error.timestamp.toLocaleString()}
              </p>
              <p>
                <strong>Сообщение:</strong> {error.message}
              </p>
              {error.name && (
                <p>
                  <strong>Название:</strong> {error.name}
                </p>
              )}
            </div>
          )}
        </details>
      </div>
    </div>
  )
}
