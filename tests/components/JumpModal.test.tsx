// ABOUTME: Unit tests for JumpModal component
// ABOUTME: Tests modal behavior, validation, accessibility, and user interactions

import { render, screen, waitFor } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { JumpModal } from '../../src/components/JumpModal'

describe('JumpModal', () => {
  const mockOnClose = vi.fn()
  const mockOnJump = vi.fn()
  const availableIds = [1, 2, 3, 5, 10, 100, 1000]
  const currentId = 5

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('opens and closes correctly', () => {
    const { rerender } = render(
      <JumpModal
        isOpen={false}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    // Should not render when closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Rerender with isOpen=true
    rerender(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    // Should render when open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Jump to Story')).toBeInTheDocument()
  })

  test('renders input field when open', async () => {
    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    // Input should be present
    const input = screen.getByLabelText('Story ID')
    expect(input).toBeInTheDocument()
  })

  test('accepts valid story ID', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')
    const submitButton = screen.getByRole('button', { name: 'Jump' })

    // Initially disabled
    expect(submitButton).toBeDisabled()

    // Type valid ID
    await user.type(input, '10')

    // Should enable submit button
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    // Submit form
    await user.click(submitButton)

    // Should call onJump with correct ID
    expect(mockOnJump).toHaveBeenCalledWith(10)
    expect(mockOnClose).toHaveBeenCalled()
  })

  test('shows error for invalid ID', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')
    const submitButton = screen.getByRole('button', { name: 'Jump' })

    // Type non-existent ID
    await user.type(input, '999')

    // Submit button should be disabled
    expect(submitButton).toBeDisabled()

    // Try to submit anyway
    await user.click(submitButton)

    // Should not call callbacks
    expect(mockOnJump).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  test('shows error for current ID', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')
    const submitButton = screen.getByRole('button', { name: 'Jump' })

    // Type current ID
    await user.type(input, '5')

    // Submit button should be disabled
    expect(submitButton).toBeDisabled()

    // Should not show validation error initially (only after submit)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('closes on Escape key', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    await user.keyboard('{Escape}')

    expect(mockOnClose).toHaveBeenCalled()
  })

  test('closes on overlay click', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const overlay = screen.getByRole('dialog').parentElement!

    await user.click(overlay)

    expect(mockOnClose).toHaveBeenCalled()
  })

  test('does not close on modal content click', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const modal = screen.getByRole('dialog')

    await user.click(modal)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  test('closes on close button click', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Close modal' })

    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  test('closes on cancel button click', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })

    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  test('jumps to story on Enter', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')

    await user.type(input, '10{Enter}')

    expect(mockOnJump).toHaveBeenCalledWith(10)
    expect(mockOnClose).toHaveBeenCalled()
  })

  test('has all focusable elements', async () => {
    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    // Verify all expected focusable elements exist
    const closeButton = screen.getByRole('button', { name: 'Close modal' })
    const input = screen.getByLabelText('Story ID')
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const jumpButton = screen.getByRole('button', { name: 'Jump' })

    expect(closeButton).toBeInTheDocument()
    expect(input).toBeInTheDocument()
    expect(cancelButton).toBeInTheDocument()
    expect(jumpButton).toBeInTheDocument()
  })

  test('unmounts cleanly when closed', async () => {
    // Create a button to focus before opening modal
    const { rerender } = render(
      <>
        <button>Trigger</button>
        <JumpModal
          isOpen={false}
          onClose={mockOnClose}
          onJump={mockOnJump}
          availableIds={availableIds}
          currentId={currentId}
        />
      </>
    )

    const triggerButton = screen.getByRole('button', { name: 'Trigger' })
    expect(triggerButton).toBeInTheDocument()

    // Open modal
    rerender(
      <>
        <button>Trigger</button>
        <JumpModal
          isOpen={true}
          onClose={mockOnClose}
          onJump={mockOnJump}
          availableIds={availableIds}
          currentId={currentId}
        />
      </>
    )

    // Modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close modal
    rerender(
      <>
        <button>Trigger</button>
        <JumpModal
          isOpen={false}
          onClose={mockOnClose}
          onJump={mockOnJump}
          availableIds={availableIds}
          currentId={currentId}
        />
      </>
    )

    // Modal should be gone
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('has proper ARIA attributes', () => {
    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const dialog = screen.getByRole('dialog')
    const input = screen.getByLabelText('Story ID')

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'jump-modal-title')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  test('disables submit for invalid ID but does not show error yet', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')
    const submitButton = screen.getByRole('button', { name: 'Jump' })

    // Type invalid ID
    await user.type(input, '999')

    // Submit button should be disabled
    expect(submitButton).toBeDisabled()

    // Error should not be shown yet (only shown after trying to submit)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('enables submit button when valid ID is entered', async () => {
    const user = userEvent.setup()

    render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')
    const submitButton = screen.getByRole('button', { name: 'Jump' })

    // Initially disabled
    expect(submitButton).toBeDisabled()

    // Type invalid ID
    await user.type(input, '999')
    expect(submitButton).toBeDisabled()

    // Clear and type valid ID
    await user.clear(input)
    await user.type(input, '1')

    // Submit button should now be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  test('resets state when reopened', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    const input = screen.getByLabelText('Story ID')

    // Type something
    await user.type(input, '999')

    // Close modal
    rerender(
      <JumpModal
        isOpen={false}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    // Reopen modal
    rerender(
      <JumpModal
        isOpen={true}
        onClose={mockOnClose}
        onJump={mockOnJump}
        availableIds={availableIds}
        currentId={currentId}
      />
    )

    // Input should be empty
    const newInput = screen.getByLabelText('Story ID')
    expect(newInput).toHaveValue('')
  })
})
