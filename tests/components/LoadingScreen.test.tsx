// ABOUTME: Unit tests for LoadingScreen component
// ABOUTME: Tests loading states, error display, retry functionality, and accessibility

import { render, screen, fireEvent } from '@testing-library/preact'
import { describe, it, expect, vi } from 'vitest'
import { LoadingScreen } from '../../src/components/LoadingScreen'
import type { LoadingStatus } from '../../src/components/LoadingScreen'

describe('LoadingScreen', () => {
  describe('Loading states', () => {
    it('should display initializing status message', () => {
      render(<LoadingScreen status="initializing" />)
      expect(screen.getByText('Инициализация приложения...')).toBeInTheDocument()
    })

    it('should display loading status message', () => {
      render(<LoadingScreen status="loading" />)
      expect(screen.getByText('Загрузка историй...')).toBeInTheDocument()
    })

    it('should display parsing status message', () => {
      render(<LoadingScreen status="parsing" />)
      expect(screen.getByText('Обработка данных...')).toBeInTheDocument()
    })

    it('should display indexing status message', () => {
      render(<LoadingScreen status="indexing" />)
      expect(screen.getByText('Подготовка к работе...')).toBeInTheDocument()
    })

    it('should display progress when provided', () => {
      render(<LoadingScreen status="loading" progress={42} />)
      expect(screen.getByText('42%')).toBeInTheDocument()
    })

    it('should not display progress when not provided', () => {
      render(<LoadingScreen status="loading" />)
      expect(screen.queryByText('%')).not.toBeInTheDocument()
    })

    it('should have polite aria-live for loading states', () => {
      const { container } = render(<LoadingScreen status="loading" />)
      const overlay = container.querySelector('[role="status"]')
      expect(overlay).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Error state', () => {
    it('should display error message', () => {
      const error = new Error('Network connection failed')
      render(<LoadingScreen status="loading" error={error} />)
      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
      expect(screen.getByText('Network connection failed')).toBeInTheDocument()
    })

    it('should display retry button when onRetry is provided', () => {
      const error = new Error('Test error')
      const onRetry = vi.fn()
      render(<LoadingScreen status="loading" error={error} onRetry={onRetry} />)
      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })

    it('should not display retry button when onRetry is not provided', () => {
      const error = new Error('Test error')
      render(<LoadingScreen status="loading" error={error} />)
      expect(screen.queryByRole('button', { name: /повторить/i })).not.toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', () => {
      const error = new Error('Test error')
      const onRetry = vi.fn()
      render(<LoadingScreen status="loading" error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /повторить/i })
      fireEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should call onRetry when Enter key is pressed on retry button', () => {
      const error = new Error('Test error')
      const onRetry = vi.fn()
      render(<LoadingScreen status="loading" error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /повторить/i })
      fireEvent.keyDown(retryButton, { key: 'Enter' })

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should not call onRetry when other keys are pressed', () => {
      const error = new Error('Test error')
      const onRetry = vi.fn()
      render(<LoadingScreen status="loading" error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /повторить/i })
      fireEvent.keyDown(retryButton, { key: 'Space' })

      expect(onRetry).not.toHaveBeenCalled()
    })

    it('should have alert role and assertive aria-live for errors', () => {
      const error = new Error('Test error')
      const { container } = render(<LoadingScreen status="loading" error={error} />)
      const overlay = container.querySelector('[role="alert"]')
      expect(overlay).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for progress', () => {
      render(<LoadingScreen status="loading" progress={75} />)
      const progressElement = screen.getByText('75%')
      expect(progressElement).toHaveAttribute('aria-label', 'Прогресс загрузки: 75%')
    })

    it('should have proper aria-label for retry button', () => {
      const error = new Error('Test error')
      render(<LoadingScreen status="loading" error={error} onRetry={vi.fn()} />)
      const retryButton = screen.getByRole('button')
      expect(retryButton).toHaveAttribute('aria-label', 'Повторить попытку загрузки')
    })
  })

  describe('All status types', () => {
    const statuses: LoadingStatus[] = ['initializing', 'loading', 'parsing', 'indexing']

    statuses.forEach((status) => {
      it(`should render without errors for status: ${status}`, () => {
        const { container } = render(<LoadingScreen status={status} />)
        expect(container).toBeInTheDocument()
      })
    })
  })
})
