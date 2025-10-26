// ABOUTME: Main application component with StoryService integration and state management
// ABOUTME: Handles data loading, navigation, and state for the entire application
import { useState, useEffect, useCallback, useMemo } from 'preact/hooks'
import styles from './app.module.css'
import { DevPanel } from './components/DevPanel'
import { JumpToIdModal } from './components/JumpToIdModal'
import { KeyboardHelp } from './components/KeyboardHelp'
import { Layout } from './components/Layout'
import { LoadingScreen } from './components/LoadingScreen'
import { Navigation } from './components/Navigation'
import { StoryViewer } from './components/StoryContent'
import { ThemeToggle } from './components/ThemeToggle'
import { TouchGestures } from './components/TouchGestures'
import { getAppConfig } from './config/app.config'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor'
import { useStoryService } from './hooks/useStoryService'
import { useTheme } from './hooks/useTheme'
import { storageService } from './services/storageService'
import type { StoryId } from './types/story'
import { isTouchDevice } from './utils/deviceUtils'
import { canGoNext as canGoNextUtil, canGoPrev } from './utils/navigation'

export function App() {
  const config = getAppConfig()

  // Theme management
  useTheme()

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
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Load first story or restore from storage when service is ready
  useEffect(() => {
    if (!storyService || !storyService.isLoaded()) return

    async function initializeStory() {
      // Capture service reference for use in async function
      const service = storyService
      if (!service) return

      try {
        const ids = service.getAllIds()
        setAvailableIds(ids)

        // Try to restore last story ID from storage
        const lastId = await storageService.getLastStoryId()

        let storyIdToShow: StoryId

        if (lastId && service.getById(lastId)) {
          // Valid saved ID - restore it
          storyIdToShow = lastId
          console.log(`[App] Restored story ID ${lastId} from storage`)
        } else {
          // No saved ID or invalid - use first story
          storyIdToShow = service.getFirstId()!
          if (lastId && !service.getById(lastId)) {
            console.warn(
              `[App] Saved story ID ${lastId} no longer exists, falling back to first story`
            )
          }
        }

        setCurrentStoryId(storyIdToShow)
        setStoryText(service.getById(storyIdToShow))

        // Log successful initialization
        const metrics = service.getLoadingMetrics()
        if (config.enablePerformanceLogging && metrics) {
          console.log(
            `🎉 [App] Initialized with ${metrics.storyCount} stories in ${metrics.loadTime.toFixed(2)}ms`
          )
        }
      } catch (error) {
        console.error('[App] Failed to initialize story:', error)
        // Still show first story on error
        const firstId = service.getFirstId()
        if (firstId) {
          setCurrentStoryId(firstId)
          setStoryText(service.getById(firstId))
        }
      } finally {
        setIsInitializing(false)
      }
    }

    initializeStory()
  }, [storyService, config.enablePerformanceLogging])

  // Auto-save current story ID when it changes
  useEffect(() => {
    // Don't save during initialization to avoid unnecessary writes
    if (currentStoryId === null || isInitializing) return

    // Save to storage
    storageService.setLastStoryId(currentStoryId).catch((error) => {
      // Log but don't block - storage failures shouldn't break navigation
      console.warn('[App] Failed to save story ID to storage:', error)
    })
  }, [currentStoryId, isInitializing])

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

  const handleToggleHelp = useCallback(() => {
    setIsHelpVisible((prev) => !prev)
  }, [])

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

  const handleHelpClose = useCallback(() => {
    setIsHelpVisible(false)
  }, [])

  // Setup keyboard navigation with all handlers
  const { shortcuts } = useKeyboardNavigation(
    {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onJump: handleJumpToId,
      onHelp: handleToggleHelp,
    },
    {
      enabled: !isJumpModalOpen && !isHelpVisible,
      preventDefault: true,
    }
  )

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

  const content = (
    <>
      <Layout
        header={
          <div className={styles.headerContent}>
            <ThemeToggle mode="toggle" />
            <h1 className={styles.title}>ithappens</h1>
            <button
              type="button"
              className={styles.helpButton}
              onClick={handleToggleHelp}
              aria-label="Show keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>
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
        <KeyboardHelp isVisible={isHelpVisible} onClose={handleHelpClose} shortcuts={shortcuts} />
      </Layout>
      <DevPanel metrics={metrics} health={health} isVisible={monitoringEnabled} />
    </>
  )

  // Wrap with TouchGestures on touch devices
  if (isTouchDevice()) {
    return (
      <TouchGestures
        onSwipeLeft={canGoNextValue ? handleNext : undefined}
        onSwipeRight={canGoPrevious ? handlePrevious : undefined}
        disabled={isJumpModalOpen || isHelpVisible}
      >
        {content}
      </TouchGestures>
    )
  }

  return content
}
