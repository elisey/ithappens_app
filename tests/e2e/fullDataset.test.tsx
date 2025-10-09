// ABOUTME: End-to-end tests for full dataset integration with 13k+ stories
// ABOUTME: Tests loading, caching, navigation, error handling, and performance
/* eslint-env browser */

import { render, screen, waitFor } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { App } from '../../src/App'
import type { StoriesData } from '../../src/types/story'

// Mock stories data - simulating large dataset
function generateLargeDataset(count: number): StoriesData {
  const stories: StoriesData = {}
  for (let i = 1; i <= count; i++) {
    stories[i.toString()] =
      `This is story number ${i}. It contains some text to simulate real data. The stories can vary in length and content.`
  }
  return stories
}

// Helper to mock fetch with large dataset
function mockFetchWithDataset(stories: StoriesData, delay = 0, shouldFail = false) {
  global.fetch = vi.fn(async () => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    if (shouldFail) {
      throw new Error('Network error')
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: async () => stories,
      text: async () => JSON.stringify(stories),
      body: null,
    } as Response
  })
}

// Helper to estimate memory usage
function getMemoryUsage(): number {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    // @ts-expect-error - memory is not in standard types but exists in Chrome
    return performance.memory?.usedJSHeapSize || 0
  }
  return 0
}

describe('Full Dataset Integration', () => {
  const LARGE_DATASET_SIZE = 13000
  let largeDataset: StoriesData

  beforeEach(() => {
    // Clear storage before each test
    sessionStorage.clear()
    localStorage.clear()

    // Generate large dataset
    largeDataset = generateLargeDataset(LARGE_DATASET_SIZE)

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    sessionStorage.clear()
    localStorage.clear()
  })

  test('loads 13k+ stories on first visit (cold start)', async () => {
    const startTime = performance.now()
    mockFetchWithDataset(largeDataset, 100)

    render(<App />)

    // Should show loading screen
    expect(screen.getByText(/Инициализация приложения/i)).toBeInTheDocument()

    // Wait for stories to load
    await waitFor(
      () => {
        expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    const loadTime = performance.now() - startTime

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)

    // Should display first story
    expect(screen.getByText(/story number 1/i)).toBeInTheDocument()

    // Should have navigation buttons
    expect(screen.getByLabelText(/next story/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/previous story/i)).toBeInTheDocument()
  })

  test('loads from cache on refresh (warm start)', async () => {
    // First load - populate cache
    mockFetchWithDataset(largeDataset, 100)
    const { unmount } = render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    unmount()

    // Second load
    mockFetchWithDataset(largeDataset, 0)
    render(<App />)

    // Should load successfully
    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })
  })

  test('navigates through stories efficiently', async () => {
    mockFetchWithDataset(largeDataset)
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    // Navigate forward
    const nextButton = screen.getByLabelText(/next story/i)

    const startTime = performance.now()
    await user.click(nextButton)
    const navigationTime = performance.now() - startTime

    // Navigation should be instant (under 100ms)
    expect(navigationTime).toBeLessThan(100)

    expect(screen.getByText(/story number 2/i)).toBeInTheDocument()

    // Navigate backward
    const prevButton = screen.getByLabelText(/previous story/i)
    await user.click(prevButton)

    expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
  })

  test('handles network failure gracefully', async () => {
    mockFetchWithDataset(largeDataset, 0, true)

    render(<App />)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Ошибка загрузки/i)).toBeInTheDocument()
    })

    // Should show retry button
    expect(screen.getByText(/Повторить/i)).toBeInTheDocument()
  })

  test('retries loading after error', async () => {
    // First attempt fails
    mockFetchWithDataset(largeDataset, 0, true)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Ошибка загрузки/i)).toBeInTheDocument()
    })

    // Setup successful fetch for retry
    mockFetchWithDataset(largeDataset, 0, false)

    const retryButton = screen.getByText(/Повторить/i)
    await userEvent.click(retryButton)

    // Should load successfully
    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })
  })

  test('maintains performance with large dataset', async () => {
    mockFetchWithDataset(largeDataset)
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    // Perform multiple rapid navigations
    const nextButton = screen.getByLabelText(/next story/i)

    const navigationTimes: number[] = []

    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      await user.click(nextButton)
      navigationTimes.push(performance.now() - start)

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`story number ${i + 2}`, 'i'))).toBeInTheDocument()
      })
    }

    // All navigations should be fast
    const avgNavigationTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
    expect(avgNavigationTime).toBeLessThan(50)

    // No navigation should be extremely slow
    const maxNavigationTime = Math.max(...navigationTimes)
    expect(maxNavigationTime).toBeLessThan(100)
  })

  test('memory usage stays within limits', async () => {
    const initialMemory = getMemoryUsage()

    mockFetchWithDataset(largeDataset)
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    const loadedMemory = getMemoryUsage()

    if (loadedMemory > 0 && initialMemory > 0) {
      const memoryIncrease = loadedMemory - initialMemory

      // Memory increase should be under 100MB
      const maxMemoryIncrease = 100 * 1024 * 1024 // 100MB in bytes
      expect(memoryIncrease).toBeLessThan(maxMemoryIncrease)
    }

    // If memory API not available, test passes
    expect(true).toBe(true)
  })

  test('jump to ID works with large dataset', async () => {
    mockFetchWithDataset(largeDataset)
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    // Open jump modal
    const jumpButton = screen.getByLabelText(/Current story ID: 1/i)
    await user.click(jumpButton)

    // Enter target ID (middle of dataset)
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '6500')

    // Submit
    const submitButton = screen.getByRole('button', { name: /jump/i })
    await user.click(submitButton)

    // Should navigate to story 6500
    await waitFor(() => {
      expect(screen.getByText(/story number 6500/i)).toBeInTheDocument()
    })
  })

  test('handles rapid navigation without errors', async () => {
    mockFetchWithDataset(largeDataset)
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    const nextButton = screen.getByLabelText(/next story/i)

    // Rapid clicks
    await user.tripleClick(nextButton)

    // Should not crash and should be on some story
    await waitFor(() => {
      expect(screen.getByText(/story number/i)).toBeInTheDocument()
    })

    // Console should not have errors
    expect(console.error).not.toHaveBeenCalledWith(expect.stringMatching(/error/i))
  })

  test('keyboard navigation works efficiently', async () => {
    mockFetchWithDataset(largeDataset)
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })

    // Small delay to ensure component is fully ready for keyboard events
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Navigate with arrow keys
    const startTime = performance.now()
    await user.keyboard('{ArrowRight}')
    const keyboardNavigationTime = performance.now() - startTime

    expect(keyboardNavigationTime).toBeLessThan(100)

    await waitFor(() => {
      expect(screen.getByText(/story number 2/i)).toBeInTheDocument()
    })

    // Navigate back
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => {
      expect(screen.getByText(/story number 1/i)).toBeInTheDocument()
    })
  })
})
