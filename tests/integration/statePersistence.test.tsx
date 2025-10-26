// ABOUTME: Integration tests for state persistence functionality
// ABOUTME: Tests saving and restoring story IDs across app sessions

import { render, screen, waitFor, fireEvent } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { App } from '../../src/app'
import { useStoryService } from '../../src/hooks/useStoryService'
import { storageService } from '../../src/services/storageService'
import {
  createMockStoryService,
  createMockStoriesData,
  waitForStoryLoad,
  cleanupMocks,
  getNavigationButtons,
} from '../utils/testHelpers'

// Mock the useStoryService hook
vi.mock('../../src/hooks/useStoryService')

// Create test data with multiple stories
const testData = createMockStoriesData({
  '2': 'Story 2 content',
  '3': 'Story 3 content',
  '4': 'Story 4 content',
  '5': 'Story 5 content',
  '6': 'Story 6 content',
  '7': 'Story 7 content',
  '8': 'Story 8 content',
  '9': 'Story 9 content',
  '10': 'Story 10 content',
  '11': 'Story 11 content',
  '12': 'Story 12 content',
})

describe('State Persistence Integration', () => {
  let mockService: ReturnType<typeof createMockStoryService>

  beforeEach(async () => {
    localStorage.clear()
    sessionStorage.clear()
    cleanupMocks()
    vi.clearAllMocks()

    // Create and initialize mock service
    mockService = createMockStoryService(testData)
    await mockService.initialize()

    // Mock the useStoryService hook
    vi.mocked(useStoryService).mockReturnValue({
      service: mockService,
      isLoading: false,
      loadingStatus: null,
      error: null,
      retry: vi.fn(),
      progress: undefined,
    })
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Initial Launch', () => {
    test('shows first story on initial launch (no saved state)', async () => {
      render(<App />)

      // Wait for story to load
      await waitForStoryLoad()

      // Verify first story is displayed
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Navigation and Saving', () => {
    test('saves current story ID on navigation', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitForStoryLoad()

      // Navigate to next story
      const { next } = getNavigationButtons()
      await user.click(next)

      await waitForStoryLoad()

      // Wait for save to complete
      await waitFor(
        async () => {
          const savedId = await storageService.getLastStoryId()
          expect(savedId).toBe(2)
        },
        { timeout: 2000 }
      )

      // Verify story 2 is displayed
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
    })

    test('updates saved ID multiple times during navigation', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitForStoryLoad()

      const { next } = getNavigationButtons()

      // Navigate to story 2
      await user.click(next)
      await waitForStoryLoad()
      await waitFor(async () => {
        const id = await storageService.getLastStoryId()
        expect(id).toBe(2)
      })

      // Navigate to story 3
      await user.click(next)
      await waitForStoryLoad()
      await waitFor(async () => {
        const id = await storageService.getLastStoryId()
        expect(id).toBe(3)
      })

      // Navigate to story 4
      await user.click(next)
      await waitForStoryLoad()
      await waitFor(async () => {
        const id = await storageService.getLastStoryId()
        expect(id).toBe(4)
      })

      // Verify final state
      expect(screen.getByText('ID: 4')).toBeInTheDocument()
    })
  })

  describe('State Restoration', () => {
    test('restores last story on app restart', async () => {
      // First render: navigate and save
      const { unmount } = render(<App />)

      await waitForStoryLoad()

      const { next } = getNavigationButtons()

      // Navigate to story 5
      for (let i = 0; i < 4; i++) {
        fireEvent.click(next)
        await waitForStoryLoad()
      }

      // Wait for final save
      await waitFor(async () => {
        const savedId = await storageService.getLastStoryId()
        expect(savedId).toBe(5)
      })

      expect(screen.getByText('ID: 5')).toBeInTheDocument()

      // Unmount (simulate closing app)
      unmount()

      // Second render: should restore saved story
      render(<App />)

      await waitForStoryLoad()

      // Verify story 5 is restored
      expect(screen.getByText('ID: 5')).toBeInTheDocument()
      const restoredId = await storageService.getLastStoryId()
      expect(restoredId).toBe(5)
    })

    test('handles invalid saved story ID gracefully', async () => {
      // Manually save an invalid ID
      await storageService.setLastStoryId(999999)

      render(<App />)

      await waitForStoryLoad()

      // Should fallback to first story (not crash)
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    test('handles corrupted storage data', async () => {
      // Corrupt the storage
      localStorage.setItem('ithappens_last_story_id', 'corrupted{json')

      render(<App />)

      await waitForStoryLoad()

      // Should fallback to first story
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Storage Failures', () => {
    test('works without localStorage (fallback)', async () => {
      // Mock localStorage to be unavailable
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      render(<App />)

      await waitForStoryLoad()

      // Should still render (using memory fallback)
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Navigation should still work
      const user = userEvent.setup()
      const { next } = getNavigationButtons()
      await user.click(next)

      await waitForStoryLoad()

      // App should not crash
      expect(screen.getByRole('main')).toBeInTheDocument()

      mockGetItem.mockRestore()
      mockSetItem.mockRestore()
    })

    test('does not block UI on save failures', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitForStoryLoad()

      // Mock save to fail
      const mockSetItem = vi
        .spyOn(storageService, 'setLastStoryId')
        .mockRejectedValue(new Error('Save failed'))

      const { next } = getNavigationButtons()
      await user.click(next)

      await waitForStoryLoad()

      // UI should update immediately (not wait for save)
      // Story should change even though save failed
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()

      mockSetItem.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    test('does not save during initialization', async () => {
      const saveSpy = vi.spyOn(storageService, 'setLastStoryId')

      render(<App />)

      await waitForStoryLoad()

      // Should only save once after initialization completes (or not at all on first load)
      const callsDuringInit = saveSpy.mock.calls.length
      expect(callsDuringInit).toBeLessThanOrEqual(1)

      saveSpy.mockRestore()
    })

    test('handles rapid navigation without race conditions', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitForStoryLoad()

      const { next } = getNavigationButtons()

      // Rapid clicks
      await user.tripleClick(next)

      // Should handle gracefully without crashes
      await waitFor(async () => {
        const savedId = await storageService.getLastStoryId()
        expect(savedId).not.toBeNull()
      })

      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Full User Journey', () => {
    test('complete persistence flow', async () => {
      // Step 1: First launch - no saved state
      const { unmount: unmount1 } = render(<App />)

      await waitForStoryLoad()

      const initialId = await storageService.getLastStoryId()
      expect(initialId).toBeNull()

      // Step 2: Navigate to story 10
      const { next } = getNavigationButtons()

      for (let i = 0; i < 9; i++) {
        fireEvent.click(next)
        await waitForStoryLoad()
      }

      await waitFor(async () => {
        const savedId = await storageService.getLastStoryId()
        expect(savedId).toBe(10)
      })

      expect(screen.getByText('ID: 10')).toBeInTheDocument()

      unmount1()

      // Step 3: Reopen app - should restore
      const { unmount: unmount2 } = render(<App />)

      await waitForStoryLoad()

      expect(screen.getByText('ID: 10')).toBeInTheDocument()
      const restoredId = await storageService.getLastStoryId()
      expect(restoredId).toBe(10)

      unmount2()

      // Step 4: Clear storage manually
      await storageService.clear()

      // Step 5: Reopen - should be like first launch
      render(<App />)

      await waitForStoryLoad()

      const clearedId = await storageService.getLastStoryId()
      expect(clearedId).toBeNull()

      // Should show first story again
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})
