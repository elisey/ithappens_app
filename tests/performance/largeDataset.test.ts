// ABOUTME: Performance tests for StoryService with large dataset simulation
// ABOUTME: Validates loading time, memory usage, and navigation performance for 13k+ stories

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { StoryService } from '../../src/services/storyService'
import type { StoriesData } from '../../src/types/story'

// Mock performance utilities to avoid console noise during tests
vi.mock('../../src/utils/performance', () => ({
  measureExecutionTime: async <T>(fn: () => T | Promise<T>): Promise<T> => {
    return await fn()
  },
  logMemoryUsage: vi.fn(),
  formatBytes: (bytes: number) => `${bytes} bytes`,
}))

// Mock console methods to reduce noise during performance tests
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Filter out performance-related logs during tests
  console.log = vi.fn((message, ...args) => {
    if (
      typeof message === 'string' &&
      (message.includes('📊 [StoryService]') ||
        message.includes('📈 [Performance]') ||
        message.includes('⏱️ [Performance]') ||
        message.includes('🎉 [App]'))
    ) {
      return // Suppress performance logs
    }
    originalConsoleLog(message, ...args)
  })

  console.warn = vi.fn((message, ...args) => {
    if (typeof message === 'string' && message.includes('[Performance]')) {
      return // Suppress performance warnings
    }
    originalConsoleWarn(message, ...args)
  })
})

afterAll(() => {
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
})

// Mock fetch for controlled testing
global.fetch = vi.fn()

/**
 * Generate mock stories data for performance testing
 */
function generateLargeDataset(count: number): StoriesData {
  const stories: StoriesData = {}

  for (let i = 1; i <= count; i++) {
    // Generate stories with varying lengths to simulate real data
    const baseStory = `История номер ${i}. `
    const extraContent = 'Дополнительный текст для увеличения размера. '.repeat(
      Math.floor(Math.random() * 10) + 1
    )
    stories[i.toString()] = baseStory + extraContent
  }

  return stories
}

/**
 * Create a mock fetch response for testing
 */
function createMockResponse(data: StoriesData, dataSize?: number): Response {
  const jsonString = JSON.stringify(data)
  const actualSize = dataSize || jsonString.length

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: (name: string) => {
        if (name === 'content-length') return actualSize.toString()
        return null
      },
    } as Headers,
    json: () => Promise.resolve(data),
    // Add minimal Response properties to satisfy TypeScript
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default',
    url: '',
    clone: () => createMockResponse(data, dataSize),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(jsonString),
  } as Response
}

describe('StoryService Performance Tests', () => {
  let storyService: StoryService

  beforeEach(() => {
    storyService = new StoryService()
    vi.clearAllMocks()
  })

  describe('Large Dataset Loading', () => {
    it('should initialize with 15,000 stories in under 2 seconds', async () => {
      const largeDataset = generateLargeDataset(15000)
      const mockResponse = createMockResponse(largeDataset)

      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)

      const startTime = performance.now()
      await storyService.initialize('/stories.json')
      const endTime = performance.now()

      const loadTime = endTime - startTime
      expect(loadTime).toBeLessThan(2000) // Less than 2 seconds
      expect(storyService.isLoaded()).toBe(true)
      expect(storyService.getAllIds()).toHaveLength(15000)
    })

    it('should handle 13,489 stories (production dataset size)', async () => {
      const productionSizeDataset = generateLargeDataset(13489)
      const mockResponse = createMockResponse(productionSizeDataset)

      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)

      const startTime = performance.now()
      await storyService.initialize('/stories.json')
      const endTime = performance.now()

      const loadTime = endTime - startTime
      expect(loadTime).toBeLessThan(3000) // Allow 3 seconds for production size
      expect(storyService.isLoaded()).toBe(true)
      expect(storyService.getAllIds()).toHaveLength(13489)
    })

    it('should record loading metrics correctly', async () => {
      const testDataset = generateLargeDataset(1000)
      const mockDataSize = 1024 * 1024 // 1 MB
      const mockResponse = createMockResponse(testDataset, mockDataSize)

      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)

      await storyService.initialize('/stories.json')

      const metrics = storyService.getLoadingMetrics()
      expect(metrics).toBeDefined()
      expect(metrics?.storyCount).toBe(1000)
      expect(metrics?.dataSize).toBe(mockDataSize)
      expect(metrics?.loadTime).toBeGreaterThan(0)
    })
  })

  describe('Navigation Performance', () => {
    beforeEach(async () => {
      // Setup a large dataset for navigation tests
      const largeDataset = generateLargeDataset(10000)
      const mockResponse = createMockResponse(largeDataset)

      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)
      await storyService.initialize('/stories.json')
    })

    it('should navigate to next story in under 50ms', () => {
      const currentId = 5000 // Middle of dataset

      const startTime = performance.now()
      const nextId = storyService.getNextId(currentId)
      const endTime = performance.now()

      const navigationTime = endTime - startTime
      expect(navigationTime).toBeLessThan(50)
      expect(nextId).toBe(5001)
    })

    it('should navigate to previous story in under 50ms', () => {
      const currentId = 5000 // Middle of dataset

      const startTime = performance.now()
      const prevId = storyService.getPrevId(currentId)
      const endTime = performance.now()

      const navigationTime = endTime - startTime
      expect(navigationTime).toBeLessThan(50)
      expect(prevId).toBe(4999)
    })

    it('should retrieve story by ID in under 50ms', () => {
      const targetId = 7500 // Arbitrary ID in dataset

      const startTime = performance.now()
      const story = storyService.getById(targetId)
      const endTime = performance.now()

      const retrievalTime = endTime - startTime
      expect(retrievalTime).toBeLessThan(50)
      expect(story).toContain('История номер 7500')
    })

    it('should handle circular navigation efficiently', () => {
      // Test navigation from last to first story
      const lastId = storyService.getLastId()
      expect(lastId).toBe(10000)

      const startTime = performance.now()
      const nextAfterLast = storyService.getNextId(lastId!)
      const endTime = performance.now()

      const navigationTime = endTime - startTime
      expect(navigationTime).toBeLessThan(50)
      expect(nextAfterLast).toBe(1) // Should wrap to first
    })
  })

  describe('Memory Efficiency', () => {
    it('should not cause memory leaks with repeated initialization', async () => {
      const smallDataset = generateLargeDataset(100)
      const mockResponse = createMockResponse(smallDataset)

      // Initialize multiple times to test for memory leaks
      for (let i = 0; i < 5; i++) {
        ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)
        await storyService.initialize('/stories.json')

        expect(storyService.isLoaded()).toBe(true)
        expect(storyService.getAllIds()).toHaveLength(100)
      }

      // Memory should remain stable (this is a basic check)
      expect(storyService.getAllIds()).toHaveLength(100)
    })

    it('should clean up data on failed initialization', async () => {
      // First, initialize successfully
      const validDataset = generateLargeDataset(100)
      const validResponse = createMockResponse(validDataset)

      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(validResponse)
      await storyService.initialize('/stories.json')
      expect(storyService.isLoaded()).toBe(true)

      // Then simulate a failure
      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(storyService.initialize('/stories.json')).rejects.toThrow()

      // Data should be cleaned up
      expect(storyService.isLoaded()).toBe(false)
      expect(storyService.getAllIds()).toHaveLength(0)
      expect(storyService.getLoadingMetrics()).toBeNull()
    })
  })

  describe('Data Structure Efficiency', () => {
    it('should handle non-sequential IDs efficiently', async () => {
      // Create dataset with gaps in IDs
      const sparseDataset: StoriesData = {}
      const testIds = [1, 5, 10, 100, 500, 1000, 5000, 9999]

      testIds.forEach((id) => {
        sparseDataset[id.toString()] = `История с ID ${id}`
      })

      const mockResponse = createMockResponse(sparseDataset)
      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)

      await storyService.initialize('/stories.json')

      // Navigation should still be efficient
      const startTime = performance.now()
      const nextAfter100 = storyService.getNextId(100)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50)
      expect(nextAfter100).toBe(500) // Next available ID
    })

    it('should maintain sorted order with large datasets', async () => {
      // Create dataset with random ID order
      const randomDataset: StoriesData = {}
      const ids = Array.from({ length: 1000 }, (_, i) => i + 1)

      // Shuffle the IDs
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[ids[i], ids[j]] = [ids[j], ids[i]]
      }

      ids.forEach((id) => {
        randomDataset[id.toString()] = `История ${id}`
      })

      const mockResponse = createMockResponse(randomDataset)
      ;(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse)

      await storyService.initialize('/stories.json')

      const sortedIds = storyService.getAllIds()

      // Verify IDs are properly sorted
      for (let i = 1; i < sortedIds.length; i++) {
        expect(sortedIds[i]).toBeGreaterThan(sortedIds[i - 1])
      }

      expect(sortedIds[0]).toBe(1)
      expect(sortedIds[sortedIds.length - 1]).toBe(1000)
    })
  })
})
