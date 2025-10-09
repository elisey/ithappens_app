// ABOUTME: React hook for managing StoryService initialization and state
// ABOUTME: Provides loading state, error handling, and retry functionality

import { useEffect, useState, useCallback, useRef } from 'preact/hooks'
import { StoryService, type LoadingStatus, type LoadingCallbacks } from '../services/storyService'

export interface UseStoryServiceResult {
  service: StoryService | null
  isLoading: boolean
  loadingStatus: LoadingStatus | null
  error: Error | null
  retry: () => void
  progress?: number
}

export interface UseStoryServiceOptions {
  url: string
  timeout?: number
}

export function useStoryService({
  url,
  timeout = 10000,
}: UseStoryServiceOptions): UseStoryServiceResult {
  const [service, setService] = useState<StoryService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<number | undefined>(undefined)

  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const initializeService = useCallback(async () => {
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const currentController = abortControllerRef.current

    setIsLoading(true)
    setError(null)
    setProgress(undefined)
    setLoadingStatus('initializing')

    try {
      const newService = new StoryService()

      const callbacks: LoadingCallbacks = {
        onStatusChange: (status: LoadingStatus) => {
          if (currentController.signal.aborted || !mountedRef.current) return
          setLoadingStatus(status)
        },
        onProgress: (p: number) => {
          if (currentController.signal.aborted || !mountedRef.current) return
          setProgress(p)
        },
      }

      await newService.initializeWithCallbacks(url, callbacks, timeout)

      // Check if component is still mounted and request wasn't aborted
      if (currentController.signal.aborted || !mountedRef.current) return

      setService(newService)
      setIsLoading(false)
      setLoadingStatus(null)
      setProgress(undefined)
    } catch (err) {
      // Check if component is still mounted and request wasn't aborted
      if (currentController.signal.aborted || !mountedRef.current) return

      setError(err instanceof Error ? err : new Error(String(err)))
      setIsLoading(false)
      setLoadingStatus(null)
      setProgress(undefined)
    }
  }, [url, timeout])

  const retry = useCallback(() => {
    void initializeService()
  }, [initializeService])

  useEffect(() => {
    mountedRef.current = true

    void initializeService()

    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [initializeService])

  return {
    service,
    isLoading,
    loadingStatus,
    error,
    retry,
    progress,
  }
}
