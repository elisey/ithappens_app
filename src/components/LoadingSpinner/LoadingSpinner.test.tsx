// ABOUTME: Tests for LoadingSpinner component
// ABOUTME: Тесты для компонента индикатора загрузки

import { render, screen } from '@testing-library/preact'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default message and size', () => {
    render(<LoadingSpinner />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Загрузка...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Загружаем истории..." />)

    expect(screen.getByText('Загружаем истории...')).toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<LoadingSpinner />)

    const statusElement = screen.getByRole('status')
    expect(statusElement).toHaveAttribute('aria-live', 'polite')

    // Check that spinner animation is properly marked as decorative
    const spinner = statusElement.querySelector('[aria-hidden="true"]')
    expect(spinner).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />)
    let spinner = screen.getByRole('status').querySelector('[class*="spinner"]')
    expect(spinner).toHaveClass(/small/i)

    rerender(<LoadingSpinner size="medium" />)
    spinner = screen.getByRole('status').querySelector('[class*="spinner"]')
    expect(spinner).toHaveClass(/medium/i)

    rerender(<LoadingSpinner size="large" />)
    spinner = screen.getByRole('status').querySelector('[class*="spinner"]')
    expect(spinner).toHaveClass(/large/i)
  })

  it('has three animated dots', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status').querySelector('[aria-hidden="true"]')
    const dots = spinner?.querySelectorAll('div')
    expect(dots).toHaveLength(3)
    expect(dots?.[0]).toHaveClass(/dot1/i)
    expect(dots?.[1]).toHaveClass(/dot2/i)
    expect(dots?.[2]).toHaveClass(/dot3/i)
  })
})
