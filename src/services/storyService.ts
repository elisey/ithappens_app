// ABOUTME: Service class for managing story data loading and navigation
// ABOUTME: Provides methods to fetch stories and navigate between them with gap handling

import { createAppError } from '../types/errors'
import type { StoriesData, StoryId } from '../types/story'
import { measureExecutionTime, logMemoryUsage, formatBytes } from '../utils/performance'
import { DataLoader } from './dataLoader'
import { performanceMonitor } from './performanceMonitor'
import { StorageCache } from './storageCache'

export type LoadingStatus = 'initializing' | 'loading' | 'parsing' | 'indexing'

export interface LoadingCallbacks {
  onStatusChange?: (status: LoadingStatus) => void
  onProgress?: (progress: number) => void
}

export class StoryService {
  private stories: StoriesData = {}
  private sortedIds: StoryId[] = []
  private loaded = false
  private readonly DEFAULT_TIMEOUT = 30000 // 30 seconds for large files
  private readonly CACHE_KEY_PREFIX = 'stories_data'
  private readonly CACHE_MAX_AGE = 1000 * 60 * 60 * 24 // 24 hours
  private currentCacheKey: string = this.CACHE_KEY_PREFIX

  private loader: DataLoader
  private cache: StorageCache

  private loadingMetrics: {
    loadTime: number
    dataSize: number
    storyCount: number
    fromCache: boolean
  } | null = null

  constructor() {
    this.loader = new DataLoader()
    this.cache = new StorageCache()
  }

  /**
   * Generate cache key from URL to ensure different URLs don't share cache
   */
  private getCacheKey(url: string): string {
    // Create a simple hash of the URL for the cache key
    const urlHash = url.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0
    }, 0)
    return `${this.CACHE_KEY_PREFIX}_${Math.abs(urlHash)}`
  }

  async initialize(url: string, timeoutMs: number = this.DEFAULT_TIMEOUT): Promise<void> {
    await this.initializeWithCallbacks(url, undefined, timeoutMs)
  }

  async initializeWithCallbacks(
    url: string,
    callbacks?: LoadingCallbacks,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Promise<void> {
    const startTime = performance.now()
    logMemoryUsage('StoryService initialization start')

    // Start performance monitoring
    performanceMonitor.startMeasure('load')

    try {
      callbacks?.onStatusChange?.('initializing')
      this.loaded = false
      this.loadingMetrics = null

      // Set cache key based on URL
      this.currentCacheKey = this.getCacheKey(url)

      // Try to load from cache first
      const cached = await this.loadFromCache(callbacks)
      if (cached) {
        await this.processData(cached, callbacks, startTime, true)
        return
      }

      // Load from network
      const data = await this.loadFromNetwork(url, timeoutMs, callbacks)

      // Save to cache for next time
      await this.saveToCache(JSON.stringify(data))

      // Process the data
      await this.processData(data, callbacks, startTime, false)
    } catch (error) {
      this.loaded = false
      this.stories = {}
      this.sortedIds = []
      this.loadingMetrics = null
      logMemoryUsage('StoryService initialization failed')
      throw createAppError(error)
    }
  }

  /**
   * Load data from cache
   */
  private async loadFromCache(callbacks?: LoadingCallbacks): Promise<StoriesData | null> {
    // Skip cache in test environment to prevent interference
    if (import.meta.env.MODE === 'test') {
      return null
    }

    try {
      // Check if cache is valid
      if (!this.cache.isValid(this.currentCacheKey, { maxAge: this.CACHE_MAX_AGE })) {
        return null
      }

      callbacks?.onStatusChange?.('loading')
      callbacks?.onProgress?.(10)

      const cachedText = await this.cache.loadChunked(this.currentCacheKey)
      if (!cachedText) {
        return null
      }

      callbacks?.onStatusChange?.('parsing')
      callbacks?.onProgress?.(50)

      performanceMonitor.startMeasure('parse')
      const data = await this.loader.parseJSON<StoriesData>(cachedText)
      performanceMonitor.endMeasure('parse')

      // Validate cached data
      if (this.loader.validateStoriesData(data)) {
        console.log('📦 [Cache] Loaded stories from cache')
        return data
      }

      // Invalid data, clear cache
      this.cache.clear(this.currentCacheKey)
      return null
    } catch {
      // Cache error, clear and continue with network load
      this.cache.clear(this.currentCacheKey)
      return null
    }
  }

  /**
   * Load data from network
   */
  private async loadFromNetwork(
    url: string,
    timeoutMs: number,
    callbacks?: LoadingCallbacks
  ): Promise<StoriesData> {
    callbacks?.onStatusChange?.('loading')

    const controller = new AbortController()

    const data = await this.loader.loadStories({
      url,
      timeout: timeoutMs,
      signal: controller.signal,
      retries: 3,
      onProgress: (loaded, total) => {
        if (total > 0) {
          // Map network progress to 0-70%
          const progress = Math.floor((loaded / total) * 70)
          callbacks?.onProgress?.(progress)
        }
      },
    })

    return data
  }

  /**
   * Save data to cache
   */
  private async saveToCache(data: string): Promise<void> {
    // Skip cache in test environment to prevent interference
    if (import.meta.env.MODE === 'test') {
      return
    }

    try {
      const saved = await this.cache.saveChunked(this.currentCacheKey, data)
      if (saved) {
        console.log('💾 [Cache] Saved stories to cache')
      }
    } catch (error) {
      // Cache save error is not critical, just log it
      console.warn('Failed to save to cache:', error)
    }
  }

  /**
   * Process and index story data
   */
  private async processData(
    storiesData: StoriesData,
    callbacks: LoadingCallbacks | undefined,
    startTime: number,
    fromCache: boolean
  ): Promise<void> {
    callbacks?.onStatusChange?.('indexing')
    callbacks?.onProgress?.(80)

    // Optimize indexing for large datasets
    performanceMonitor.startMeasure('indexing')
    await measureExecutionTime(() => {
      this.stories = storiesData
      const keys = Object.keys(storiesData)
      this.sortedIds = keys.map((id) => parseInt(id, 10)).sort((a, b) => a - b)
    }, 'Index and sort story IDs')
    performanceMonitor.endMeasure('indexing')

    callbacks?.onProgress?.(100)
    this.loaded = true

    // Record loading metrics
    const endTime = performance.now()
    performanceMonitor.endMeasure('load')

    this.loadingMetrics = {
      loadTime: endTime - startTime,
      dataSize: this.estimateDataSize(),
      storyCount: this.sortedIds.length,
      fromCache,
    }

    // Update performance monitor with metrics
    performanceMonitor.setMetric('storyCount', this.sortedIds.length)

    logMemoryUsage('StoryService initialization complete')
    this.logLoadingMetrics()

    // Log performance metrics in dev mode
    if (performanceMonitor.isEnabled()) {
      performanceMonitor.logMetrics()
    }
  }

  getById(id: StoryId): string | null {
    if (!this.loaded) {
      return null
    }
    return this.stories[id.toString()] || null
  }

  getNextId(currentId: StoryId): StoryId | null {
    if (!this.loaded || this.sortedIds.length === 0) {
      return null
    }

    const currentIndex = this.sortedIds.indexOf(currentId)
    if (currentIndex === -1) {
      return null
    }

    // If we're at the last index, return the first ID (circular)
    if (currentIndex === this.sortedIds.length - 1) {
      return this.sortedIds[0]
    }

    return this.sortedIds[currentIndex + 1]
  }

  getPrevId(currentId: StoryId): StoryId | null {
    if (!this.loaded || this.sortedIds.length === 0) {
      return null
    }

    const currentIndex = this.sortedIds.indexOf(currentId)
    if (currentIndex === -1) {
      return null
    }

    // If we're at the first index, return the last ID (circular)
    if (currentIndex === 0) {
      return this.sortedIds[this.sortedIds.length - 1]
    }

    return this.sortedIds[currentIndex - 1]
  }

  getFirstId(): StoryId | null {
    if (!this.loaded || this.sortedIds.length === 0) {
      return null
    }
    return this.sortedIds[0]
  }

  getLastId(): StoryId | null {
    if (!this.loaded || this.sortedIds.length === 0) {
      return null
    }
    return this.sortedIds[this.sortedIds.length - 1]
  }

  getAllIds(): StoryId[] {
    if (!this.loaded) {
      return []
    }
    return [...this.sortedIds]
  }

  isLoaded(): boolean {
    return this.loaded
  }

  /**
   * Get loading performance metrics
   */
  getLoadingMetrics() {
    return this.loadingMetrics
  }

  /**
   * Estimate data size in bytes (fallback when Content-Length is not available)
   */
  private estimateDataSize(): number {
    if (!this.loaded) return 0

    // Rough estimation: JSON stringification
    try {
      return JSON.stringify(this.stories).length
    } catch {
      // Fallback estimation based on story count and average size
      return this.sortedIds.length * 150 // Average ~150 bytes per story
    }
  }

  /**
   * Log loading metrics if performance logging is enabled
   */
  private logLoadingMetrics(): void {
    if (!this.loadingMetrics) return

    const { loadTime, dataSize, storyCount } = this.loadingMetrics
    console.log(
      `📊 [StoryService] Loaded ${storyCount} stories (${formatBytes(dataSize)}) in ${loadTime.toFixed(2)}ms`
    )

    // Log performance warnings for large datasets
    if (loadTime > 5000) {
      console.warn(`⚠️ [Performance] Slow loading detected: ${loadTime.toFixed(2)}ms`)
    }

    if (storyCount > 10000) {
      console.log(`📈 [Performance] Large dataset: ${storyCount.toLocaleString()} stories`)
    }
  }
}
