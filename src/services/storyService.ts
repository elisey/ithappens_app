// ABOUTME: Service class for managing story data loading and navigation
// ABOUTME: Provides methods to fetch stories and navigate between them with gap handling

import { NetworkError, ParseError, TimeoutError, createAppError } from '../types/errors'
import type { StoriesData, StoryId } from '../types/story'

export class StoryService {
  private stories: StoriesData = {}
  private sortedIds: StoryId[] = []
  private loaded = false
  private readonly DEFAULT_TIMEOUT = 10000 // 10 seconds

  async initialize(url: string, timeoutMs: number = this.DEFAULT_TIMEOUT): Promise<void> {
    try {
      this.loaded = false

      // Create AbortController for timeout handling
      // eslint-disable-next-line no-undef
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      // eslint-disable-next-line no-undef
      let response: Response
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        })
        // eslint-disable-next-line no-undef
        clearTimeout(timeoutId)
      } catch (fetchError) {
        // eslint-disable-next-line no-undef
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

      let storiesData: StoriesData
      try {
        storiesData = await response.json()
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

      this.stories = storiesData
      this.sortedIds = keys.map((id) => parseInt(id, 10)).sort((a, b) => a - b)
      this.loaded = true
    } catch (error) {
      this.loaded = false
      this.stories = {}
      this.sortedIds = []
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
}
