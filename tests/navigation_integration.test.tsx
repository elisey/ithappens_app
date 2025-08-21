// Integration test to verify navigation is working correctly

import { screen, fireEvent, waitFor } from '@testing-library/preact'
import { expect, test } from 'vitest'
import {
  createMockStoryService,
  renderAppWithMocks,
  waitForStoryLoad,
  getNavigationButtons,
  cleanupMocks,
} from './utils/testHelpers'

test('should support both button and keyboard navigation', async () => {
  cleanupMocks()

  // Create mock service with custom data
  const mockService = createMockStoryService({
    '1': 'First story',
    '2': 'Second story',
    '3': 'Third story',
  })

  renderAppWithMocks({ storyService: mockService })

  // Wait for app to load
  await waitForStoryLoad('First story')

  // Test button navigation - next
  const { next: nextButton } = getNavigationButtons()
  fireEvent.click(nextButton)

  await waitForStoryLoad('Second story')
  expect(screen.getByText('ID: 2')).toBeInTheDocument()

  // Test button navigation - previous
  const { previous: prevButton } = getNavigationButtons()
  fireEvent.click(prevButton)

  await waitForStoryLoad('First story')
  expect(screen.getByText('ID: 1')).toBeInTheDocument()

  // Test keyboard navigation - arrow right
  fireEvent.keyDown(document, { key: 'ArrowRight' })

  await waitForStoryLoad('Second story')
  expect(screen.getByText('ID: 2')).toBeInTheDocument()

  // Test keyboard navigation - arrow left
  fireEvent.keyDown(document, { key: 'ArrowLeft' })

  await waitForStoryLoad('First story')
  expect(screen.getByText('ID: 1')).toBeInTheDocument()

  // Test circular navigation - go to last story
  fireEvent.click(prevButton)

  await waitFor(() => {
    expect(screen.getByText('Third story')).toBeInTheDocument()
    expect(screen.getByText('ID: 3')).toBeInTheDocument()
  })

  // Test circular navigation - go to first story from last
  fireEvent.click(nextButton)

  await waitFor(() => {
    expect(screen.getByText('First story')).toBeInTheDocument()
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })
})
