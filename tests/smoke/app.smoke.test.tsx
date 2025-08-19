// ABOUTME: Smoke test for basic app functionality and integration
// ABOUTME: Tests end-to-end functionality without complex mocking

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { App } from '../../src/app'

describe('App Smoke Test', () => {
  beforeEach(() => {
    // Mock fetch to provide test data
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        '1': 'Test story one',
        '2': 'Test story two',
        '3': 'Test story three'
      })
    })
  })

  it('should render the app without crashing', () => {
    expect(() => render(<App />)).not.toThrow()
  })

  it('should display app title', () => {
    render(<App />)
    expect(screen.getByText('ithappens')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    render(<App />)
    expect(screen.getByText('Загрузка истории...')).toBeInTheDocument()
  })

  it('should render navigation buttons', () => {
    render(<App />)
    expect(screen.getByText('← Назад')).toBeInTheDocument()
    expect(screen.getByText('Вперед →')).toBeInTheDocument()
    expect(screen.getByText(/ID:/)).toBeInTheDocument()
  })
})