// ABOUTME: Service class for managing story data loading and navigation
// ABOUTME: Provides methods to fetch stories and navigate between them with gap handling

import type { StoriesData, StoryId } from '../types/story'

export class StoryService {
  private stories: StoriesData = {}
  private sortedIds: StoryId[] = []
  private loaded = false

  async initialize(url: string): Promise<void> {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to load stories: ${response.status} ${response.statusText}`)
      }

      this.stories = await response.json()
      this.sortedIds = Object.keys(this.stories)
        .map((id) => parseInt(id, 10))
        .sort((a, b) => a - b)
      this.loaded = true
    } catch (error) {
      this.loaded = false
      throw error
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
