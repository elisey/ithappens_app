// ABOUTME: Tests for SkipLink component
// ABOUTME: Тесты для компонента SkipLink
import { render, fireEvent } from '@testing-library/preact'
import { SkipLink } from './SkipLink'

describe('SkipLink', () => {
  beforeEach(() => {
    // Clear any existing elements with the test ID
    const existing = document.getElementById('test-target')
    if (existing) {
      existing.remove()
    }
  })

  it('renders with correct href and text', () => {
    const { getByRole } = render(<SkipLink targetId="main-content">Skip to main content</SkipLink>)

    const link = getByRole('link')
    expect(link).toHaveAttribute('href', '#main-content')
    expect(link).toHaveTextContent('Skip to main content')
  })

  it('focuses target element when clicked', () => {
    // Create a target element
    const target = document.createElement('div')
    target.id = 'test-target'
    target.tabIndex = -1
    document.body.appendChild(target)

    const { getByRole } = render(<SkipLink targetId="test-target">Skip to content</SkipLink>)

    const link = getByRole('link')
    fireEvent.click(link)

    expect(document.activeElement).toBe(target)

    // Cleanup
    document.body.removeChild(target)
  })

  it('applies correct CSS class', () => {
    const { getByRole } = render(<SkipLink targetId="content">Skip to content</SkipLink>)

    const link = getByRole('link')
    expect(link.className).toMatch(/skipLink/)
  })

  it('handles missing target gracefully', () => {
    const { getByRole } = render(<SkipLink targetId="non-existent">Skip to content</SkipLink>)

    const link = getByRole('link')

    // Should not throw an error
    expect(() => fireEvent.click(link)).not.toThrow()
  })
})
