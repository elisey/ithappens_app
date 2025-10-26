// ABOUTME: Test suite for StoryViewer component
// ABOUTME: Tests rendering, text formatting, scroll behavior, and accessibility
import { render, screen } from '@testing-library/preact'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StoryViewer } from '../../src/components/StoryContent'

describe('StoryViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic rendering', () => {
    it('renders story text with ID', () => {
      const storyText = 'This is a test story.'
      render(<StoryViewer storyId={42} storyText={storyText} isLoading={false} />)

      expect(screen.getByText('История #42')).toBeInTheDocument()
      expect(screen.getByText(storyText)).toBeInTheDocument()
    })

    it('preserves line breaks in text', () => {
      const storyText = 'Line 1\nLine 2\nLine 3'
      const { container } = render(
        <StoryViewer storyId={1} storyText={storyText} isLoading={false} />
      )

      const textElement = container.querySelector('[class*="_text_"]')
      expect(textElement).toBeInTheDocument()
      expect(textElement?.textContent).toBe(storyText)
    })

    it('renders multi-paragraph story', () => {
      const storyText = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
      const { container } = render(
        <StoryViewer storyId={5} storyText={storyText} isLoading={false} />
      )

      const textElement = container.querySelector('[class*="_text_"]')
      expect(textElement).toBeInTheDocument()
      expect(textElement?.textContent).toBe(storyText)
    })
  })

  describe('Loading state', () => {
    it('shows loading state', () => {
      render(<StoryViewer storyId={null} storyText={null} isLoading={true} />)

      expect(screen.getByText('Загрузка истории...')).toBeInTheDocument()
    })

    it('does not show content while loading', () => {
      render(<StoryViewer storyId={1} storyText="Test" isLoading={true} />)

      expect(screen.queryByText('История #1')).not.toBeInTheDocument()
      expect(screen.queryByText('Test')).not.toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('displays error message', () => {
      const error = new Error('Failed to load story')
      render(<StoryViewer storyId={1} storyText={null} isLoading={false} error={error} />)

      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
      expect(screen.getByText('Failed to load story')).toBeInTheDocument()
    })

    it('does not show content when error occurs', () => {
      const error = new Error('Test error')
      render(<StoryViewer storyId={1} storyText="Test" isLoading={false} error={error} />)

      expect(screen.queryByText('История #1')).not.toBeInTheDocument()
      expect(screen.queryByText('Test')).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('handles null story', () => {
      render(<StoryViewer storyId={null} storyText={null} isLoading={false} />)

      expect(screen.getByText('История не найдена')).toBeInTheDocument()
    })

    it('handles null storyId', () => {
      render(<StoryViewer storyId={null} storyText="Test" isLoading={false} />)

      expect(screen.getByText('История не найдена')).toBeInTheDocument()
    })

    it('handles null storyText', () => {
      render(<StoryViewer storyId={1} storyText={null} isLoading={false} />)

      expect(screen.getByText('История не найдена')).toBeInTheDocument()
    })
  })

  describe('Text formatting', () => {
    it('handles empty lines', () => {
      const storyText = 'Text\n\n\nMore text'
      const { container } = render(
        <StoryViewer storyId={1} storyText={storyText} isLoading={false} />
      )

      const textElement = container.querySelector('[class*="_text_"]')
      expect(textElement).toBeInTheDocument()
      expect(textElement?.textContent).toBe(storyText)
    })

    it('handles very long stories', () => {
      const longText = 'A'.repeat(5000)
      render(<StoryViewer storyId={1} storyText={longText} isLoading={false} />)

      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('handles special characters in text', () => {
      const storyText = 'Special chars: @#$%^&*()'
      render(<StoryViewer storyId={1} storyText={storyText} isLoading={false} />)

      expect(screen.getByText(storyText)).toBeInTheDocument()
    })

    it('handles unicode characters', () => {
      const storyText = 'Unicode: 你好 🌟 Привет'
      render(<StoryViewer storyId={1} storyText={storyText} isLoading={false} />)

      expect(screen.getByText(storyText)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has article role on content area', () => {
      render(<StoryViewer storyId={1} storyText="Test story" isLoading={false} />)

      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
    })

    it('has proper aria-label on content', () => {
      render(<StoryViewer storyId={42} storyText="Test story" isLoading={false} />)

      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', 'Story 42 content')
    })

    it('has proper aria-label on header', () => {
      render(<StoryViewer storyId={42} storyText="Test story" isLoading={false} />)

      const header = screen.getByText('История #42')
      expect(header).toHaveAttribute('aria-label', 'Story ID 42')
    })
  })

  describe('Scroll behavior', () => {
    it('renders scrollable content area', () => {
      render(<StoryViewer storyId={1} storyText="Test story" isLoading={false} />)

      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
    })

    it('has proper structure for scrolling', () => {
      const { container } = render(
        <StoryViewer storyId={1} storyText="Test story" isLoading={false} />
      )

      const contentDiv = container.querySelector('[role="article"]')
      expect(contentDiv).toBeInTheDocument()
    })
  })

  describe('Component updates', () => {
    it('updates when story ID changes', () => {
      const { rerender } = render(<StoryViewer storyId={1} storyText="Story 1" isLoading={false} />)

      expect(screen.getByText('История #1')).toBeInTheDocument()
      expect(screen.getByText('Story 1')).toBeInTheDocument()

      rerender(<StoryViewer storyId={2} storyText="Story 2" isLoading={false} />)

      expect(screen.getByText('История #2')).toBeInTheDocument()
      expect(screen.getByText('Story 2')).toBeInTheDocument()
    })

    it('updates when text changes', () => {
      const { rerender } = render(
        <StoryViewer storyId={1} storyText="Original text" isLoading={false} />
      )

      expect(screen.getByText('Original text')).toBeInTheDocument()

      rerender(<StoryViewer storyId={1} storyText="Updated text" isLoading={false} />)

      expect(screen.getByText('Updated text')).toBeInTheDocument()
      expect(screen.queryByText('Original text')).not.toBeInTheDocument()
    })

    it('transitions from loading to loaded', () => {
      const { rerender } = render(<StoryViewer storyId={null} storyText={null} isLoading={true} />)

      expect(screen.getByText('Загрузка истории...')).toBeInTheDocument()

      rerender(<StoryViewer storyId={1} storyText="Loaded" isLoading={false} />)

      expect(screen.queryByText('Загрузка истории...')).not.toBeInTheDocument()
      expect(screen.getByText('Loaded')).toBeInTheDocument()
    })
  })
})
