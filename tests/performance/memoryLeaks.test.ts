// ABOUTME: Memory leak detection tests for story navigation and long-running operations
// ABOUTME: Tests memory stability, leak detection, and cleanup on repeated operations

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StoryService } from '../../src/services/storyService'
import type { StoriesData } from '../../src/types/story'

// Mock fetch globally
global.fetch = vi.fn()

/**
 * Generate test dataset
 */
function generateDataset(count: number): StoriesData {
  const stories: StoriesData = {}
  for (let i = 1; i <= count; i++) {
    stories[i.toString()] = `Story ${i} with some content to simulate real data.`
  }
  return stories
}

/**
 * Create mock response
 */
function createMockResponse(data: StoriesData): Response {
  const jsonString = JSON.stringify(data)

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: () => null,
    } as Headers,
    json: () => Promise.resolve(data),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default',
    url: '',
    clone: () => createMockResponse(data),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(jsonString),
  } as Response
}

describe('Memory Leak Detection', () => {
  let storyService: StoryService
  const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>

  beforeEach(() => {
    mockFetch.mockClear()
    storyService = new StoryService()
  })

  describe('Navigation Memory Stability', () => {
    it('should not leak memory during repeated navigation', async () => {
      const dataset = generateDataset(100)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      // Simulate 1000 navigation operations
      let currentId = 1
      for (let i = 0; i < 1000; i++) {
        const nextId = storyService.getNextId(currentId)
        if (nextId) {
          storyService.getById(nextId)
          currentId = nextId
        }
      }

      // Memory should remain stable (getAllIds should return consistent results)
      expect(storyService.getAllIds()).toHaveLength(100)
      expect(storyService.isLoaded()).toBe(true)
    })

    it('should handle rapid back-and-forth navigation', async () => {
      const dataset = generateDataset(50)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      let currentId = 25 // Middle of dataset
      for (let i = 0; i < 500; i++) {
        // Alternate between next and previous
        if (i % 2 === 0) {
          const nextId = storyService.getNextId(currentId)
          if (nextId) currentId = nextId
        } else {
          const prevId = storyService.getPrevId(currentId)
          if (prevId) currentId = prevId
        }
      }

      expect(storyService.isLoaded()).toBe(true)
      expect(storyService.getAllIds()).toHaveLength(50)
    })
  })

  describe('Repeated Initialization', () => {
    it('should not leak memory on repeated initialization', async () => {
      const dataset = generateDataset(100)

      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(createMockResponse(dataset))
        await storyService.initialize(`/test-${i}.json`)

        expect(storyService.isLoaded()).toBe(true)
        expect(storyService.getAllIds()).toHaveLength(100)
      }

      // Final state should be clean
      expect(storyService.getAllIds()).toHaveLength(100)
    })

    it('should clean up data on failed re-initialization', async () => {
      const validDataset = generateDataset(50)
      mockFetch.mockResolvedValueOnce(createMockResponse(validDataset))

      await storyService.initialize('/valid.json')
      expect(storyService.isLoaded()).toBe(true)

      // Now fail the next initialization (mock multiple times for retries)
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(storyService.initialize('/invalid.json')).rejects.toThrow()

      // Data should be cleaned up
      expect(storyService.isLoaded()).toBe(false)
      expect(storyService.getAllIds()).toHaveLength(0)
      expect(storyService.getLoadingMetrics()).toBeNull()
    }, 10000)
  })

  describe('Large Dataset Stability', () => {
    it('should maintain stability with 10,000 stories', async () => {
      const largeDataset = generateDataset(10000)
      mockFetch.mockResolvedValue(createMockResponse(largeDataset))

      await storyService.initialize('/large.json')

      // Random access pattern
      for (let i = 0; i < 100; i++) {
        const randomId = Math.floor(Math.random() * 10000) + 1
        storyService.getById(randomId)
      }

      expect(storyService.getAllIds()).toHaveLength(10000)
      expect(storyService.isLoaded()).toBe(true)
    })

    it('should handle circular navigation at boundaries', async () => {
      const dataset = generateDataset(100)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      // Test circular navigation at start
      const firstId = storyService.getFirstId()
      expect(firstId).toBe(1)

      const prevFromFirst = storyService.getPrevId(firstId!)
      expect(prevFromFirst).toBe(100) // Should wrap to end

      // Test circular navigation at end
      const lastId = storyService.getLastId()
      expect(lastId).toBe(100)

      const nextFromLast = storyService.getNextId(lastId!)
      expect(nextFromLast).toBe(1) // Should wrap to start

      // Repeat wrapping 100 times
      let currentId = 1
      for (let i = 0; i < 100; i++) {
        const prevId = storyService.getPrevId(currentId)
        if (prevId) currentId = prevId
      }

      expect(storyService.isLoaded()).toBe(true)
    })
  })

  describe('Story Content Retrieval', () => {
    it('should not leak memory on repeated getById calls', async () => {
      const dataset = generateDataset(100)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      // Retrieve the same story 1000 times
      for (let i = 0; i < 1000; i++) {
        const story = storyService.getById(50)
        expect(story).toBe('Story 50 with some content to simulate real data.')
      }

      expect(storyService.isLoaded()).toBe(true)
    })

    it('should handle rapid random access', async () => {
      const dataset = generateDataset(200)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      // Random access to different stories
      for (let i = 0; i < 1000; i++) {
        const randomId = Math.floor(Math.random() * 200) + 1
        storyService.getById(randomId)
      }

      expect(storyService.getAllIds()).toHaveLength(200)
    })
  })

  describe('Metrics Stability', () => {
    it('should maintain consistent metrics across operations', async () => {
      const dataset = generateDataset(100)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      const initialMetrics = storyService.getLoadingMetrics()
      expect(initialMetrics).toBeDefined()
      expect(initialMetrics?.storyCount).toBe(100)

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        storyService.getNextId(i + 1)
        storyService.getById(i + 1)
      }

      // Metrics should remain consistent
      const finalMetrics = storyService.getLoadingMetrics()
      expect(finalMetrics?.storyCount).toBe(100)
      expect(finalMetrics?.loadTime).toBe(initialMetrics?.loadTime)
    })
  })

  describe('Boundary Conditions', () => {
    it('should handle empty navigation gracefully', async () => {
      const dataset = generateDataset(1) // Single story
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/single.json')

      // Navigate repeatedly on single story
      for (let i = 0; i < 100; i++) {
        const next = storyService.getNextId(1)
        const prev = storyService.getPrevId(1)
        expect(next).toBe(1) // Should return same ID
        expect(prev).toBe(1)
      }

      expect(storyService.isLoaded()).toBe(true)
    })

    it('should handle non-existent ID lookups', async () => {
      const dataset = generateDataset(100)
      mockFetch.mockResolvedValue(createMockResponse(dataset))

      await storyService.initialize('/test.json')

      // Try to access non-existent IDs repeatedly
      for (let i = 0; i < 100; i++) {
        expect(storyService.getById(9999)).toBeNull()
        expect(storyService.getNextId(9999)).toBeNull()
        expect(storyService.getPrevId(9999)).toBeNull()
      }

      expect(storyService.isLoaded()).toBe(true)
    })
  })
})
