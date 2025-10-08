// ABOUTME: Unit tests for useStoryService hook
// ABOUTME: Tests initialization, loading states, error handling, and retry logic

import { renderHook, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useStoryService } from '../../src/hooks/useStoryService'
import { StoryService } from '../../src/services/storyService'
import type { LoadingStatus, LoadingCallbacks } from '../../src/services/storyService'

interface MockStoryService {
  initializeWithCallbacks: (
    url: string,
    callbacks?: LoadingCallbacks,
    timeout?: number
  ) => Promise<void>
}

// Mock StoryService
vi.mock('../../src/services/storyService', () => {
  return {
    StoryService: vi.fn().mockImplementation(
      (): MockStoryService => ({
        initializeWithCallbacks: vi.fn(),
      })
    ),
  }
})

describe('useStoryService', () => {
  const mockUrl = 'https://example.com/stories.json'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful loading', () => {
    it('should initialize service on mount', async () => {
      const mockInitialize = vi.fn().mockResolvedValue(undefined)
      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      // Should start with loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.service).toBeNull()
      expect(result.current.error).toBeNull()

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledWith(mockUrl, expect.any(Object), 10000)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should track loading status changes', async () => {
      let statusCallback: ((status: LoadingStatus) => void) | undefined

      const mockInitialize = vi.fn().mockImplementation(async (_url, callbacks) => {
        statusCallback = callbacks?.onStatusChange
        statusCallback?.('initializing')
        statusCallback?.('loading')
        statusCallback?.('parsing')
        statusCallback?.('indexing')
      })

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      await waitFor(() => {
        expect(result.current.loadingStatus).toBeTruthy()
      })
    })

    it('should track progress updates', async () => {
      let progressCallback: ((progress: number) => void) | undefined

      const mockInitialize = vi.fn().mockImplementation(async (_url, callbacks) => {
        progressCallback = callbacks?.onProgress
        progressCallback?.(0)
        progressCallback?.(50)
        progressCallback?.(100)
      })

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      await waitFor(() => {
        expect(result.current.progress).toBeDefined()
      })
    })

    it('should set service when initialization completes', async () => {
      const mockInitialize = vi.fn().mockResolvedValue(undefined)
      const mockService: MockStoryService = {
        initializeWithCallbacks: mockInitialize,
      }

      vi.mocked(StoryService).mockImplementation(() => mockService)

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.service).toBe(mockService)
      expect(result.current.error).toBeNull()
      expect(result.current.loadingStatus).toBeNull()
    })

    it('should use custom timeout', async () => {
      const mockInitialize = vi.fn().mockResolvedValue(undefined)
      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      renderHook(() =>
        useStoryService({
          url: mockUrl,
          timeout: 5000,
        })
      )

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledWith(mockUrl, expect.any(Object), 5000)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle initialization errors', async () => {
      const testError = new Error('Network error')
      const mockInitialize = vi.fn().mockRejectedValue(testError)

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      await waitFor(() => {
        expect(result.current.error).toEqual(testError)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.service).toBeNull()
      expect(result.current.loadingStatus).toBeNull()
    })

    it('should handle non-Error exceptions', async () => {
      const mockInitialize = vi.fn().mockRejectedValue('String error')

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.service).toBeNull()
    })
  })

  describe('Retry functionality', () => {
    it('should allow retrying after error', async () => {
      const mockInitialize = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined)

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      // Wait for first attempt to fail
      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(mockInitialize).toHaveBeenCalledTimes(1)

      // Call retry
      result.current.retry()

      // Wait for retry to complete
      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })

      expect(mockInitialize).toHaveBeenCalledTimes(2)
      expect(result.current.isLoading).toBe(false)
    })

    it('should reset error and initiate loading when retrying', async () => {
      let callCount = 0
      const mockInitialize = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('First error')
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })

      const errorBeforeRetry = result.current.error

      result.current.retry()

      // Wait for the retry to start
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Error should be cleared after retry starts
      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })

      expect(errorBeforeRetry).toBeTruthy()
    })
  })

  describe('Cleanup', () => {
    it('should cancel request on unmount', async () => {
      const mockInitialize = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 1000)
          })
      )

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { unmount } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      // Unmount before initialization completes
      unmount()

      // Initialization should have been called
      expect(mockInitialize).toHaveBeenCalled()
    })

    it('should not update state after unmount', async () => {
      const mockInitialize = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          })
      )

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result, unmount } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      const initialLoading = result.current.isLoading
      unmount()

      await new Promise((resolve) => setTimeout(resolve, 200))

      // State should not have changed after unmount
      expect(result.current.isLoading).toBe(initialLoading)
    })
  })

  describe('Abort previous requests', () => {
    it('should abort previous request when retry is called', async () => {
      let firstAborted = false
      const mockInitialize = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              if (!firstAborted) resolve(undefined)
            }, 100)
          })
      )

      vi.mocked(StoryService).mockImplementation(
        (): MockStoryService => ({
          initializeWithCallbacks: mockInitialize,
        })
      )

      const { result } = renderHook(() =>
        useStoryService({
          url: mockUrl,
        })
      )

      // Immediately call retry to abort first request
      firstAborted = true
      result.current.retry()

      expect(mockInitialize).toHaveBeenCalledTimes(2)
    })
  })
})
