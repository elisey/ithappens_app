// ABOUTME: Unit tests for FeedbackToast component
// ABOUTME: Tests toast notifications, auto-dismiss, and ARIA attributes

import { render, screen, waitFor } from '@testing-library/preact'
import { describe, test, expect, vi } from 'vitest'
import { FeedbackToast, useToast } from '../../src/components/FeedbackToast'

describe('FeedbackToast', () => {
  test('renders toast message', () => {
    render(<FeedbackToast message="Test message" />)

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  test('renders info type by default', () => {
    const { container } = render(<FeedbackToast message="Info message" />)

    const toast = container.querySelector('[role="status"]')
    expect(toast).toBeInTheDocument()
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  test('renders success type', () => {
    const { container } = render(<FeedbackToast message="Success!" type="success" />)

    expect(screen.getByText('Success!')).toBeInTheDocument()
    const toast = container.querySelector('[role="status"]')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  test('renders error type with assertive aria-live', () => {
    const { container } = render(<FeedbackToast message="Error!" type="error" />)

    expect(screen.getByText('Error!')).toBeInTheDocument()
    const toast = container.querySelector('[role="status"]')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  test('auto-dismisses after duration', async () => {
    const onClose = vi.fn()
    render(<FeedbackToast message="Auto dismiss" duration={100} onClose={onClose} />)

    expect(screen.getByText('Auto dismiss')).toBeInTheDocument()

    // Wait for auto-dismiss
    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled()
      },
      { timeout: 500 }
    )
  })

  test('renders at bottom position by default', () => {
    const { container } = render(<FeedbackToast message="Bottom toast" />)

    const toastContainer = container.firstElementChild
    // Class name includes CSS module hash
    expect(toastContainer?.className).toContain('bottom')
  })

  test('renders at top position when specified', () => {
    const { container } = render(<FeedbackToast message="Top toast" position="top" />)

    const toastContainer = container.firstElementChild
    // Class name includes CSS module hash
    expect(toastContainer?.className).toContain('top')
  })

  test('does not auto-dismiss when duration is 0', async () => {
    const onClose = vi.fn()
    render(<FeedbackToast message="No dismiss" duration={0} onClose={onClose} />)

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('useToast hook', () => {
  test('showToast sets toast state', async () => {
    let hookResult: ReturnType<typeof useToast>

    function TestComponent() {
      hookResult = useToast()
      return <div>{hookResult.toast && <div>Toast: {hookResult.toast.message}</div>}</div>
    }

    const { rerender } = render(<TestComponent />)

    expect(hookResult!.toast).toBeNull()

    hookResult!.showToast({ message: 'Test', type: 'info' })

    // Re-render to trigger state update
    rerender(<TestComponent />)

    await waitFor(() => {
      expect(hookResult!.toast).toEqual({
        message: 'Test',
        type: 'info',
      })
    })
  })

  test('hideToast clears toast state', async () => {
    let hookResult: ReturnType<typeof useToast>

    function TestComponent() {
      hookResult = useToast()
      return <div>{hookResult.toast && <div>Toast: {hookResult.toast.message}</div>}</div>
    }

    const { rerender } = render(<TestComponent />)

    hookResult!.showToast({ message: 'Test', type: 'info' })
    rerender(<TestComponent />)

    await waitFor(() => {
      expect(hookResult!.toast).not.toBeNull()
    })

    hookResult!.hideToast()
    rerender(<TestComponent />)

    await waitFor(() => {
      expect(hookResult!.toast).toBeNull()
    })
  })
})
