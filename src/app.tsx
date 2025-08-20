// ABOUTME: Main application component with StoryService integration and state management
// ABOUTME: Handles data loading, navigation, and state for the entire application
import { useState, useEffect, useCallback, useMemo, useRef } from 'preact/hooks'
import styles from './app.module.css'
import { JumpToIdModal } from './components/JumpToIdModal'
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
  // Use useRef for stable StoryService instance to avoid re-renders
  const storyServiceRef = useRef<StoryService | null>(null)

  // Initialize service instance once or when injected service changes
  if (!storyServiceRef.current || storyServiceRef.current !== injectedStoryService) {
    storyServiceRef.current = injectedStoryService || new StoryService()
  }

  const storyService = storyServiceRef.current
  const [currentStoryId, setCurrentStoryId] = useState<StoryId | null>(null)
  const [storyText, setStoryText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableIds, setAvailableIds] = useState<StoryId[]>([])
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array since storyService is stable via useRef

  const handleNext = useCallback(() => {
    if (!currentStoryId || !storyService.isLoaded()) return

    const nextId = storyService.getNextId(currentStoryId)
    if (nextId) {
      setCurrentStoryId(nextId)
      setStoryText(storyService.getById(nextId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryId]) // storyService is stable via useRef, no need to include

  const handlePrevious = useCallback(() => {
    if (!currentStoryId || !storyService.isLoaded()) return

    const prevId = storyService.getPrevId(currentStoryId)
    if (prevId) {
      setCurrentStoryId(prevId)
      setStoryText(storyService.getById(prevId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryId]) // storyService is stable via useRef, no need to include

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

  const handleJumpToId = useCallback(() => {
    setIsJumpModalOpen(true)
  }, [])

  const handleJumpSubmit = useCallback((targetId: StoryId) => {
    if (!storyService.isLoaded()) return

    const storyContent = storyService.getById(targetId)
    if (storyContent) {
      setCurrentStoryId(targetId)
      setStoryText(storyContent)
      setIsJumpModalOpen(false)
    } else {
      // This shouldn't happen if validation is working correctly
      console.error(`Story with ID ${targetId} not found`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // storyService is stable via useRef, no need to include

  const handleJumpModalClose = useCallback(() => {
    setIsJumpModalOpen(false)
  }, [])

  // Calculate navigation state with memoization
  const canGoPrevious = useMemo(
    () => (currentStoryId ? canGoPrev(currentStoryId, availableIds) : false),
    [currentStoryId, availableIds]
  )

  const canGoNextValue = useMemo(
    () => (currentStoryId ? canGoNextUtil(currentStoryId, availableIds) : false),
    [currentStoryId, availableIds]
  )

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
          onJump={handleJumpToId}
          currentId={currentStoryId}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNextValue}
        />
      }
    >
      <StoryContent text={storyText} isLoading={isLoading} />
      <JumpToIdModal
        isOpen={isJumpModalOpen}
        onClose={handleJumpModalClose}
        onJump={handleJumpSubmit}
        availableIds={availableIds}
      />
    </Layout>
  )
}
