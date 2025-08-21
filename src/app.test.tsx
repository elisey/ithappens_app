// ABOUTME: Tests for the main App component
// ABOUTME: Тесты для главного компонента приложения, проверка рендеринга и отображения текста
import { render, screen, waitFor } from '@testing-library/preact'
import { axe, toHaveNoViolations } from 'jest-axe'
import { App } from './app'
import { StoryService } from './services/storyService'
import type { StoriesData } from './types/story'

expect.extend(toHaveNoViolations)

// Mock data for tests
const mockStoriesData: StoriesData = {
  '1': 'Это пример истории для демонстрации типографики и базового функционала приложения.',
  '2': 'Вторая история для тестирования навигации.',
  '3': 'Третья история для проверки корректной работы.',
}

// Create a mock StoryService class
class MockStoryService extends StoryService {
  private mockStories: StoriesData = {}
  private mockSortedIds: number[] = []
  private mockLoaded = false

  async initialize(): Promise<void> {
    this.mockStories = { ...mockStoriesData }
    this.mockSortedIds = Object.keys(this.mockStories)
      .map((id) => parseInt(id, 10))
      .sort((a, b) => a - b)
    this.mockLoaded = true
  }

  getById(id: number): string | null {
    if (!this.mockLoaded) {
      return null
    }
    return this.mockStories[id.toString()] || null
  }

  getNextId(currentId: number): number | null {
    if (!this.mockLoaded || this.mockSortedIds.length === 0) {
      return null
    }

    const currentIndex = this.mockSortedIds.indexOf(currentId)
    if (currentIndex === -1) {
      return null
    }

    if (currentIndex === this.mockSortedIds.length - 1) {
      return this.mockSortedIds[0]
    }

    return this.mockSortedIds[currentIndex + 1]
  }

  getPrevId(currentId: number): number | null {
    if (!this.mockLoaded || this.mockSortedIds.length === 0) {
      return null
    }

    const currentIndex = this.mockSortedIds.indexOf(currentId)
    if (currentIndex === -1) {
      return null
    }

    if (currentIndex === 0) {
      return this.mockSortedIds[this.mockSortedIds.length - 1]
    }

    return this.mockSortedIds[currentIndex - 1]
  }

  getFirstId(): number | null {
    if (!this.mockLoaded || this.mockSortedIds.length === 0) {
      return null
    }
    return this.mockSortedIds[0]
  }

  getLastId(): number | null {
    if (!this.mockLoaded || this.mockSortedIds.length === 0) {
      return null
    }
    return this.mockSortedIds[this.mockSortedIds.length - 1]
  }

  getAllIds(): number[] {
    if (!this.mockLoaded) {
      return []
    }
    return [...this.mockSortedIds]
  }

  isLoaded(): boolean {
    return this.mockLoaded
  }
}

describe('App', () => {
  let mockStoryService: MockStoryService

  beforeEach(() => {
    mockStoryService = new MockStoryService()
  })

  it('renders without crashing', async () => {
    render(<App storyService={mockStoryService} />)
    expect(screen.getByRole('heading')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })
  })

  it('displays the app title', async () => {
    render(<App storyService={mockStoryService} />)
    expect(screen.getByText('ithappens')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })
  })

  it('displays story content', async () => {
    render(<App storyService={mockStoryService} />)

    // Wait for story to load and check content
    await waitFor(() => {
      expect(
        screen.getByText(/Это пример истории для демонстрации типографики/)
      ).toBeInTheDocument()
    })
  })

  it('has correct landmarks', async () => {
    render(<App storyService={mockStoryService} />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })

    // Navigation should be available after loading
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('has skip link for accessibility', async () => {
    render(<App storyService={mockStoryService} />)

    const skipLink = screen.getByText('Перейти к содержанию')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<App storyService={mockStoryService} />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('main content is focusable for skip link', async () => {
    render(<App storyService={mockStoryService} />)

    const mainContent = screen.getByRole('main')
    expect(mainContent).toHaveAttribute('tabIndex', '-1')
    expect(mainContent).toHaveAttribute('id', 'main-content')

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Загружаем истории...')).not.toBeInTheDocument()
    })
  })
})
