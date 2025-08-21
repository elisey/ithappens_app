// ABOUTME: Tests for ErrorBoundary component
// ABOUTME: Тесты для компонента границы ошибок

import { render, screen, fireEvent } from '@testing-library/preact'
import { vi } from 'vitest'
import { NetworkError, ParseError, TimeoutError, NotFoundError } from '../../types/errors'
import { ErrorBoundary } from './ErrorBoundary'

describe('ErrorBoundary', () => {
  const mockOnRetry = vi.fn()
  const mockOnReload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: vi.fn(),
      },
      writable: true,
    })
  })

  it('renders nothing when no error', () => {
    const { container } = render(<ErrorBoundary error={null} onRetry={mockOnRetry} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders error message and retry button for retryable errors', () => {
    const networkError = new NetworkError('Network failed')
    render(
      <ErrorBoundary error={networkError} onRetry={mockOnRetry} retryCount={0} maxRetries={3} />
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument()
    expect(screen.getByText(networkError.userMessage)).toBeInTheDocument()
    expect(screen.getByText('Попробовать еще раз')).toBeInTheDocument()
  })

  it('shows retry count when retryCount > 0', () => {
    const networkError = new NetworkError('Network failed')
    render(
      <ErrorBoundary error={networkError} onRetry={mockOnRetry} retryCount={2} maxRetries={3} />
    )

    expect(screen.getByText('Попытка 2 из 3')).toBeInTheDocument()
  })

  it('disables retry button when max retries reached', () => {
    const networkError = new NetworkError('Network failed')
    render(
      <ErrorBoundary error={networkError} onRetry={mockOnRetry} retryCount={3} maxRetries={3} />
    )

    expect(screen.queryByText('Попробовать еще раз')).not.toBeInTheDocument()
  })

  it('does not show retry button for non-retryable errors', () => {
    const parseError = new ParseError('JSON parse failed')
    render(<ErrorBoundary error={parseError} onRetry={mockOnRetry} retryCount={0} maxRetries={3} />)

    expect(screen.queryByText('Попробовать еще раз')).not.toBeInTheDocument()
    expect(screen.getByText('Перезагрузить страницу')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const networkError = new NetworkError('Network failed')
    render(
      <ErrorBoundary error={networkError} onRetry={mockOnRetry} retryCount={0} maxRetries={3} />
    )

    fireEvent.click(screen.getByText('Попробовать еще раз'))
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('calls window.location.reload when reload button is clicked', () => {
    const parseError = new ParseError('JSON parse failed')
    render(<ErrorBoundary error={parseError} onRetry={mockOnRetry} />)

    fireEvent.click(screen.getByText('Перезагрузить страницу'))
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })

  it('calls custom onReload when provided', () => {
    const parseError = new ParseError('JSON parse failed')
    render(<ErrorBoundary error={parseError} onRetry={mockOnRetry} onReload={mockOnReload} />)

    fireEvent.click(screen.getByText('Перезагрузить страницу'))
    expect(mockOnReload).toHaveBeenCalledTimes(1)
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('renders solutions when provided', () => {
    const networkError = new NetworkError('Network failed')
    render(<ErrorBoundary error={networkError} onRetry={mockOnRetry} />)

    expect(screen.getByText('Возможные решения:')).toBeInTheDocument()
    expect(screen.getByText('Проверьте интернет-соединение')).toBeInTheDocument()
    expect(screen.getByText('Повторите попытку')).toBeInTheDocument()
  })

  it('handles solution action buttons', () => {
    const networkError = new NetworkError('Network failed')
    render(<ErrorBoundary error={networkError} onRetry={mockOnRetry} onReload={mockOnReload} />)

    // Find and click the retry solution button
    const solutionButtons = screen.getAllByText('Попробовать')
    fireEvent.click(solutionButtons[0])
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('shows technical details when expanded', () => {
    const timeoutError = new TimeoutError('Request timed out', 10000)
    render(<ErrorBoundary error={timeoutError} onRetry={mockOnRetry} />)

    // Initially details should not be visible
    expect(screen.queryByText('Тип ошибки:')).not.toBeInTheDocument()

    // Click to expand details
    fireEvent.click(screen.getByText('Техническая информация'))

    // Now details should be visible
    expect(screen.getByText('Тип ошибки:')).toBeInTheDocument()
    expect(screen.getByText('TIMEOUT')).toBeInTheDocument()
    expect(screen.getByText('Время:')).toBeInTheDocument()
  })

  it('handles different error types correctly', () => {
    const { rerender } = render(
      <ErrorBoundary error={new NetworkError('Network error')} onRetry={mockOnRetry} />
    )
    expect(screen.getByText(/Проверьте подключение к интернету/)).toBeInTheDocument()

    rerender(<ErrorBoundary error={new ParseError('Parse error')} onRetry={mockOnRetry} />)
    expect(screen.getByText(/Попробуйте перезагрузить страницу/)).toBeInTheDocument()

    rerender(<ErrorBoundary error={new NotFoundError('resource')} onRetry={mockOnRetry} />)
    expect(screen.getByText(/Запрашиваемые данные не найдены/)).toBeInTheDocument()

    rerender(<ErrorBoundary error={new TimeoutError('Timeout', 5000)} onRetry={mockOnRetry} />)
    expect(screen.getByText(/Превышено время ожидания/)).toBeInTheDocument()
  })
})
