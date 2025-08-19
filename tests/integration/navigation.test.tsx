// ABOUTME: Integration tests for story navigation between UI components and services
// ABOUTME: Tests full app flow including data loading, navigation, and state management

import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { App } from '../../src/app'
import { StoryService } from '../../src/services/storyService'

// Mock fetch for story data
const mockStoriesData = {
  '1': 'First story text',
  '3': 'Third story with\nmultiple lines',
  '5': 'Fifth story text',
  '7': 'Seventh story text',
}

describe.skip('Story Navigation Integration', () => {
  let mockStoryService: StoryService

  beforeEach(async () => {
    vi.clearAllMocks()

    // Create a fresh story service for each test
    mockStoryService = new StoryService()

    // Mock fetch globally
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockStoriesData,
    })

    // Initialize the service
    await mockStoryService.initialize('/stories.json.sample')
  })

  it('should load and display first story on app start', async () => {
    render(<App storyService={mockStoryService} />)

    // Should show loading initially
    expect(screen.getByText('Загрузка истории...')).toBeInTheDocument()

    // Wait for story to load
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    // Should show current ID in navigation
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  it('should navigate forward through stories', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    // Click next button
    const nextButton = screen.getByText('Вперед →')
    fireEvent.click(nextButton)

    // Should show next story (ID 3)
    await waitFor(() => {
      expect(screen.getByText('Third story with')).toBeInTheDocument()
      expect(screen.getByText('multiple lines')).toBeInTheDocument()
      expect(screen.getByText('ID: 3')).toBeInTheDocument()
    })
  })

  it('should navigate backward through stories', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for initial load and navigate to story 3
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('ID: 3')).toBeInTheDocument()
    })

    // Click previous button
    const prevButton = screen.getByText('← Назад')
    fireEvent.click(prevButton)

    // Should show previous story (back to ID 1)
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })
  })

  it('should handle circular navigation (last to first)', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    // Navigate to last story (ID 7)
    const nextButton = screen.getByText('Вперед →')
    fireEvent.click(nextButton) // to 3
    await waitFor(() => expect(screen.getByText('ID: 3')).toBeInTheDocument())

    fireEvent.click(nextButton) // to 5
    await waitFor(() => expect(screen.getByText('ID: 5')).toBeInTheDocument())

    fireEvent.click(nextButton) // to 7
    await waitFor(() => expect(screen.getByText('ID: 7')).toBeInTheDocument())

    // Click next again - should go back to first story
    fireEvent.click(nextButton)
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })
  })

  it('should handle circular navigation (first to last)', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    // Click previous from first story - should go to last
    const prevButton = screen.getByText('← Назад')
    fireEvent.click(prevButton)

    await waitFor(() => {
      expect(screen.getByText('Seventh story text')).toBeInTheDocument()
      expect(screen.getByText('ID: 7')).toBeInTheDocument()
    })
  })

  it('should preserve line breaks in story text', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for initial load and navigate to story with line breaks
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('ID: 3')).toBeInTheDocument()
    })

    // Story should be split into separate paragraphs
    expect(screen.getByText('Third story with')).toBeInTheDocument()
    expect(screen.getByText('multiple lines')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First story text')).toBeInTheDocument()
    })

    // Simulate right arrow key press
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(screen.getByText('ID: 3')).toBeInTheDocument()
    })

    // Simulate left arrow key press
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })

    await waitFor(() => {
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })
  })

  it('should handle loading state properly', async () => {
    // Create a new service for this test with slow loading
    const slowService = new StoryService()

    // Mock slow network request
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => mockStoriesData,
            }),
          100
        )
      )
    )

    render(<App storyService={slowService} />)

    // Should show loading state
    expect(screen.getByText('Загрузка истории...')).toBeInTheDocument()

    // Wait for story to load
    await waitFor(
      () => {
        expect(screen.getByText('First story text')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Loading state should be gone
    expect(screen.queryByText('Загрузка истории...')).not.toBeInTheDocument()
  })

  it('should handle data loading errors gracefully', async () => {
    // Create a new service for this test with error
    const errorService = new StoryService()

    // Mock fetch error
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    render(<App storyService={errorService} />)

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument()
    })
  })

  it('should disable navigation buttons appropriately for single story', async () => {
    // Create a new service for single story test
    const singleService = new StoryService()

    // Mock single story data
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ '1': 'Only story' }),
    })

    await singleService.initialize('/single.json')

    render(<App storyService={singleService} />)

    await waitFor(() => {
      expect(screen.getByText('Only story')).toBeInTheDocument()
    })

    // Both buttons should still be enabled for circular navigation
    const nextButton = screen.getByText('Вперед →')
    const prevButton = screen.getByText('← Назад')

    expect(nextButton).toBeEnabled()
    expect(prevButton).toBeEnabled()
  })
})
