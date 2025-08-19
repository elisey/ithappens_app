// ABOUTME: Unit tests for StoryService class using TDD approach
// ABOUTME: Tests data loading, story retrieval, and navigation functionality

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StoryService } from '../../src/services/storyService'
import type { StoriesData } from '../../src/types/story'

// Mock data for testing
const mockStoriesData: StoriesData = {
  '1': 'First story',
  '3': 'Third story',
  '5': 'Fifth story',
  '7': 'Seventh story',
  '10': 'Tenth story',
}

// Mock fetch globally
globalThis.fetch = vi.fn()

describe('StoryService', () => {
  let storyService: StoryService
  const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

  beforeEach(() => {
    storyService = new StoryService()
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should load stories data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesData,
      })

      await storyService.initialize('/stories.json.sample')

      expect(storyService.isLoaded()).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/stories.json.sample')
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(storyService.initialize('/stories.json.sample')).rejects.toThrow('Network error')
      expect(storyService.isLoaded()).toBe(false)
    })

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(storyService.initialize('/stories.json.sample')).rejects.toThrow(
        'Failed to load stories: 404 Not Found'
      )
      expect(storyService.isLoaded()).toBe(false)
    })

    it('should handle empty data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await storyService.initialize('/stories.json.sample')

      expect(storyService.isLoaded()).toBe(true)
      expect(storyService.getAllIds()).toEqual([])
    })
  })

  describe('getById', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesData,
      })
      await storyService.initialize('/stories.json.sample')
    })

    it('should return story for existing ID', () => {
      expect(storyService.getById(1)).toBe('First story')
      expect(storyService.getById(3)).toBe('Third story')
    })

    it('should return null for non-existing ID', () => {
      expect(storyService.getById(2)).toBe(null)
      expect(storyService.getById(999)).toBe(null)
    })

    it('should return null when not loaded', () => {
      const unloadedService = new StoryService()
      expect(unloadedService.getById(1)).toBe(null)
    })
  })

  describe('navigation methods', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesData,
      })
      await storyService.initialize('/stories.json.sample')
    })

    describe('getNextId', () => {
      it('should return next existing ID', () => {
        expect(storyService.getNextId(1)).toBe(3)
        expect(storyService.getNextId(3)).toBe(5)
        expect(storyService.getNextId(5)).toBe(7)
      })

      it('should return first ID after last ID (circular)', () => {
        expect(storyService.getNextId(10)).toBe(1)
      })

      it('should return null for non-existing current ID', () => {
        expect(storyService.getNextId(2)).toBe(null)
        expect(storyService.getNextId(999)).toBe(null)
      })

      it('should handle single story', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ '1': 'Only story' }),
        })
        const singleService = new StoryService()
        await singleService.initialize('/single.json')

        expect(singleService.getNextId(1)).toBe(1)
      })
    })

    describe('getPrevId', () => {
      it('should return previous existing ID', () => {
        expect(storyService.getPrevId(10)).toBe(7)
        expect(storyService.getPrevId(7)).toBe(5)
        expect(storyService.getPrevId(5)).toBe(3)
      })

      it('should return last ID before first ID (circular)', () => {
        expect(storyService.getPrevId(1)).toBe(10)
      })

      it('should return null for non-existing current ID', () => {
        expect(storyService.getPrevId(2)).toBe(null)
        expect(storyService.getPrevId(999)).toBe(null)
      })

      it('should handle single story', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ '1': 'Only story' }),
        })
        const singleService = new StoryService()
        await singleService.initialize('/single.json')

        expect(singleService.getPrevId(1)).toBe(1)
      })
    })

    describe('getFirstId', () => {
      it('should return first ID', () => {
        expect(storyService.getFirstId()).toBe(1)
      })

      it('should return null when no stories', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        const emptyService = new StoryService()
        await emptyService.initialize('/empty.json')

        expect(emptyService.getFirstId()).toBe(null)
      })
    })

    describe('getLastId', () => {
      it('should return last ID', () => {
        expect(storyService.getLastId()).toBe(10)
      })

      it('should return null when no stories', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        const emptyService = new StoryService()
        await emptyService.initialize('/empty.json')

        expect(emptyService.getLastId()).toBe(null)
      })
    })

    describe('getAllIds', () => {
      it('should return sorted array of all IDs', () => {
        expect(storyService.getAllIds()).toEqual([1, 3, 5, 7, 10])
      })

      it('should return empty array when no stories', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        const emptyService = new StoryService()
        await emptyService.initialize('/empty.json')

        expect(emptyService.getAllIds()).toEqual([])
      })

      it('should return empty array when not loaded', () => {
        const unloadedService = new StoryService()
        expect(unloadedService.getAllIds()).toEqual([])
      })
    })
  })

  describe('isLoaded', () => {
    it('should return false initially', () => {
      expect(storyService.isLoaded()).toBe(false)
    })

    it('should return true after successful initialization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoriesData,
      })

      await storyService.initialize('/stories.json.sample')
      expect(storyService.isLoaded()).toBe(true)
    })

    it('should return false after failed initialization', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await storyService.initialize('/stories.json.sample')
      } catch {
        // Expected error
      }

      expect(storyService.isLoaded()).toBe(false)
    })
  })
})
