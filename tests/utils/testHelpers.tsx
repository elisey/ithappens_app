// ABOUTME: Standardized test utilities and helpers for consistent testing patterns
// ABOUTME: Стандартизированные утилиты тестирования для консистентных паттернов

import { render, waitFor, screen } from '@testing-library/preact'
import { vi } from 'vitest'
import { App } from '../../src/app'
import { StoryService } from '../../src/services/storyService'
import type { StoriesData } from '../../src/types/story'

// Mock data factory for consistent test data
export const createMockStoriesData = (overrides?: Record<string, string>): StoriesData => ({
  '1': 'First test story with sample content',
  '2': 'Second story with multiple lines for testing',
  '3': 'Third story for navigation testing',
  '5': 'Fifth story to test gap handling in navigation',
  ...overrides,
})

// Mock StoryService factory
export const createMockStoryService = (data: StoriesData = createMockStoriesData()) => {
  class MockStoryService extends StoryService {
    private mockStories: StoriesData = data
    private mockSortedIds: number[] = []
    private mockLoaded = false

    async initialize(): Promise<void> {
      // Simulate brief loading delay
      await new Promise((resolve) => setTimeout(resolve, 1))
      this.mockSortedIds = Object.keys(this.mockStories)
        .map((id) => parseInt(id, 10))
        .sort((a, b) => a - b)
      this.mockLoaded = true
    }

    getById(id: number): string | null {
      if (!this.mockLoaded) return null
      return this.mockStories[id.toString()] || null
    }

    getFirstId(): number | null {
      if (!this.mockLoaded || this.mockSortedIds.length === 0) return null
      return this.mockSortedIds[0]
    }

    getLastId(): number | null {
      if (!this.mockLoaded || this.mockSortedIds.length === 0) return null
      return this.mockSortedIds[this.mockSortedIds.length - 1]
    }

    getAllIds(): number[] {
      if (!this.mockLoaded) return []
      return [...this.mockSortedIds]
    }

    getNextId(currentId: number): number | null {
      if (!this.mockLoaded) return null
      const currentIndex = this.mockSortedIds.indexOf(currentId)
      if (currentIndex === -1) return null
      // Circular navigation
      return currentIndex === this.mockSortedIds.length - 1
        ? this.mockSortedIds[0]
        : this.mockSortedIds[currentIndex + 1]
    }

    getPrevId(currentId: number): number | null {
      if (!this.mockLoaded) return null
      const currentIndex = this.mockSortedIds.indexOf(currentId)
      if (currentIndex === -1) return null
      // Circular navigation
      return currentIndex === 0
        ? this.mockSortedIds[this.mockSortedIds.length - 1]
        : this.mockSortedIds[currentIndex - 1]
    }

    isLoaded(): boolean {
      return this.mockLoaded
    }
  }

  return new MockStoryService()
}

// Mock fetch setup for consistent API testing
export const setupMockFetch = (data: StoriesData = createMockStoriesData()) => {
  const mockFetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  )

  global.fetch = mockFetch
  return mockFetch
}

// Setup mock fetch with error scenarios
export const setupMockFetchError = (error: Error | { status: number; statusText: string }) => {
  if (error instanceof Error) {
    global.fetch = vi.fn(() => Promise.reject(error))
  } else {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: error.status,
        statusText: error.statusText,
      } as Response)
    )
  }
}

// App component renderer with mocks
export const renderAppWithMocks = (props: { storyService?: StoryService } = {}) => {
  const mockService = props.storyService || createMockStoryService()
  return render(<App storyService={mockService} />)
}

// Common wait utilities
export const waitForStoryLoad = async (expectedText?: string) => {
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
  })

  // Optionally wait for specific content
  if (expectedText) {
    await waitFor(() => {
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })
  }
}

export const waitForError = async () => {
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
}

// Navigation testing utilities
export const getNavigationButtons = () => ({
  previous: screen.getByLabelText('Previous story'),
  next: screen.getByLabelText('Next story'),
  jumpToId: screen.getByLabelText(/Current story ID:/),
})

// Mock cleanup utility
export const cleanupMocks = () => {
  vi.clearAllMocks()
  // Reset fetch mock if it exists
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockClear()
  }
}

// Test isolation helper
export const withIsolatedTest = (testFn: () => void | Promise<void>) => {
  return async () => {
    cleanupMocks()
    try {
      await testFn()
    } finally {
      cleanupMocks()
    }
  }
}
