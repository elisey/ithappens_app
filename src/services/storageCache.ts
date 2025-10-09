// ABOUTME: SessionStorage cache for fast app restarts with chunked storage
// ABOUTME: Handles large data by splitting into chunks to avoid storage limits

import { logError } from '../utils/errorHandling'

export interface CacheMetadata {
  timestamp: number
  version: string
  chunkCount: number
  totalSize: number
  hash?: string
}

export interface CacheOptions {
  maxAge?: number // milliseconds
  chunkSize?: number // bytes
  version?: string
}

export class StorageCache {
  private readonly CHUNK_SIZE = 1024 * 1024 // 1MB chunks
  private readonly MAX_AGE = 1000 * 60 * 60 * 24 // 24 hours
  private readonly VERSION = '1.0'

  /**
   * Save data to sessionStorage in chunks
   */
  async saveChunked(key: string, data: string, options?: CacheOptions): Promise<boolean> {
    const { chunkSize = this.CHUNK_SIZE, version = this.VERSION } = options || {}

    try {
      // Calculate number of chunks needed
      const chunkCount = Math.ceil(data.length / chunkSize)

      if (chunkCount > 100) {
        // Prevent excessive chunks
        console.warn(`Data too large for caching: ${chunkCount} chunks required`)
        return false
      }

      // Save metadata first
      const metadata: CacheMetadata = {
        timestamp: Date.now(),
        version,
        chunkCount,
        totalSize: data.length,
        hash: await this.calculateHash(data),
      }

      sessionStorage.setItem(`${key}_meta`, JSON.stringify(metadata))

      // Save data in chunks
      for (let i = 0; i < chunkCount; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, data.length)
        const chunk = data.substring(start, end)

        sessionStorage.setItem(`${key}_chunk_${i}`, chunk)
      }

      return true
    } catch (error) {
      logError(error as Error, { operation: 'saveChunked', key })
      // Clean up partial data
      this.clear(key)
      return false
    }
  }

  /**
   * Load data from sessionStorage chunks
   */
  async loadChunked(key: string): Promise<string | null> {
    try {
      // Load metadata
      const metaStr = sessionStorage.getItem(`${key}_meta`)
      if (!metaStr) {
        return null
      }

      const metadata: CacheMetadata = JSON.parse(metaStr)

      // Load all chunks
      const chunks: string[] = []
      for (let i = 0; i < metadata.chunkCount; i++) {
        const chunk = sessionStorage.getItem(`${key}_chunk_${i}`)
        if (chunk === null) {
          console.warn(`Missing chunk ${i} of ${metadata.chunkCount}`)
          this.clear(key) // Clean up incomplete data
          return null
        }
        chunks.push(chunk)
      }

      // Combine chunks
      const data = chunks.join('')

      // Verify integrity
      if (data.length !== metadata.totalSize) {
        console.warn(`Data size mismatch: expected ${metadata.totalSize}, got ${data.length}`)
        this.clear(key)
        return null
      }

      // Verify hash if available
      if (metadata.hash) {
        const currentHash = await this.calculateHash(data)
        if (currentHash !== metadata.hash) {
          console.warn('Data integrity check failed: hash mismatch')
          this.clear(key)
          return null
        }
      }

      return data
    } catch (error) {
      logError(error as Error, { operation: 'loadChunked', key })
      this.clear(key)
      return null
    }
  }

  /**
   * Check if cached data is valid
   */
  isValid(key: string, options?: CacheOptions): boolean {
    const { maxAge = this.MAX_AGE, version = this.VERSION } = options || {}

    try {
      const metaStr = sessionStorage.getItem(`${key}_meta`)
      if (!metaStr) {
        return false
      }

      const metadata: CacheMetadata = JSON.parse(metaStr)

      // Check version
      if (metadata.version !== version) {
        return false
      }

      // Check age
      const age = Date.now() - metadata.timestamp
      if (age >= maxAge) {
        return false
      }

      // Check if all chunks exist
      for (let i = 0; i < metadata.chunkCount; i++) {
        if (!sessionStorage.getItem(`${key}_chunk_${i}`)) {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Clear cached data for a key
   */
  clear(key: string): void {
    try {
      // Get metadata to know how many chunks to clear
      const metaStr = sessionStorage.getItem(`${key}_meta`)
      if (metaStr) {
        const metadata: CacheMetadata = JSON.parse(metaStr)

        // Remove all chunks
        for (let i = 0; i < metadata.chunkCount; i++) {
          sessionStorage.removeItem(`${key}_chunk_${i}`)
        }
      }

      // Remove metadata
      sessionStorage.removeItem(`${key}_meta`)
    } catch (error) {
      logError(error as Error, { operation: 'clear', key })
    }
  }

  /**
   * Get cache metadata
   */
  getMetadata(key: string): CacheMetadata | null {
    try {
      const metaStr = sessionStorage.getItem(`${key}_meta`)
      return metaStr ? (JSON.parse(metaStr) as CacheMetadata) : null
    } catch {
      return null
    }
  }

  /**
   * Calculate simple hash for data integrity check
   */
  private async calculateHash(data: string): Promise<string> {
    // Simple hash using length and sample characters
    // For production, consider using crypto.subtle.digest for real hashing
    const len = data.length
    const sample =
      data.charAt(0) +
      data.charAt(Math.floor(len / 4)) +
      data.charAt(Math.floor(len / 2)) +
      data.charAt(Math.floor((len * 3) / 4)) +
      data.charAt(len - 1)

    return `${len}-${sample}`
  }

  /**
   * Get available storage space (approximate)
   */
  getAvailableSpace(): number {
    try {
      // Try to estimate by checking how much we can store
      const testKey = '_storage_test_'
      let size = 0
      const increment = 1024 * 100 // 100KB increments

      while (size < 10 * 1024 * 1024) {
        // Max 10MB test
        try {
          const testData = 'x'.repeat(increment)
          sessionStorage.setItem(testKey, testData)
          size += increment
        } catch {
          break
        }
      }

      sessionStorage.removeItem(testKey)
      return size
    } catch {
      return 0
    }
  }

  /**
   * Get current storage usage for a key
   */
  getStorageSize(key: string): number {
    const metadata = this.getMetadata(key)
    return metadata?.totalSize || 0
  }

  /**
   * Clear all cached stories data
   */
  clearAll(): void {
    try {
      // Find all keys that match our pattern
      const keysToRemove: string[] = []

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.endsWith('_meta') || key.includes('_chunk_'))) {
          keysToRemove.push(key)
        }
      }

      // Remove all found keys
      keysToRemove.forEach((key) => sessionStorage.removeItem(key))
    } catch (error) {
      logError(error as Error, { operation: 'clearAll' })
    }
  }
}
