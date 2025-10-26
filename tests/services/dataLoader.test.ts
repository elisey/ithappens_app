// ABOUTME: Tests for DataLoader service - streaming, progress, retry logic
// ABOUTME: Covers successful loading, error scenarios, and edge cases

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataLoader } from '../../src/services/dataLoader'
import { NetworkError, ParseError, TimeoutError, ValidationError } from '../../src/types/errors'

describe('DataLoader', () => {
  let loader: DataLoader

  beforeEach(() => {
    loader = new DataLoader()
    vi.clearAllMocks()
  })

  describe('parseJSON', () => {
    it('should parse valid JSON', async () => {
      const text = '{"1":"story one","2":"story two"}'
      const result = await loader.parseJSON(text)
      expect(result).toEqual({ '1': 'story one', '2': 'story two' })
    })

    it('should throw ParseError on invalid JSON', async () => {
      const text = '{"invalid": json}'
      await expect(loader.parseJSON(text)).rejects.toThrow(ParseError)
    })

    it('should handle large JSON without blocking', async () => {
      const largeData: Record<string, string> = {}
      for (let i = 0; i < 10000; i++) {
        largeData[i.toString()] = `Story ${i}`
      }
      const text = JSON.stringify(largeData)

      const startTime = performance.now()
      await loader.parseJSON(text)
      const duration = performance.now() - startTime

      // Should complete quickly due to async parsing
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('validateStoriesData', () => {
    it('should validate correct stories data', () => {
      const data = { '1': 'story one', '2': 'story two' }
      expect(loader.validateStoriesData(data)).toBe(true)
    })

    it('should reject non-object data', () => {
      expect(() => loader.validateStoriesData(null)).toThrow(ValidationError)
      expect(() => loader.validateStoriesData('string')).toThrow(ValidationError)
      expect(() => loader.validateStoriesData(123)).toThrow(ValidationError)
    })

    it('should reject empty object', () => {
      expect(() => loader.validateStoriesData({})).toThrow(ValidationError)
    })

    it('should reject invalid story IDs', () => {
      const data = { abc: 'story', '123': 'valid' }
      expect(() => loader.validateStoriesData(data)).toThrow(ValidationError)
    })

    it('should reject non-string story content', () => {
      const data = { '1': 'valid', '2': 123 }
      expect(() => loader.validateStoriesData(data)).toThrow(ValidationError)
    })
  })

  describe('fetchWithProgress', () => {
    it('should handle fetch timeout', async () => {
      // Mock slow fetch that respects abort signal
      global.fetch = vi.fn((url, options) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              text: () => Promise.resolve('{"1":"test"}'),
            } as Response)
          }, 2000)

          // Listen for abort
          options?.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      })

      await expect(
        loader.fetchWithProgress({
          url: 'https://example.com/data.json',
          timeout: 100,
        })
      ).rejects.toThrow(TimeoutError)
    })

    it('should handle abort signal', async () => {
      const controller = new AbortController()

      global.fetch = vi.fn((url, options) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              text: () => Promise.resolve('{"1":"test"}'),
            } as Response)
          }, 1000)

          // Listen for abort
          options?.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      })

      // Abort after 50ms
      setTimeout(() => controller.abort(), 50)

      await expect(
        loader.fetchWithProgress({
          url: 'https://example.com/data.json',
          signal: controller.signal,
        })
      ).rejects.toThrow()
    })
  })

  describe('Error handling', () => {
    it('should throw error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Network request failed'))

      await expect(
        loader.fetchWithProgress({
          url: 'https://example.com/data.json',
          retries: 0,
        })
      ).rejects.toThrow()
    })

    it('should throw NetworkError on non-OK response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: () => null,
        },
      } as Response)

      await expect(
        loader.fetchWithProgress({
          url: 'https://example.com/data.json',
        })
      ).rejects.toThrow(NetworkError)
    })
  })

  describe('Integration', () => {
    it('should load and validate stories successfully', async () => {
      const mockData = { '1': 'story one', '2': 'story two' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => null,
        },
        text: () => Promise.resolve(JSON.stringify(mockData)),
      } as Response)

      const result = await loader.loadStories({
        url: 'https://example.com/stories.json',
        retries: 0,
      })

      expect(result).toEqual(mockData)
    })
  })
})
