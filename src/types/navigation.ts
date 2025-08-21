// ABOUTME: TypeScript types for navigation functionality
// ABOUTME: TypeScript типы для функциональности навигации

export interface NavigationProps {
  onPrevious: () => void
  onNext: () => void
  onJump: () => void
  canGoPrevious?: boolean
  canGoNext?: boolean
  currentId?: number | null
}
