// ABOUTME: Main application component with StoryService integration and state management
// ABOUTME: Handles data loading, navigation, and state for the entire application
import { useState, useEffect, useCallback, useMemo, useRef } from 'preact/hooks'
import styles from './app.module.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { JumpToIdModal } from './components/JumpToIdModal'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'
import { Navigation } from './components/Navigation'
import { StoryContent } from './components/StoryContent'
import { getAppConfig, getFallbackStoriesUrl } from './config/app.config'
import { StoryService } from './services/storyService'
import { createAppError } from './types/errors'
import type { BaseAppError } from './types/errors'
import type { StoryId } from './types/story'
import { canGoNext as canGoNextUtil, canGoPrev } from './utils/navigation'

interface AppProps {
  storyService?: StoryService
}

export function App({ storyService: injectedStoryService }: AppProps = {}) {
  // Use useRef for stable StoryService instance to avoid re-renders
  const storyServiceRef = useRef<StoryService | null>(null)

  // Initialize service instance once or when injected service changes
  if (!storyServiceRef.current) {
    storyServiceRef.current = injectedStoryService || new StoryService()
  } else if (injectedStoryService && storyServiceRef.current !== injectedStoryService) {
    storyServiceRef.current = injectedStoryService
  }

  const storyService = storyServiceRef.current
  const [currentStoryId, setCurrentStoryId] = useState<StoryId | null>(null)
  const [storyText, setStoryText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<BaseAppError | null>(null)
  const [availableIds, setAvailableIds] = useState<StoryId[]>([])
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(3)
  const [usedFallback, setUsedFallback] = useState(false)

  // Initialize story service and load first story
  useEffect(() => {
    const initializeApp = async () => {
      const config = getAppConfig()

      try {
        setIsLoading(true)
        setError(null)
        setUsedFallback(false)

        // Try to load primary dataset
        try {
          await storyService.initialize(config.storiesUrl, config.maxLoadingTime)
        } catch (primaryError) {
          console.warn('Primary dataset failed to load, trying fallback:', primaryError)

          // Only try fallback if we're not already using the sample data
          if (config.storiesUrl !== getFallbackStoriesUrl()) {
            await storyService.initialize(getFallbackStoriesUrl(), config.maxLoadingTime)
            setUsedFallback(true)

            if (config.enablePerformanceLogging) {
              console.log('✅ [Fallback] Successfully loaded sample dataset')
            }
          } else {
            // Primary is already the fallback, so re-throw the error
            throw primaryError
          }
        }

        const firstId = storyService.getFirstId()
        if (firstId) {
          const ids = storyService.getAllIds()
          setAvailableIds(ids)
          setCurrentStoryId(firstId)
          setStoryText(storyService.getById(firstId))
          setRetryCount(0) // Reset retry count on successful load

          // Log successful initialization
          const metrics = storyService.getLoadingMetrics()
          if (config.enablePerformanceLogging && metrics) {
            console.log(
              `🎉 [App] Initialized with ${metrics.storyCount} stories in ${metrics.loadTime.toFixed(2)}ms`
            )
          }
        } else {
          setError(createAppError(new Error('Нет доступных историй')))
        }
      } catch (err) {
        console.error('Failed to initialize app:', err)
        const appError = createAppError(err)
        setError(appError)
        setRetryCount((prev) => prev + 1)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array since storyService is stable via useRef

  // Retry function for error recovery
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      const initializeApp = async () => {
        const config = getAppConfig()

        try {
          setIsLoading(true)
          setError(null)
          setUsedFallback(false)

          // Try to load primary dataset
          try {
            await storyService.initialize(config.storiesUrl, config.maxLoadingTime)
          } catch (primaryError) {
            console.warn('Primary dataset failed to load on retry, trying fallback:', primaryError)

            // Only try fallback if we're not already using the sample data
            if (config.storiesUrl !== getFallbackStoriesUrl()) {
              await storyService.initialize(getFallbackStoriesUrl(), config.maxLoadingTime)
              setUsedFallback(true)

              if (config.enablePerformanceLogging) {
                console.log('✅ [Fallback] Successfully loaded sample dataset on retry')
              }
            } else {
              // Primary is already the fallback, so re-throw the error
              throw primaryError
            }
          }

          const firstId = storyService.getFirstId()
          if (firstId) {
            const ids = storyService.getAllIds()
            setAvailableIds(ids)
            setCurrentStoryId(firstId)
            setStoryText(storyService.getById(firstId))
            setRetryCount(0) // Reset retry count on successful load
          } else {
            setError(createAppError(new Error('Нет доступных историй')))
          }
        } catch (err) {
          console.error('Retry failed:', err)
          const appError = createAppError(err)
          setError(appError)
          setRetryCount((prev) => prev + 1)
        } finally {
          setIsLoading(false)
        }
      }

      initializeApp()
    }
  }, [retryCount, maxRetries, storyService])

  // Handle page reload
  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

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
            {usedFallback && (
              <div className={styles.fallbackIndicator} title="Используется тестовый датасет">
                📁 Sample Data
              </div>
            )}
          </div>
        }
        footer={<div />}
      >
        <ErrorBoundary
          error={error}
          onRetry={handleRetry}
          onReload={handleReload}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout
        header={
          <div className={styles.headerContent}>
            <h1 className={styles.title}>ithappens</h1>
            {usedFallback && (
              <div className={styles.fallbackIndicator} title="Используется тестовый датасет">
                📁 Sample Data
              </div>
            )}
          </div>
        }
        footer={<div />}
      >
        <LoadingSpinner message="Загружаем истории..." size="large" />
      </Layout>
    )
  }

  return (
    <Layout
      header={
        <div className={styles.headerContent}>
          <h1 className={styles.title}>ithappens</h1>
          {usedFallback && (
            <div className={styles.fallbackIndicator} title="Используется тестовый датасет">
              📁 Sample Data
            </div>
          )}
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
