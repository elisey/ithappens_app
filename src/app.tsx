// ABOUTME: Main application component with StoryService integration and state management
// ABOUTME: Handles data loading, navigation, and state for the entire application
import { useState, useEffect, useCallback, useMemo } from 'preact/hooks'
import styles from './app.module.css'
import { DevPanel } from './components/DevPanel'
import { JumpToIdModal } from './components/JumpToIdModal'
import { Layout } from './components/Layout'
import { LoadingScreen } from './components/LoadingScreen'
import { Navigation } from './components/Navigation'
import { StoryViewer } from './components/StoryContent'
import { getAppConfig } from './config/app.config'
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor'
import { useStoryService } from './hooks/useStoryService'
import type { StoryId } from './types/story'
import { canGoNext as canGoNextUtil, canGoPrev } from './utils/navigation'

export function App() {
  const config = getAppConfig()
  const {
    service: storyService,
    isLoading,
    loadingStatus,
    error,
    retry,
    progress,
  } = useStoryService({
    url: config.storiesUrl,
    timeout: config.maxLoadingTime,
  })

  // Performance monitoring
  const { metrics, health, isEnabled: monitoringEnabled } = usePerformanceMonitor()

  const [currentStoryId, setCurrentStoryId] = useState<StoryId | null>(null)
  const [storyText, setStoryText] = useState<string | null>(null)
  const [availableIds, setAvailableIds] = useState<StoryId[]>([])
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false)

  // Load first story when service is ready
  useEffect(() => {
    if (!storyService || !storyService.isLoaded()) return

    const firstId = storyService.getFirstId()
    if (firstId) {
      const ids = storyService.getAllIds()
      setAvailableIds(ids)
      setCurrentStoryId(firstId)
      setStoryText(storyService.getById(firstId))

      // Log successful initialization
      const metrics = storyService.getLoadingMetrics()
      if (config.enablePerformanceLogging && metrics) {
        console.log(
          `🎉 [App] Initialized with ${metrics.storyCount} stories in ${metrics.loadTime.toFixed(2)}ms`
        )
      }
    }
  }, [storyService, config.enablePerformanceLogging])

  const handleNext = useCallback(() => {
    if (!currentStoryId || !storyService || !storyService.isLoaded()) return

    const nextId = storyService.getNextId(currentStoryId)
    if (nextId) {
      setCurrentStoryId(nextId)
      setStoryText(storyService.getById(nextId))
    }
  }, [currentStoryId, storyService])

  const handlePrevious = useCallback(() => {
    if (!currentStoryId || !storyService || !storyService.isLoaded()) return

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

  const handleJumpToId = useCallback(() => {
    setIsJumpModalOpen(true)
  }, [])

  const handleJumpSubmit = useCallback(
    (targetId: StoryId) => {
      if (!storyService || !storyService.isLoaded()) return

      const storyContent = storyService.getById(targetId)
      if (storyContent) {
        setCurrentStoryId(targetId)
        setStoryText(storyContent)
        setIsJumpModalOpen(false)
      } else {
        console.error(`Story with ID ${targetId} not found`)
      }
    },
    [storyService]
  )

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

  if (isLoading && loadingStatus) {
    return <LoadingScreen status={loadingStatus} progress={progress} />
  }

  if (error) {
    return <LoadingScreen error={error} onRetry={retry} />
  }

  return (
    <>
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
        <StoryViewer storyId={currentStoryId} storyText={storyText} isLoading={false} />
        <JumpToIdModal
          isOpen={isJumpModalOpen}
          onClose={handleJumpModalClose}
          onJump={handleJumpSubmit}
          availableIds={availableIds}
        />
      </Layout>
      <DevPanel metrics={metrics} health={health} isVisible={monitoringEnabled} />
    </>
  )
}
