// ABOUTME: Comprehensive error scenario tests for data loading
// ABOUTME: Tests network failures, timeouts, corrupted data, and recovery strategies

/* eslint-disable no-undef */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { DataLoader } from '../../src/services/dataLoader'
import { NetworkError, ParseError, ValidationError, TimeoutError } from '../../src/types/errors'

// Suppress error logging during tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('Error Scenarios', () => {
  let loader: DataLoader

  beforeEach(() => {
    loader = new DataLoader()
    vi.clearAllMocks()
  })

  describe('Network Errors', () => {
    it('should handle offline/network unavailable', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow()
    })

    it('should handle 404 Not Found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: () => null },
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(NetworkError)
    })

    it('should handle 500 Server Error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: { get: () => null },
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(NetworkError)
    })

    it('should retry on network errors', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => null },
          text: () => Promise.resolve('{"1":"success"}'),
        } as Response)

      global.fetch = mockFetch

      const result = await loader.loadStories({
        url: 'https://example.com/stories.json',
        retries: 3,
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ '1': 'success' })
    })
  })

  describe('Timeout Errors', () => {
    it('should timeout on slow network', async () => {
      global.fetch = vi.fn((url, options) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              text: () => Promise.resolve('{"1":"test"}'),
            } as Response)
          }, 5000)

          // Listen for abort
          options?.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      })

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          timeout: 100,
          retries: 0,
        })
      ).rejects.toThrow(TimeoutError)
    })
  })

  describe('Parse Errors', () => {
    it('should handle corrupted JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{"invalid": json, missing quote}'),
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(ParseError)
    })

    it('should handle incomplete JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{"1":"story one"'),
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(ParseError)
    })
  })

  describe('Validation Errors', () => {
    it('should reject invalid data structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('[]'), // Array instead of object
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should reject empty data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{}'),
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should reject invalid story IDs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{"abc":"story","xyz":"story"}'),
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should reject non-string story content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{"1":123,"2":456}'),
      } as Response)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 0,
        })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('Retry Strategy', () => {
    it('should not retry validation errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{}'), // Empty object - validation error
      } as Response)

      global.fetch = mockFetch

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 3,
        })
      ).rejects.toThrow(ValidationError)

      // Should only fetch once (no retries for validation errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry parse errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('invalid json'),
      } as Response)

      global.fetch = mockFetch

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          retries: 3,
        })
      ).rejects.toThrow(ParseError)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Abort Handling', () => {
    it('should handle user-initiated abort', async () => {
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

      setTimeout(() => controller.abort(), 50)

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          signal: controller.signal,
          retries: 0,
        })
      ).rejects.toThrow()
    })

    it('should not retry on user abort', async () => {
      const controller = new AbortController()
      const mockFetch = vi.fn(() => {
        controller.abort()
        return Promise.reject(new Error('AbortError'))
      })

      global.fetch = mockFetch

      await expect(
        loader.loadStories({
          url: 'https://example.com/stories.json',
          signal: controller.signal,
          retries: 3,
        })
      ).rejects.toThrow()

      // Should not retry when user aborts
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
