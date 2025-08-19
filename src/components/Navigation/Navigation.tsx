// ABOUTME: Navigation component with three buttons for story navigation
// ABOUTME: Компонент навигации с тремя кнопками для навигации по историям
import type { NavigationProps } from '../../types/navigation'
import styles from './Navigation.module.css'

export function Navigation({
  onPrevious,
  onNext,
  onJump,
  canGoPrevious = true,
  canGoNext = true,
  currentId,
}: NavigationProps) {
  return (
    <nav className={styles.navigation} role="navigation" aria-label="Story navigation">
      <button
        className={styles.button}
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Previous story"
        type="button"
      >
        ← Назад
      </button>

      <button
        className={styles.button}
        onClick={onJump}
        aria-label={`Current story ID: ${currentId || 'Unknown'}`}
        type="button"
      >
        ID: {currentId || '?'}
      </button>

      <button
        className={styles.button}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next story"
        type="button"
      >
        Вперед →
      </button>
    </nav>
  )
}
