// ABOUTME: Enhanced story viewer component with proper text formatting and scroll management
// ABOUTME: Displays story content with ID header, line break support, and smooth scrolling
/* eslint-disable no-undef */

import { useRef } from 'preact/hooks'
import { useScrollReset } from '../../hooks/useScrollReset'
import { formatLineBreaks } from '../../utils/textFormatting'
import { LoadingSpinner } from '../LoadingSpinner'
import styles from './StoryViewer.module.css'

export interface StoryViewerProps {
  storyId: number | null
  storyText: string | null
  isLoading: boolean
  error?: Error | null
}

export function StoryViewer({ storyId, storyText, isLoading, error }: StoryViewerProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  useScrollReset(contentRef, { resetOn: [storyId] })

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <LoadingSpinner message="Загрузка истории..." size="medium" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div>Ошибка загрузки</div>
          <div className={styles.errorMessage}>{error.message}</div>
        </div>
      </div>
    )
  }

  if (!storyText || storyId === null) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>История не найдена</div>
      </div>
    )
  }

  const formattedText = formatLineBreaks(storyText)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.storyId} aria-label={`Story ID ${storyId}`}>
          История #{storyId}
        </span>
      </div>
      <div
        ref={contentRef}
        className={styles.content}
        role="article"
        aria-label={`Story ${storyId} content`}
      >
        <div className={styles.contentInner}>
          <div className={styles.text}>{formattedText}</div>
        </div>
      </div>
    </div>
  )
}
