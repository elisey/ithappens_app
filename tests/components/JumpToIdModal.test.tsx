// ABOUTME: Comprehensive tests for JumpToIdModal component functionality
// ABOUTME: Tests modal behavior, validation, accessibility, and user interactions

import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JumpToIdModal } from '../../src/components/JumpToIdModal'

describe('JumpToIdModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onJump: vi.fn(),
    availableIds: [1, 2, 3, 5, 7, 10],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Rendering', () => {
    it('should not render when closed', () => {
      render(<JumpToIdModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      render(<JumpToIdModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Jump to Story ID')).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<JumpToIdModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')

      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'jump-modal-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'jump-modal-description')
    })

    it('should have proper form elements', () => {
      render(<JumpToIdModal {...defaultProps} />)

      expect(screen.getByLabelText('Story ID:')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter story ID...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Jump' })).toBeInTheDocument()
    })
  })

  describe('Input Validation', () => {
    it('should show error for empty input when submitted', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: 'Jump' })
      expect(submitButton).toBeDisabled()
    })

    it('should show error for invalid number input', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: 'abc' } })

      await waitFor(() => {
        expect(screen.getByText('ID must be a number')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Jump' })).toBeDisabled()
    })

    it('should show error for negative number', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '-5' } })

      await waitFor(() => {
        expect(screen.getByText('ID must be positive')).toBeInTheDocument()
      })
    })

    it('should show error for decimal number', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '3.5' } })

      await waitFor(() => {
        expect(screen.getByText('ID must be a whole number')).toBeInTheDocument()
      })
    })

    it('should show error for non-existent story ID', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '99' } })

      await waitFor(() => {
        expect(screen.getByText('Story with ID 99 does not exist')).toBeInTheDocument()
      })
    })

    it('should enable submit button for valid input', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '5' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Jump' })).toBeEnabled()
      })

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call onJump with correct ID when form is submitted', async () => {
      const onJump = vi.fn()
      render(<JumpToIdModal {...defaultProps} onJump={onJump} />)

      const input = screen.getByLabelText('Story ID:')
      const form = input.closest('form')!

      fireEvent.input(input, { target: { value: '5' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Jump' })).toBeEnabled()
      })

      fireEvent.submit(form)

      expect(onJump).toHaveBeenCalledWith(5)
    })

    it('should call onJump when submit button is clicked', async () => {
      const onJump = vi.fn()
      render(<JumpToIdModal {...defaultProps} onJump={onJump} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '3' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Jump' })).toBeEnabled()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Jump' }))

      expect(onJump).toHaveBeenCalledWith(3)
    })

    it('should not submit with invalid input', async () => {
      const onJump = vi.fn()
      render(<JumpToIdModal {...defaultProps} onJump={onJump} />)

      const input = screen.getByLabelText('Story ID:')
      const form = input.closest('form')!

      fireEvent.input(input, { target: { value: 'invalid' } })
      fireEvent.submit(form)

      expect(onJump).not.toHaveBeenCalled()
    })
  })

  describe('Modal Controls', () => {
    it('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn()
      render(<JumpToIdModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when close button (×) is clicked', () => {
      const onClose = vi.fn()
      render(<JumpToIdModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when overlay is clicked', () => {
      const onClose = vi.fn()
      render(<JumpToIdModal {...defaultProps} onClose={onClose} />)

      // Click the overlay (parent of dialog)
      const dialog = screen.getByRole('dialog')
      const overlay = dialog.parentElement!
      fireEvent.click(overlay)

      expect(onClose).toHaveBeenCalled()
    })

    it('should not close when modal content is clicked', () => {
      const onClose = vi.fn()
      render(<JumpToIdModal {...defaultProps} onClose={onClose} />)

      // Click the dialog content (should not close)
      const modal = screen.getByRole('dialog')
      fireEvent.click(modal)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(<JumpToIdModal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should submit form when Enter is pressed in input field', async () => {
      const onJump = vi.fn()
      render(<JumpToIdModal {...defaultProps} onJump={onJump} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '7' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Jump' })).toBeEnabled()
      })

      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onJump).toHaveBeenCalledWith(7)
    })

    it('should focus input when modal opens', async () => {
      const { rerender } = render(<JumpToIdModal {...defaultProps} isOpen={false} />)

      rerender(<JumpToIdModal {...defaultProps} isOpen={true} />)

      await waitFor(() => {
        expect(screen.getByLabelText('Story ID:')).toHaveFocus()
      })
    })
  })

  describe('State Management', () => {
    it('should clear input when modal is reopened', () => {
      const { rerender } = render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '123' } })

      expect(input).toHaveValue('123')

      // Close and reopen modal
      rerender(<JumpToIdModal {...defaultProps} isOpen={false} />)
      rerender(<JumpToIdModal {...defaultProps} isOpen={true} />)

      expect(screen.getByLabelText('Story ID:')).toHaveValue('')
    })

    it('should clear error when modal is reopened', async () => {
      const { rerender } = render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: 'invalid' } })

      await waitFor(() => {
        expect(screen.getByText('ID must be a number')).toBeInTheDocument()
      })

      // Close and reopen modal
      rerender(<JumpToIdModal {...defaultProps} isOpen={false} />)
      rerender(<JumpToIdModal {...defaultProps} isOpen={true} />)

      expect(screen.queryByText('ID must be a number')).not.toBeInTheDocument()
    })

    it('should show loading state during submission', async () => {
      // Mock a slow onJump function
      const onJump = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100))
      })

      render(<JumpToIdModal {...defaultProps} onJump={onJump} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '2' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Jump' })).toBeEnabled()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Jump' }))

      expect(screen.getByRole('button', { name: 'Jumping...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Jumping...' })).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty availableIds array', () => {
      render(<JumpToIdModal {...defaultProps} availableIds={[]} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '1' } })

      expect(screen.getByText('No stories available')).toBeInTheDocument()
    })

    it('should trim whitespace from input', async () => {
      const onJump = vi.fn()
      render(<JumpToIdModal {...defaultProps} onJump={onJump} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '  5  ' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Jump' })).toBeEnabled()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Jump' }))

      expect(onJump).toHaveBeenCalledWith(5)
    })

    it('should handle very large numbers', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: '999999999' } })

      await waitFor(() => {
        expect(screen.getByText('Story with ID 999999999 does not exist')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      expect(input).toHaveAttribute('aria-invalid', 'false')

      const errorRegion = screen.queryByRole('alert')
      expect(errorRegion).not.toBeInTheDocument()
    })

    it('should mark input as invalid when there is an error', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: 'invalid' } })

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input).toHaveAttribute('aria-describedby', 'error-message')
      })

      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveAttribute('id', 'error-message')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })

    it('should provide help text for disabled submit button', async () => {
      render(<JumpToIdModal {...defaultProps} />)

      const input = screen.getByLabelText('Story ID:')
      fireEvent.input(input, { target: { value: 'invalid' } })

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Jump' })
        expect(submitButton).toHaveAttribute('aria-describedby', 'submit-help')
        expect(screen.getByText('Please enter a valid story ID')).toBeInTheDocument()
      })
    })
  })
})
