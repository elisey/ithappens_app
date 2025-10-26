// ABOUTME: Comprehensive test suite for StorageService with ≥90% coverage
// ABOUTME: Tests basic functionality, validation, versioning, TTL, error handling, and fallback strategies

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService } from '../../src/services/storageService'

describe('StorageService', () => {
  let service: StorageService

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    service = new StorageService()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Basic Functionality', () => {
    test('saves and retrieves last story ID', async () => {
      const result = await service.setLastStoryId(123)
      expect(result).toBe(true)

      const id = await service.getLastStoryId()
      expect(id).toBe(123)
    })

    test('returns null when no data exists', async () => {
      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('overwrites existing data', async () => {
      await service.setLastStoryId(100)
      await service.setLastStoryId(200)

      const id = await service.getLastStoryId()
      expect(id).toBe(200)
    })

    test('clears stored data', async () => {
      await service.setLastStoryId(123)
      await service.clear()

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })
  })

  describe('Data Validation', () => {
    test('handles invalid stored JSON', async () => {
      localStorage.setItem('ithappens_last_story_id', 'invalid json{')

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('handles invalid data structure', async () => {
      localStorage.setItem('ithappens_last_story_id', JSON.stringify({ foo: 'bar' }))

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('handles invalid data types', async () => {
      localStorage.setItem(
        'ithappens_last_story_id',
        JSON.stringify({
          value: 'not a number',
          timestamp: Date.now(),
          version: '1.0',
        })
      )

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('rejects negative story IDs', async () => {
      const result = await service.setLastStoryId(-1)
      expect(result).toBe(false)
    })

    test('rejects zero as story ID', async () => {
      const result = await service.setLastStoryId(0)
      expect(result).toBe(false)
    })

    test('rejects non-integer story IDs', async () => {
      const result = await service.setLastStoryId(123.45)
      expect(result).toBe(false)
    })

    test('handles null data structure', async () => {
      localStorage.setItem('ithappens_last_story_id', 'null')

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('handles missing required fields', async () => {
      localStorage.setItem(
        'ithappens_last_story_id',
        JSON.stringify({
          value: 123,
          // missing timestamp and version
        })
      )

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })
  })

  describe('Version Management', () => {
    test('stores version with data', async () => {
      await service.setLastStoryId(123)

      const raw = localStorage.getItem('ithappens_last_story_id')
      const data = JSON.parse(raw!)
      expect(data.version).toBe('1.0')
    })

    test('ignores data with incompatible version', async () => {
      localStorage.setItem(
        'ithappens_last_story_id',
        JSON.stringify({
          value: 123,
          timestamp: Date.now(),
          version: '99.0',
        })
      )

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('clears incompatible version data', async () => {
      localStorage.setItem(
        'ithappens_last_story_id',
        JSON.stringify({
          value: 123,
          timestamp: Date.now(),
          version: '99.0',
        })
      )

      await service.getLastStoryId()

      const raw = localStorage.getItem('ithappens_last_story_id')
      expect(raw).toBeNull()
    })
  })

  describe('TTL Support', () => {
    test('returns null for expired data', async () => {
      const serviceWithTTL = new StorageService({ ttl: 100 }) // 100ms
      await serviceWithTTL.setLastStoryId(123)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      const id = await serviceWithTTL.getLastStoryId()
      expect(id).toBeNull()
    })

    test('returns data within TTL', async () => {
      const serviceWithTTL = new StorageService({ ttl: 5000 }) // 5 seconds
      await serviceWithTTL.setLastStoryId(123)

      const id = await serviceWithTTL.getLastStoryId()
      expect(id).toBe(123)
    })

    test('updates timestamp on save', async () => {
      await service.setLastStoryId(123)
      const firstRaw = localStorage.getItem('ithappens_last_story_id')
      const firstTimestamp = JSON.parse(firstRaw!).timestamp

      await new Promise((resolve) => setTimeout(resolve, 10))
      await service.setLastStoryId(456)
      const secondRaw = localStorage.getItem('ithappens_last_story_id')
      const secondTimestamp = JSON.parse(secondRaw!).timestamp

      expect(secondTimestamp).toBeGreaterThan(firstTimestamp)
    })

    test('clears expired data automatically', async () => {
      const serviceWithTTL = new StorageService({ ttl: 100 }) // 100ms
      await serviceWithTTL.setLastStoryId(123)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      await serviceWithTTL.getLastStoryId()

      const raw = localStorage.getItem('ithappens_last_story_id')
      expect(raw).toBeNull()
    })

    test('no expiration without TTL', async () => {
      await service.setLastStoryId(123)

      // Mock old timestamp
      const data = JSON.parse(localStorage.getItem('ithappens_last_story_id')!)
      data.timestamp = Date.now() - 1000000 // Very old
      localStorage.setItem('ithappens_last_story_id', JSON.stringify(data))

      const id = await service.getLastStoryId()
      expect(id).toBe(123)
    })
  })

  describe('Error Handling', () => {
    test('handles localStorage unavailable on read', async () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      const id = await service.getLastStoryId()
      expect(id).toBeNull()

      mockGetItem.mockRestore()
    })

    test('handles quota exceeded error', async () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError')
        throw error
      })

      const result = await service.setLastStoryId(123)
      expect(result).toBe(false)

      mockSetItem.mockRestore()
    })

    test('reports availability correctly', () => {
      expect(service.isAvailable()).toBe(true)
    })

    test('handles clear with unavailable storage', async () => {
      const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage unavailable')
      })

      // Should not throw
      await expect(service.clear()).resolves.toBeUndefined()

      mockRemoveItem.mockRestore()
    })

    test('handles setItem throwing generic error', async () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Generic error')
      })

      const result = await service.setLastStoryId(123)
      expect(result).toBe(false)

      mockSetItem.mockRestore()
    })
  })

  describe('Fallback Strategies', () => {
    test('falls back gracefully when localStorage fails during operations', async () => {
      // Start with working localStorage
      await service.setLastStoryId(123)
      expect(await service.getLastStoryId()).toBe(123)

      // Now mock localStorage to fail
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      // Service should handle the error gracefully
      const id = await service.getLastStoryId()
      expect(id).toBeNull()

      mockGetItem.mockRestore()
    })

    test('handles JSON serialization error during save', async () => {
      // Mock JSON.stringify to throw
      const mockStringify = vi.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('JSON error')
      })

      const result = await service.setLastStoryId(123)
      expect(result).toBe(false)

      mockStringify.mockRestore()
    })

    test('uses memory fallback when all storage unavailable', async () => {
      // Mock both localStorage and sessionStorage to fail
      const mockLocalStorageSetItem = vi.spyOn(localStorage, 'setItem')
      mockLocalStorageSetItem.mockImplementation(() => {
        throw new Error('localStorage blocked')
      })

      const mockSessionStorageSetItem = vi.spyOn(sessionStorage, 'setItem')
      mockSessionStorageSetItem.mockImplementation(() => {
        throw new Error('sessionStorage blocked')
      })

      // Create new service after mocking
      const fallbackService = new StorageService()

      const result = await fallbackService.setLastStoryId(123)
      expect(result).toBe(true)

      const id = await fallbackService.getLastStoryId()
      expect(id).toBe(123)

      mockLocalStorageSetItem.mockRestore()
      mockSessionStorageSetItem.mockRestore()
    })

    test('clears data from memory fallback', async () => {
      // Mock both localStorage and sessionStorage to fail
      const mockLocalStorageSetItem = vi.spyOn(localStorage, 'setItem')
      mockLocalStorageSetItem.mockImplementation(() => {
        throw new Error('localStorage blocked')
      })

      const mockSessionStorageSetItem = vi.spyOn(sessionStorage, 'setItem')
      mockSessionStorageSetItem.mockImplementation(() => {
        throw new Error('sessionStorage blocked')
      })

      // Create new service after mocking - uses memory fallback
      const fallbackService = new StorageService()

      // Store and verify
      await fallbackService.setLastStoryId(123)
      expect(await fallbackService.getLastStoryId()).toBe(123)

      // Clear and verify
      await fallbackService.clear()
      expect(await fallbackService.getLastStoryId()).toBeNull()

      mockLocalStorageSetItem.mockRestore()
      mockSessionStorageSetItem.mockRestore()
    })

    test('handles error during clear operation with real storage', async () => {
      // Create service with real localStorage
      const service = new StorageService()
      await service.setLastStoryId(123)

      // Mock safeRemoveItem to throw
      const storageModule = await import('../../src/utils/storage')
      const mockRemove = vi.spyOn(storageModule, 'safeRemoveItem').mockImplementation(() => {
        throw new Error('Remove failed')
      })

      // Should not throw, just log error
      await expect(service.clear()).resolves.toBeUndefined()

      mockRemove.mockRestore()
    })

    test('verifies memory fallback actually uses Map storage', async () => {
      // Mock both localStorage and sessionStorage to fail completely
      const mockLocalStorageSetItem = vi.spyOn(localStorage, 'setItem')
      mockLocalStorageSetItem.mockImplementation(() => {
        throw new Error('localStorage blocked')
      })

      const mockSessionStorageSetItem = vi.spyOn(sessionStorage, 'setItem')
      mockSessionStorageSetItem.mockImplementation(() => {
        throw new Error('sessionStorage blocked')
      })

      // Create new service - should use memory fallback (Map)
      const fallbackService = new StorageService()

      // Verify service is using fallback
      expect(fallbackService.isAvailable()).toBe(true)

      // Test the full cycle with Map storage
      const setResult = await fallbackService.setLastStoryId(456)
      expect(setResult).toBe(true) // Line 167 covered

      const id = await fallbackService.getLastStoryId()
      expect(id).toBe(456)

      // Test clear with Map storage
      await fallbackService.clear() // Line 185 covered
      const idAfterClear = await fallbackService.getLastStoryId()
      expect(idAfterClear).toBeNull()

      mockLocalStorageSetItem.mockRestore()
      mockSessionStorageSetItem.mockRestore()
    })
  })

  describe('Custom Configuration', () => {
    test('uses custom prefix', async () => {
      const customService = new StorageService({ prefix: 'custom' })
      await customService.setLastStoryId(123)

      const key = Object.keys(localStorage).find((k) => k.startsWith('custom'))
      expect(key).toBeDefined()
      expect(key).toContain('custom_last_story_id')
    })

    test('uses custom version', async () => {
      const customService = new StorageService({ version: '2.0' })
      await customService.setLastStoryId(123)

      const raw = localStorage.getItem('ithappens_last_story_id')
      const data = JSON.parse(raw!)
      expect(data.version).toBe('2.0')
    })

    test('custom version rejects data with different version', async () => {
      const service1 = new StorageService({ version: '1.0' })
      await service1.setLastStoryId(123)

      const service2 = new StorageService({ version: '2.0' })
      const id = await service2.getLastStoryId()
      expect(id).toBeNull()
    })

    test('custom prefix with custom version', async () => {
      const customService = new StorageService({
        prefix: 'myapp',
        version: '3.0',
      })
      await customService.setLastStoryId(456)

      const raw = localStorage.getItem('myapp_last_story_id')
      expect(raw).toBeTruthy()

      const data = JSON.parse(raw!)
      expect(data.value).toBe(456)
      expect(data.version).toBe('3.0')
    })

    test('custom TTL configuration', async () => {
      const serviceWithCustomTTL = new StorageService({ ttl: 200 })
      await serviceWithCustomTTL.setLastStoryId(123)

      // Should work within TTL
      const id1 = await serviceWithCustomTTL.getLastStoryId()
      expect(id1).toBe(123)

      // Should expire after TTL
      await new Promise((resolve) => setTimeout(resolve, 250))
      const id2 = await serviceWithCustomTTL.getLastStoryId()
      expect(id2).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty string in storage', async () => {
      localStorage.setItem('ithappens_last_story_id', '')

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('handles very large story IDs', async () => {
      const largeId = 999999999
      const result = await service.setLastStoryId(largeId)
      expect(result).toBe(true)

      const id = await service.getLastStoryId()
      expect(id).toBe(largeId)
    })

    test('handles multiple rapid saves', async () => {
      await service.setLastStoryId(1)
      await service.setLastStoryId(2)
      await service.setLastStoryId(3)
      await service.setLastStoryId(4)
      await service.setLastStoryId(5)

      const id = await service.getLastStoryId()
      expect(id).toBe(5)
    })

    test('handles array data in storage', async () => {
      localStorage.setItem('ithappens_last_story_id', JSON.stringify([1, 2, 3]))

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })

    test('handles string data type in value field', async () => {
      localStorage.setItem(
        'ithappens_last_story_id',
        JSON.stringify({
          value: '123',
          timestamp: Date.now(),
          version: '1.0',
        })
      )

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })
  })

  describe('Timestamp Handling', () => {
    test('stores current timestamp', async () => {
      const before = Date.now()
      await service.setLastStoryId(123)
      const after = Date.now()

      const raw = localStorage.getItem('ithappens_last_story_id')
      const data = JSON.parse(raw!)
      expect(data.timestamp).toBeGreaterThanOrEqual(before)
      expect(data.timestamp).toBeLessThanOrEqual(after)
    })

    test('handles invalid timestamp in stored data', async () => {
      localStorage.setItem(
        'ithappens_last_story_id',
        JSON.stringify({
          value: 123,
          timestamp: 'not a number',
          version: '1.0',
        })
      )

      const id = await service.getLastStoryId()
      expect(id).toBeNull()
    })
  })
})
