// ABOUTME: Tests for StoryContent component
// ABOUTME: Тесты для компонента StoryContent
import { render } from '@testing-library/preact'
import { StoryContent } from './StoryContent'

describe('StoryContent', () => {
  it('renders story text with paragraphs', () => {
    const storyText = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
    const { getByText } = render(<StoryContent text={storyText} />)

    expect(getByText('First paragraph.')).toBeInTheDocument()
    expect(getByText('Second paragraph.')).toBeInTheDocument()
    expect(getByText('Third paragraph.')).toBeInTheDocument()
  })

  it('renders loading state when isLoading is true', () => {
    const { getByText } = render(<StoryContent text="Some text" isLoading={true} />)

    expect(getByText('Загрузка истории...')).toBeInTheDocument()
  })

  it('splits text into paragraphs correctly', () => {
    const storyText = 'Para 1\n\n\n\nPara 2\n\nPara 3'
    const { container } = render(<StoryContent text={storyText} />)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(3)
  })

  it('filters out empty paragraphs', () => {
    const storyText = 'Para 1\n\n\n\nPara 2\n\n   \n\nPara 3'
    const { container } = render(<StoryContent text={storyText} />)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(3)
  })

  it('handles single paragraph text', () => {
    const storyText = 'Single paragraph story.'
    const { getByText } = render(<StoryContent text={storyText} />)

    expect(getByText('Single paragraph story.')).toBeInTheDocument()
  })

  it('handles empty text', () => {
    const { container } = render(<StoryContent text="" />)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('uses article tag for semantic structure', () => {
    const { container } = render(<StoryContent text="Test story" />)

    const article = container.querySelector('article')
    expect(article).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<StoryContent text="Test story" />)

    expect(container.firstChild?.className).toMatch(/container/)

    const article = container.querySelector('article')
    expect(article?.className).toMatch(/story/)

    const paragraph = container.querySelector('p')
    expect(paragraph?.className).toMatch(/paragraph/)
  })
})
