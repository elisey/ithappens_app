// ABOUTME: Smoke test for basic app functionality and integration
// ABOUTME: Tests end-to-end functionality without complex mocking

import { screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockStoryService,
  createMockStoriesData,
  renderAppWithMocks,
  waitForStoryLoad,
  waitForError,
  getNavigationButtons,
  cleanupMocks,
} from '../utils/testHelpers'

// Custom mock data for smoke tests
const smokeTestData = createMockStoriesData({
  '2': 'Second story\nwith multiple lines\nfor testing',
})

describe('App Smoke Test', () => {
  let smokeService: ReturnType<typeof createMockStoryService>

  beforeEach(() => {
    cleanupMocks()
    smokeService = createMockStoryService(smokeTestData)
  })

  it('should render the app without crashing', () => {
    expect(() => renderAppWithMocks({ storyService: smokeService })).not.toThrow()
  })

  it('should display app title', async () => {
    renderAppWithMocks({ storyService: smokeService })
    expect(screen.getByText('ithappens')).toBeInTheDocument()
    await waitForStoryLoad()
  })

  it('should load and display first story', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Should show loading initially
    expect(screen.getByText('Загружаем истории...')).toBeInTheDocument()

    // Wait for story to load
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()

    // Loading should be gone
    expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
  })

  it('should navigate forward between stories', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Wait for initial load
    await waitForStoryLoad('First test story with sample content')

    // Navigate forward
    const { next } = getNavigationButtons()
    fireEvent.click(next)

    await waitForStoryLoad('Second story')
    expect(screen.getByText('ID: 2')).toBeInTheDocument()
  })

  it('should navigate backward between stories', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Wait for initial load and go to second story
    await waitForStoryLoad('First test story with sample content')

    const { next, previous } = getNavigationButtons()
    fireEvent.click(next)
    await waitForStoryLoad('Second story')
    expect(screen.getByText('ID: 2')).toBeInTheDocument()

    // Navigate backward
    fireEvent.click(previous)

    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  it('should handle circular navigation (last to first)', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Wait for initial load
    await waitForStoryLoad('First test story with sample content')

    // Go to last story by clicking previous (circular)
    const { previous } = getNavigationButtons()
    fireEvent.click(previous)

    await waitForStoryLoad('Fifth story to test gap handling in navigation')
    expect(screen.getByText('ID: 5')).toBeInTheDocument()
  })

  it('should handle gap navigation correctly', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Wait for initial load
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()

    const { next } = getNavigationButtons()

    // Navigate through all stories to test gap handling (1 -> 2 -> 3 -> 5)
    fireEvent.click(next)
    await waitForStoryLoad('Second story')
    expect(screen.getByText('ID: 2')).toBeInTheDocument()

    fireEvent.click(next)
    await waitForStoryLoad('Third story for navigation testing')
    expect(screen.getByText('ID: 3')).toBeInTheDocument()

    fireEvent.click(next)
    await waitForStoryLoad('Fifth story to test gap handling in navigation')
    expect(screen.getByText('ID: 5')).toBeInTheDocument()

    // Test circular navigation (5 -> 1)
    fireEvent.click(next)
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  it('should preserve line breaks in story content', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Navigate to story with line breaks (story 2)
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()

    const { next } = getNavigationButtons()
    fireEvent.click(next)

    await waitForStoryLoad('Second story')
    expect(screen.getByText('with multiple lines')).toBeInTheDocument()
    expect(screen.getByText('for testing')).toBeInTheDocument()
  })

  it('should handle error states gracefully', async () => {
    // Create a service that will fail initialization
    const mockService = createMockStoryService()
    vi.spyOn(mockService, 'initialize').mockRejectedValue(new Error('Network error'))

    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderAppWithMocks({ storyService: mockService })

    // Should show error message
    await waitForError()

    // Restore console.error
    consoleSpy.mockRestore()
  })

  it('should render all essential UI elements', async () => {
    renderAppWithMocks({ storyService: smokeService })

    // Wait for load
    await waitForStoryLoad()

    // Check all essential elements are present
    expect(screen.getByText('ithappens')).toBeInTheDocument() // title
    expect(screen.getByText('← Назад')).toBeInTheDocument() // prev button
    expect(screen.getByText('Вперед →')).toBeInTheDocument() // next button
    expect(screen.getByText(/ID:/)).toBeInTheDocument() // current id
    expect(screen.getByText('Перейти к содержанию')).toBeInTheDocument() // skip link
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument() // main content
    expect(screen.getByRole('navigation')).toBeInTheDocument() // navigation
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })
})
