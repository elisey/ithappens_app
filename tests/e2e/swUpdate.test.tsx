// ABOUTME: Integration tests for Service Worker update flow
// ABOUTME: Tests end-to-end update scenarios with swUpdateService

/* eslint-disable no-undef */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { swUpdateService } from '../../src/services/swUpdateService'

describe('Service Worker Update Flow - Integration', () => {
  let mockRegistration: Partial<ServiceWorkerRegistration>
  let mockServiceWorker: Partial<ServiceWorker>
  let mockRegister: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockServiceWorker = {
      state: 'installing',
      addEventListener: vi.fn(),
    }

    mockRegistration = {
      scope: '/',
      installing: mockServiceWorker as ServiceWorker,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    }

    mockRegister = vi.fn().mockResolvedValue(mockRegistration)

    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
        },
      },
    })

    Object.defineProperty(global, 'document', {
      writable: true,
      configurable: true,
      value: {
        hidden: false,
        addEventListener: vi.fn(),
      },
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    swUpdateService.destroy()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should register service worker on initialization', async () => {
    await swUpdateService.initialize()

    expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it('should detect and handle service worker updates', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    let updateFoundHandler: (() => void) | null = null

    mockRegistration.addEventListener = vi.fn((event, handler) => {
      if (event === 'updatefound') {
        updateFoundHandler = handler as () => void
      }
    })

    await swUpdateService.initialize()

    expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
      'updatefound',
      expect.any(Function)
    )

    if (updateFoundHandler) {
      updateFoundHandler()
    }

    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] Update found, new worker installing')
  })

  it('should notify when new service worker activates', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    let updateFoundHandler: (() => void) | null = null
    let stateChangeHandler: (() => void) | null = null

    mockRegistration.addEventListener = vi.fn((event, handler) => {
      if (event === 'updatefound') {
        updateFoundHandler = handler as () => void
      }
    })

    mockServiceWorker.addEventListener = vi.fn((event, handler) => {
      if (event === 'statechange') {
        stateChangeHandler = handler as () => void
      }
    })

    await swUpdateService.initialize()

    if (updateFoundHandler) {
      updateFoundHandler()
    }

    mockServiceWorker.state = 'activated'

    if (stateChangeHandler) {
      stateChangeHandler()
    }

    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] New version available and activated!')
  })

  it('should periodically check for updates', async () => {
    await swUpdateService.initialize()

    expect(mockRegistration.update).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(3)
  })

  it('should check for updates when page regains visibility', async () => {
    let visibilityChangeHandler: (() => void) | null = null

    Object.defineProperty(global, 'document', {
      writable: true,
      configurable: true,
      value: {
        hidden: true,
        addEventListener: vi.fn((event, handler) => {
          if (event === 'visibilitychange') {
            visibilityChangeHandler = handler
          }
        }),
      },
    })

    await swUpdateService.initialize()

    expect(mockRegistration.update).not.toHaveBeenCalled()

    Object.defineProperty(global.document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    })

    if (visibilityChangeHandler) {
      visibilityChangeHandler()
    }

    expect(mockRegistration.update).toHaveBeenCalledTimes(1)
  })

  it('should not check for updates when page becomes hidden', async () => {
    let visibilityChangeHandler: (() => void) | null = null

    Object.defineProperty(global, 'document', {
      writable: true,
      configurable: true,
      value: {
        hidden: false,
        addEventListener: vi.fn((event, handler) => {
          if (event === 'visibilitychange') {
            visibilityChangeHandler = handler
          }
        }),
      },
    })

    await swUpdateService.initialize()

    Object.defineProperty(global.document, 'hidden', {
      writable: true,
      configurable: true,
      value: true,
    })

    if (visibilityChangeHandler) {
      visibilityChangeHandler()
    }

    expect(mockRegistration.update).not.toHaveBeenCalled()
  })

  it('should handle complete update lifecycle', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    let updateFoundHandler: (() => void) | null = null
    let stateChangeHandler: (() => void) | null = null

    mockRegistration.addEventListener = vi.fn((event, handler) => {
      if (event === 'updatefound') {
        updateFoundHandler = handler as () => void
      }
    })

    mockServiceWorker.addEventListener = vi.fn((event, handler) => {
      if (event === 'statechange') {
        stateChangeHandler = handler as () => void
      }
    })

    await swUpdateService.initialize()

    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] SW registered:', '/')

    if (updateFoundHandler) {
      updateFoundHandler()
    }
    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] Update found, new worker installing')

    mockServiceWorker.state = 'installing'
    if (stateChangeHandler) {
      stateChangeHandler()
    }
    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] New worker state:', 'installing')

    mockServiceWorker.state = 'installed'
    if (stateChangeHandler) {
      stateChangeHandler()
    }
    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] New worker state:', 'installed')

    mockServiceWorker.state = 'activating'
    if (stateChangeHandler) {
      stateChangeHandler()
    }
    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] New worker state:', 'activating')

    mockServiceWorker.state = 'activated'
    if (stateChangeHandler) {
      stateChangeHandler()
    }
    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] New worker state:', 'activated')
    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] New version available and activated!')
  })

  it('should clean up update checks on destroy', async () => {
    await swUpdateService.initialize()

    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(1)

    swUpdateService.destroy()

    vi.advanceTimersByTime(120000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(1)
  })

  it('should handle missing registration gracefully during destroy', () => {
    expect(() => swUpdateService.destroy()).not.toThrow()
  })

  it('should handle registration errors and continue', async () => {
    const mockError = new Error('Registration failed')
    mockRegister.mockRejectedValueOnce(mockError)

    const consoleErrorSpy = vi.spyOn(console, 'error')

    await swUpdateService.initialize()

    expect(consoleErrorSpy).toHaveBeenCalledWith('[SWUpdate] SW registration failed:', mockError)

    vi.advanceTimersByTime(60000)
  })
})
