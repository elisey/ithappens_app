// ABOUTME: Smoke test for basic app functionality and integration
// ABOUTME: Tests end-to-end functionality without complex mocking

import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { App } from '../../src/app'
import { useStoryService } from '../../src/hooks/useStoryService'
import {
  createMockStoryService,
  createMockStoriesData,
  waitForStoryLoad,
  waitForError,
  getNavigationButtons,
  cleanupMocks,
} from '../utils/testHelpers'

// Mock the useStoryService hook
vi.mock('../../src/hooks/useStoryService')

// Custom mock data for smoke tests
const smokeTestData = createMockStoriesData({
  '2': 'Second story\nwith multiple lines\nfor testing',
})

describe('App Smoke Test', () => {
  let smokeService: ReturnType<typeof createMockStoryService>

  beforeEach(async () => {
    // Clear storage before each test to ensure clean state
    localStorage.clear()
    sessionStorage.clear()

    cleanupMocks()
    smokeService = createMockStoryService(smokeTestData)
    await smokeService.initialize()

    // Mock the useStoryService hook to return our mock service
    vi.mocked(useStoryService).mockReturnValue({
      service: smokeService,
      isLoading: false,
      loadingStatus: null,
      error: null,
      retry: vi.fn(),
      progress: undefined,
    })
  })

  afterEach(() => {
    // Clean up storage after each test
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should render the app without crashing', () => {
    expect(() => render(<App />)).not.toThrow()
  })

  it('should display app title', async () => {
    render(<App />)
    expect(screen.getByText('ithappens')).toBeInTheDocument()
    await waitForStoryLoad()
  })

  it('should load and display first story', async () => {
    render(<App />)

    // Wait for story to load
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  it('should navigate forward between stories', async () => {
    render(<App />)

    // Wait for initial load
    await waitForStoryLoad('First test story with sample content')

    // Navigate forward
    const { next } = getNavigationButtons()
    fireEvent.click(next)

    await waitForStoryLoad()
    expect(screen.getByRole('article')).toHaveTextContent('Second story')
    expect(screen.getByText('ID: 2')).toBeInTheDocument()
  })

  it('should navigate backward between stories', async () => {
    render(<App />)

    // Wait for initial load and go to second story
    await waitForStoryLoad('First test story with sample content')

    const { next, previous } = getNavigationButtons()
    fireEvent.click(next)
    await waitForStoryLoad()
    expect(screen.getByRole('article')).toHaveTextContent('Second story')
    expect(screen.getByText('ID: 2')).toBeInTheDocument()

    // Navigate backward
    fireEvent.click(previous)

    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  it('should handle circular navigation (last to first)', async () => {
    render(<App />)

    // Wait for initial load
    await waitForStoryLoad('First test story with sample content')

    // Go to last story by clicking previous (circular)
    const { previous } = getNavigationButtons()
    fireEvent.click(previous)

    await waitForStoryLoad('Fifth story to test gap handling in navigation')
    expect(screen.getByText('ID: 5')).toBeInTheDocument()
  })

  it('should handle gap navigation correctly', async () => {
    render(<App />)

    // Wait for initial load
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()

    const { next } = getNavigationButtons()

    // Navigate through all stories to test gap handling (1 -> 2 -> 3 -> 5)
    fireEvent.click(next)
    await waitForStoryLoad()
    expect(screen.getByRole('article')).toHaveTextContent('Second story')
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
    render(<App />)

    // Navigate to story with line breaks (story 2)
    await waitForStoryLoad('First test story with sample content')
    expect(screen.getByText('ID: 1')).toBeInTheDocument()

    const { next } = getNavigationButtons()
    fireEvent.click(next)

    await waitForStoryLoad()
    // Check that text with line breaks is preserved
    const article = screen.getByRole('article')
    expect(article).toHaveTextContent('Second story')
    expect(article).toHaveTextContent('with multiple lines')
    expect(article).toHaveTextContent('for testing')
  })

  it('should handle error states gracefully', async () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Clear the default mock and set error state
    vi.mocked(useStoryService).mockReturnValue({
      service: null,
      isLoading: false,
      loadingStatus: null,
      error: new Error('Network error'),
      retry: vi.fn(),
      progress: undefined,
    })

    render(<App />)

    // Should show error message
    await waitForError()

    // Restore console.error
    consoleSpy.mockRestore()
  })

  it('should render all essential UI elements', async () => {
    render(<App />)

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
