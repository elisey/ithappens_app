// ABOUTME: Service for managing localStorage persistence of application state
// ABOUTME: Provides type-safe storage with validation, versioning, TTL support, and fallback strategies

import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from '../utils/storage'

/**
 * Structure of data stored in localStorage
 */
interface StorageData {
  value: number // The story ID
  timestamp: number // When it was saved (Unix timestamp in ms)
  version: string // Schema version
}

/**
 * Configuration options for StorageService
 */
export interface StorageOptions {
  prefix?: string // Key prefix (default: "ithappens")
  version?: string // Schema version (default: "1.0")
  ttl?: number // Time to live in ms (optional)
}

/**
 * Service for managing localStorage persistence with error handling and fallback strategies
 */
export class StorageService {
  private readonly prefix: string
  private readonly version: string
  private readonly ttl: number | null
  private readonly storageKey: string
  private storage: Storage | null = null
  private memoryFallback: Map<string, string> = new Map()

  constructor(options?: StorageOptions) {
    this.prefix = options?.prefix ?? 'ithappens'
    this.version = options?.version ?? '1.0'
    this.ttl = options?.ttl ?? null
    this.storageKey = `${this.prefix}_last_story_id`

    // Initialize storage with fallback chain
    this.storage = this.initializeStorage()
  }

  /**
   * Initialize storage with fallback chain: localStorage → sessionStorage → memory
   */
  private initializeStorage(): Storage | null {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      return localStorage
    }

    // Try sessionStorage as fallback
    try {
      const test = '__sessionStorage_test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return sessionStorage
    } catch {
      // Will use memory fallback
      return null
    }
  }

  /**
   * Get the appropriate storage (with memory fallback)
   */
  private getStorage(): Storage | Map<string, string> {
    return this.storage ?? this.memoryFallback
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.storage !== null || this.memoryFallback !== null
  }

  /**
   * Retrieve the last read story ID from storage
   * @returns The story ID or null if not found/invalid/expired
   */
  async getLastStoryId(): Promise<number | null> {
    try {
      const storage = this.getStorage()
      let rawData: string | null = null

      if (storage instanceof Map) {
        rawData = storage.get(this.storageKey) ?? null
      } else {
        rawData = safeGetItem(this.storageKey)
      }

      if (!rawData) {
        return null
      }

      // Parse and validate JSON
      let data: unknown
      try {
        data = JSON.parse(rawData)
      } catch (error) {
        console.error('Failed to parse stored data:', error)
        await this.clear()
        return null
      }

      // Validate data structure
      if (!this.validateData(data)) {
        console.error('Invalid data structure in storage')
        await this.clear()
        return null
      }

      // Check version compatibility
      if (data.version !== this.version) {
        console.warn(`Incompatible storage version: ${data.version} (expected ${this.version})`)
        await this.clear()
        return null
      }

      // Check if expired
      if (this.isExpired(data.timestamp)) {
        await this.clear()
        return null
      }

      return data.value
    } catch (error) {
      console.error('Error retrieving last story ID:', error)
      return null
    }
  }

  /**
   * Save the last read story ID to storage
   * @param id - The story ID to save (must be positive)
   * @returns true if successful, false otherwise
   */
  async setLastStoryId(id: number): Promise<boolean> {
    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      console.error('Invalid story ID: must be a positive integer')
      return false
    }

    try {
      const data: StorageData = {
        value: id,
        timestamp: Date.now(),
        version: this.version,
      }

      const serialized = JSON.stringify(data)
      const storage = this.getStorage()

      if (storage instanceof Map) {
        storage.set(this.storageKey, serialized)
        return true
      } else {
        return safeSetItem(this.storageKey, serialized)
      }
    } catch (error) {
      console.error('Error saving last story ID:', error)
      return false
    }
  }

  /**
   * Clear the stored last story ID
   */
  async clear(): Promise<void> {
    try {
      const storage = this.getStorage()

      if (storage instanceof Map) {
        storage.delete(this.storageKey)
      } else {
        safeRemoveItem(this.storageKey)
      }
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  /**
   * Validate that data matches the expected StorageData structure
   */
  private validateData(data: unknown): data is StorageData {
    if (typeof data !== 'object' || data === null) {
      return false
    }

    const obj = data as Record<string, unknown>

    return (
      typeof obj.value === 'number' &&
      typeof obj.timestamp === 'number' &&
      typeof obj.version === 'string' &&
      Number.isInteger(obj.value) &&
      obj.value > 0
    )
  }

  /**
   * Check if stored data has expired based on TTL
   */
  private isExpired(timestamp: number): boolean {
    if (this.ttl === null) {
      return false
    }

    const age = Date.now() - timestamp
    return age > this.ttl
  }
}

/**
 * Default storage service instance
 */
export const storageService = new StorageService()
