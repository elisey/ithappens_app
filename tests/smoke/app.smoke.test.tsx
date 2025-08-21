// ABOUTME: Smoke test for basic app functionality and integration
// ABOUTME: Tests end-to-end functionality without complex mocking

import { render, screen, waitFor, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { App } from '../../src/app'
import { StoryService } from '../../src/services/storyService'

// Mock story data for consistent testing
const mockStoryData = {
  '1': 'First test story with sample content',
  '2': 'Second story\nwith multiple lines\nfor testing',
  '3': 'Third story for navigation testing',
  '5': 'Fifth story to test gap handling',
}

// Mock StoryService for predictable behavior
class SmokeTestStoryService extends StoryService {
  async initialize(): Promise<void> {
    // Simulate brief loading
    await new Promise((resolve) => setTimeout(resolve, 10))
    // Set up predictable data
    Object.assign(this, {
      stories: { ...mockStoryData },
      sortedIds: [1, 2, 3, 5],
      loaded: true,
    })
  }

  getById(id: number): string | null {
    return mockStoryData[id.toString()] || null
  }

  getFirstId(): number {
    return 1
  }

  getLastId(): number {
    return 5
  }

  getAllIds(): number[] {
    return [1, 2, 3, 5]
  }

  getNextId(currentId: number): number | null {
    const ids = [1, 2, 3, 5]
    const currentIndex = ids.indexOf(currentId)
    if (currentIndex === -1) return null
    return currentIndex === ids.length - 1 ? ids[0] : ids[currentIndex + 1]
  }

  getPrevId(currentId: number): number | null {
    const ids = [1, 2, 3, 5]
    const currentIndex = ids.indexOf(currentId)
    if (currentIndex === -1) return null
    return currentIndex === 0 ? ids[ids.length - 1] : ids[currentIndex - 1]
  }

  isLoaded(): boolean {
    return true
  }
}

describe('App Smoke Test', () => {
  let smokeService: SmokeTestStoryService

  beforeEach(() => {
    smokeService = new SmokeTestStoryService()
  })

  it('should render the app without crashing', () => {
    expect(() => render(<App storyService={smokeService} />)).not.toThrow()
  })

  it('should display app title', async () => {
    render(<App storyService={smokeService} />)
    expect(screen.getByText('ithappens')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })
  })

  it('should load and display first story', async () => {
    render(<App storyService={smokeService} />)

    // Should show loading initially
    expect(screen.getByText('Загружаем истории...')).toBeInTheDocument()

    // Wait for story to load
    await waitFor(() => {
      expect(screen.getByText('First test story with sample content')).toBeInTheDocument()
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })

    // Loading should be gone
    expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
  })

  it('should navigate forward between stories', async () => {
    render(<App storyService={smokeService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First test story with sample content')).toBeInTheDocument()
    })

    // Navigate forward
    fireEvent.click(screen.getByText('Вперед →'))

    await waitFor(() => {
      expect(screen.getByText('Second story')).toBeInTheDocument()
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
    })
  })

  it('should navigate backward between stories', async () => {
    render(<App storyService={smokeService} />)

    // Wait for initial load and go to second story
    await waitFor(() => {
      expect(screen.getByText('First test story with sample content')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
    })

    // Navigate backward
    fireEvent.click(screen.getByText('← Назад'))

    await waitFor(() => {
      expect(screen.getByText('First test story with sample content')).toBeInTheDocument()
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })
  })

  it('should handle circular navigation (last to first)', async () => {
    render(<App storyService={smokeService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })

    // Go to last story by clicking previous (circular)
    fireEvent.click(screen.getByText('← Назад'))

    await waitFor(() => {
      expect(screen.getByText('Fifth story to test gap handling')).toBeInTheDocument()
      expect(screen.getByText('ID: 5')).toBeInTheDocument()
    })
  })

  it('should handle gap navigation correctly', async () => {
    render(<App storyService={smokeService} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First test story with sample content')).toBeInTheDocument()
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })

    // Navigate through all stories to test gap handling (1 -> 2 -> 3 -> 5)
    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('ID: 3')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('Fifth story to test gap handling')).toBeInTheDocument()
      expect(screen.getByText('ID: 5')).toBeInTheDocument()
    })

    // Test circular navigation (5 -> 1)
    fireEvent.click(screen.getByText('Вперед →'))
    await waitFor(() => {
      expect(screen.getByText('First test story with sample content')).toBeInTheDocument()
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })
  })

  it('should preserve line breaks in story content', async () => {
    render(<App storyService={smokeService} />)

    // Navigate to story with line breaks (story 2)
    await waitFor(() => {
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Вперед →'))

    await waitFor(() => {
      expect(screen.getByText('Second story')).toBeInTheDocument()
      expect(screen.getByText('with multiple lines')).toBeInTheDocument()
      expect(screen.getByText('for testing')).toBeInTheDocument()
    })
  })

  it('should handle error states gracefully', async () => {
    // Create a service that will fail initialization
    class ErrorStoryService extends StoryService {
      async initialize(): Promise<void> {
        throw new Error('Network error')
      }
    }

    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const errorService = new ErrorStoryService()
    render(<App storyService={errorService} />)

    // Should show error message
    await waitFor(() => {
      expect(screen.getAllByText(/ошибка/i)[0]).toBeInTheDocument()
    })

    // Restore console.error
    consoleSpy.mockRestore()
  })

  it('should render all essential UI elements', async () => {
    render(<App storyService={smokeService} />)

    // Wait for load
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })

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
