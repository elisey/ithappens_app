// ABOUTME: Main application component with StoryService integration and state management
// ABOUTME: Handles data loading, navigation, and state for the entire application
import { useState, useEffect, useCallback } from 'preact/hooks'
import styles from './app.module.css'
import { Layout } from './components/Layout'
import { Navigation } from './components/Navigation'
import { StoryContent } from './components/StoryContent'
import { StoryService } from './services/storyService'
import type { StoryId } from './types/story'
import { canGoNext as canGoNextUtil, canGoPrev } from './utils/navigation'

interface AppProps {
  storyService?: StoryService
}

export function App({ storyService: injectedStoryService }: AppProps = {}) {
  const storyService = injectedStoryService || new StoryService()
  const [currentStoryId, setCurrentStoryId] = useState<StoryId | null>(null)
  const [storyText, setStoryText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableIds, setAvailableIds] = useState<StoryId[]>([])

  // Initialize story service and load first story
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true)
        setError(null)

        await storyService.initialize('/stories.json.sample')

        const firstId = storyService.getFirstId()
        if (firstId) {
          const ids = storyService.getAllIds()
          setAvailableIds(ids)
          setCurrentStoryId(firstId)
          setStoryText(storyService.getById(firstId))
        } else {
          setError('Нет доступных историй')
        }
      } catch (err) {
        console.error('Failed to initialize app:', err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [storyService])

  const handleNext = useCallback(() => {
    if (!currentStoryId || !storyService.isLoaded()) return

    const nextId = storyService.getNextId(currentStoryId)
    if (nextId) {
      setCurrentStoryId(nextId)
      setStoryText(storyService.getById(nextId))
    }
  }, [currentStoryId, storyService])

  const handlePrevious = useCallback(() => {
    if (!currentStoryId || !storyService.isLoaded()) return

    const prevId = storyService.getPrevId(currentStoryId)
    if (prevId) {
      setCurrentStoryId(prevId)
      setStoryText(storyService.getById(prevId))
    }
  }, [currentStoryId, storyService])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: globalThis.KeyboardEvent) => {
      if (!currentStoryId || isLoading) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [currentStoryId, isLoading, handleNext, handlePrevious])

  const handleJump = useCallback(() => {
    // Placeholder for jump functionality - will be implemented later
    console.log('Jump to ID - to be implemented')
  }, [])

  // Calculate navigation state
  const canGoPrevious = currentStoryId ? canGoPrev(currentStoryId, availableIds) : false
  const canGoNextValue = currentStoryId ? canGoNextUtil(currentStoryId, availableIds) : false

  if (error) {
    return (
      <Layout
        header={
          <div className={styles.headerContent}>
            <h1 className={styles.title}>ithappens</h1>
          </div>
        }
        footer={<div />}
      >
        <div className={styles.error}>
          <p>Произошла ошибка: {error}</p>
          <button onClick={() => window.location.reload()}>Перезагрузить</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      header={
        <div className={styles.headerContent}>
          <h1 className={styles.title}>ithappens</h1>
        </div>
      }
      footer={
        <Navigation
          onPrevious={handlePrevious}
          onNext={handleNext}
          onJump={handleJump}
          currentId={currentStoryId}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNextValue}
        />
      }
    >
      <StoryContent text={storyText} isLoading={isLoading} />
    </Layout>
  )
}
