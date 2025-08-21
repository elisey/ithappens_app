// ABOUTME: Service class for managing story data loading and navigation
// ABOUTME: Provides methods to fetch stories and navigate between them with gap handling

import { NetworkError, ParseError, TimeoutError, createAppError } from '../types/errors'
import type { StoriesData, StoryId } from '../types/story'
import { measureExecutionTime, logMemoryUsage, formatBytes } from '../utils/performance'

export class StoryService {
  private stories: StoriesData = {}
  private sortedIds: StoryId[] = []
  private loaded = false
  private readonly DEFAULT_TIMEOUT = 10000 // 10 seconds
  private loadingMetrics: {
    loadTime: number
    dataSize: number
    storyCount: number
  } | null = null

  async initialize(url: string, timeoutMs: number = this.DEFAULT_TIMEOUT): Promise<void> {
    const startTime = performance.now()
    logMemoryUsage('StoryService initialization start')

    try {
      this.loaded = false
      this.loadingMetrics = null

      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      let response: Response
      try {
        response = await measureExecutionTime(
          () =>
            fetch(url, {
              signal: controller.signal,
              headers: {
                Accept: 'application/json',
                'Cache-Control': 'no-cache',
              },
            }),
          `Fetch stories from ${url}`
        )
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new TimeoutError(`Request timed out after ${timeoutMs}ms`, timeoutMs)
          }
          if (fetchError.message.includes('fetch')) {
            throw new NetworkError(`Network request failed: ${fetchError.message}`)
          }
        }
        throw createAppError(fetchError)
      }

      if (!response.ok) {
        throw new NetworkError(
          `Failed to load stories: ${response.status} ${response.statusText}`,
          response.status
        )
      }

      // Calculate data size from Content-Length header or response
      const contentLength = response.headers?.get?.('content-length')
      const dataSize = contentLength ? parseInt(contentLength, 10) : 0

      let storiesData: StoriesData
      try {
        storiesData = await measureExecutionTime(
          () => response.json() as Promise<StoriesData>,
          'Parse JSON response'
        )
      } catch (parseError) {
        throw new ParseError(
          `Failed to parse stories JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
        )
      }

      // Validate the data structure
      if (!storiesData || typeof storiesData !== 'object') {
        throw new ParseError('Invalid stories data format: expected object')
      }

      // Validate that we have at least one story
      const keys = Object.keys(storiesData)
      if (keys.length === 0) {
        throw new ParseError('No stories found in data')
      }

      // Validate story IDs are numeric
      const invalidIds = keys.filter((id) => isNaN(parseInt(id, 10)))
      if (invalidIds.length > 0) {
        throw new ParseError(`Invalid story IDs found: ${invalidIds.join(', ')}`)
      }

      // Optimize indexing for large datasets
      await measureExecutionTime(() => {
        this.stories = storiesData
        // Use more efficient sorting for large arrays
        this.sortedIds = keys.map((id) => parseInt(id, 10)).sort((a, b) => a - b)
      }, 'Index and sort story IDs')

      this.loaded = true

      // Record loading metrics
      const endTime = performance.now()
      this.loadingMetrics = {
        loadTime: endTime - startTime,
        dataSize: dataSize || this.estimateDataSize(),
        storyCount: keys.length,
      }

      logMemoryUsage('StoryService initialization complete')
      this.logLoadingMetrics()
    } catch (error) {
      this.loaded = false
      this.stories = {}
      this.sortedIds = []
      this.loadingMetrics = null
      logMemoryUsage('StoryService initialization failed')
      throw error instanceof Error
        ? createAppError(error)
        : createAppError(new Error(String(error)))
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
