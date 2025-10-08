// ABOUTME: Tests for StorageCache service - chunked storage and cache management
// ABOUTME: Tests sessionStorage operations with large data

/* eslint-disable no-undef */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StorageCache } from '../../src/services/storageCache'

describe('StorageCache', () => {
  let cache: StorageCache
  const testKey = 'test_stories'

  beforeEach(() => {
    cache = new StorageCache()
    sessionStorage.clear()
  })

  afterEach(() => {
    cache.clearAll()
  })

  describe('saveChunked and loadChunked', () => {
    it('should save and load small data', async () => {
      const data = '{"1":"story one","2":"story two"}'

      const saved = await cache.saveChunked(testKey, data)
      expect(saved).toBe(true)

      const loaded = await cache.loadChunked(testKey)
      expect(loaded).toBe(data)
    })

    it('should save and load large data in chunks', async () => {
      // Generate ~2MB of data (will be split into chunks)
      const largeData = 'x'.repeat(2 * 1024 * 1024)

      const saved = await cache.saveChunked(testKey, largeData)
      expect(saved).toBe(true)

      const loaded = await cache.loadChunked(testKey)
      expect(loaded).toBe(largeData)
    })

    it('should handle empty data', async () => {
      const data = ''

      const saved = await cache.saveChunked(testKey, data)
      expect(saved).toBe(true)

      const loaded = await cache.loadChunked(testKey)
      expect(loaded).toBe(data)
    })

    it('should return null for non-existent key', async () => {
      const loaded = await cache.loadChunked('nonexistent')
      expect(loaded).toBeNull()
    })
  })

  describe('isValid', () => {
    it('should return true for valid cached data', async () => {
      const data = '{"1":"test"}'
      await cache.saveChunked(testKey, data)

      const isValid = cache.isValid(testKey)
      expect(isValid).toBe(true)
    })

    it('should return false for non-existent key', () => {
      const isValid = cache.isValid('nonexistent')
      expect(isValid).toBe(false)
    })

    it('should respect maxAge option', async () => {
      const data = '{"1":"test"}'
      await cache.saveChunked(testKey, data)

      // Set maxAge to 0ms (expired immediately)
      const isValid = cache.isValid(testKey, { maxAge: 0 })
      expect(isValid).toBe(false)
    })

    it('should check version matching', async () => {
      const data = '{"1":"test"}'
      await cache.saveChunked(testKey, data, { version: '1.0' })

      // Check with same version
      expect(cache.isValid(testKey, { version: '1.0' })).toBe(true)

      // Check with different version
      expect(cache.isValid(testKey, { version: '2.0' })).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear cached data', async () => {
      const data = '{"1":"test"}'
      await cache.saveChunked(testKey, data)

      expect(cache.isValid(testKey)).toBe(true)

      cache.clear(testKey)

      expect(cache.isValid(testKey)).toBe(false)
      const loaded = await cache.loadChunked(testKey)
      expect(loaded).toBeNull()
    })

    it('should handle clearing non-existent key', () => {
      expect(() => cache.clear('nonexistent')).not.toThrow()
    })
  })

  describe('getMetadata', () => {
    it('should return metadata for cached data', async () => {
      const data = '{"1":"test"}'
      await cache.saveChunked(testKey, data, { version: '1.5' })

      const metadata = cache.getMetadata(testKey)

      expect(metadata).toBeTruthy()
      expect(metadata?.version).toBe('1.5')
      expect(metadata?.totalSize).toBe(data.length)
      expect(metadata?.chunkCount).toBeGreaterThan(0)
    })

    it('should return null for non-existent key', () => {
      const metadata = cache.getMetadata('nonexistent')
      expect(metadata).toBeNull()
    })
  })

  describe('getStorageSize', () => {
    it('should return size of cached data', async () => {
      const data = '{"1":"test story"}'
      await cache.saveChunked(testKey, data)

      const size = cache.getStorageSize(testKey)
      expect(size).toBe(data.length)
    })

    it('should return 0 for non-existent key', () => {
      const size = cache.getStorageSize('nonexistent')
      expect(size).toBe(0)
    })
  })

  describe('clearAll', () => {
    it('should clear all cached stories', async () => {
      await cache.saveChunked('stories_1', '{"1":"test"}')
      await cache.saveChunked('stories_2', '{"2":"test"}')

      cache.clearAll()

      expect(cache.isValid('stories_1')).toBe(false)
      expect(cache.isValid('stories_2')).toBe(false)
    })
  })

  describe('Data integrity', () => {
    it('should detect corrupted data', async () => {
      const data = '{"1":"test"}'
      await cache.saveChunked(testKey, data)

      // Corrupt a chunk
      sessionStorage.setItem(`${testKey}_chunk_0`, 'corrupted')

      const loaded = await cache.loadChunked(testKey)
      expect(loaded).toBeNull() // Should clear corrupted data
    })

    it('should handle missing chunks', async () => {
      const data = 'x'.repeat(2 * 1024 * 1024) // Large enough for multiple chunks
      await cache.saveChunked(testKey, data)

      // Remove one chunk
      sessionStorage.removeItem(`${testKey}_chunk_1`)

      const loaded = await cache.loadChunked(testKey)
      expect(loaded).toBeNull()
    })
  })
})
