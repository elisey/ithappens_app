// Integration test to verify navigation is working correctly

import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { expect, test, vi } from 'vitest'
import { App } from '../src/app'

test('should support both button and keyboard navigation', async () => {
  // Mock fetch for stories.json.sample
  // eslint-disable-next-line no-undef
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          '1': 'First story',
          '2': 'Second story',
          '3': 'Third story',
        }),
    })
  )

  render(<App />)

  // Wait for app to load
  await waitFor(() => {
    expect(screen.getByText('First story')).toBeInTheDocument()
  })

  // Test button navigation - next
  const nextButton = screen.getByLabelText('Next story')
  fireEvent.click(nextButton)

  await waitFor(() => {
    expect(screen.getByText('Second story')).toBeInTheDocument()
    expect(screen.getByText('ID: 2')).toBeInTheDocument()
  })

  // Test button navigation - previous
  const prevButton = screen.getByLabelText('Previous story')
  fireEvent.click(prevButton)

  await waitFor(() => {
    expect(screen.getByText('First story')).toBeInTheDocument()
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

  // Test keyboard navigation - arrow right
  fireEvent.keyDown(document, { key: 'ArrowRight' })

  await waitFor(() => {
    expect(screen.getByText('Second story')).toBeInTheDocument()
    expect(screen.getByText('ID: 2')).toBeInTheDocument()
  })

  // Test keyboard navigation - arrow left
  fireEvent.keyDown(document, { key: 'ArrowLeft' })

  await waitFor(() => {
    expect(screen.getByText('First story')).toBeInTheDocument()
    expect(screen.getByText('ID: 1')).toBeInTheDocument()
  })

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
