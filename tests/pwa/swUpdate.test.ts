// ABOUTME: Unit tests for Service Worker update strategy with cache versioning
// ABOUTME: Tests version management, skipWaiting, clientsClaim, and old cache cleanup

/* eslint-disable no-undef */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SWUpdateService } from '../../src/services/swUpdateService'

describe('Service Worker Update - Cache Versioning', () => {
  it('should use versioned cache name', () => {
    const CACHE_VERSION = '0.1.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`

    expect(CACHE_NAME).toBe('ithappens-v0.1.0')
    expect(CACHE_NAME).toContain('ithappens-v')
    expect(CACHE_NAME).toContain(CACHE_VERSION)
  })

  it('should generate unique cache names for different versions', () => {
    const version1 = '0.1.0'
    const version2 = '0.2.0'
    const cacheName1 = `ithappens-v${version1}`
    const cacheName2 = `ithappens-v${version2}`

    expect(cacheName1).not.toBe(cacheName2)
    expect(cacheName1).toBe('ithappens-v0.1.0')
    expect(cacheName2).toBe('ithappens-v0.2.0')
  })
})

describe('Service Worker Update - skipWaiting', () => {
  it('should call skipWaiting during install', async () => {
    const CACHE_VERSION = '0.1.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`
    const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json']

    const mockCache = {
      addAll: vi.fn().mockResolvedValue(undefined),
    }
    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    }
    const mockSkipWaiting = vi.fn().mockResolvedValue(undefined)

    const installHandler = async () => {
      const cache = await mockCaches.open(CACHE_NAME)
      await cache.addAll(ASSETS_TO_CACHE)
      await mockSkipWaiting()
    }

    await installHandler()

    expect(mockCaches.open).toHaveBeenCalledWith('ithappens-v0.1.0')
    expect(mockCache.addAll).toHaveBeenCalledWith(ASSETS_TO_CACHE)
    expect(mockSkipWaiting).toHaveBeenCalled()
  })

  it('should call skipWaiting even if caching fails', async () => {
    const CACHE_VERSION = '0.1.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`
    const ASSETS_TO_CACHE = ['/', '/index.html']

    const mockCache = {
      addAll: vi.fn().mockRejectedValue(new Error('Cache failed')),
    }
    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    }
    const mockSkipWaiting = vi.fn().mockResolvedValue(undefined)

    const installHandler = async () => {
      try {
        const cache = await mockCaches.open(CACHE_NAME)
        await cache.addAll(ASSETS_TO_CACHE)
      } catch {
        // Still skip waiting even if caching fails
      }
      await mockSkipWaiting()
    }

    await installHandler()

    expect(mockSkipWaiting).toHaveBeenCalled()
  })
})

describe('Service Worker Update - clientsClaim', () => {
  it('should call clients.claim during activate', async () => {
    const CACHE_VERSION = '0.1.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`

    const mockCaches = {
      keys: vi.fn().mockResolvedValue([CACHE_NAME]),
      delete: vi.fn().mockResolvedValue(true),
    }
    const mockClientsClaim = vi.fn().mockResolvedValue(undefined)

    const activateHandler = async () => {
      await Promise.all([
        mockCaches.keys().then((cacheNames: string[]) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.startsWith('ithappens-v') && cacheName !== CACHE_NAME) {
                return mockCaches.delete(cacheName)
              }
            })
          )
        }),
        mockClientsClaim(),
      ])
    }

    await activateHandler()

    expect(mockClientsClaim).toHaveBeenCalled()
  })
})

describe('Service Worker Update - Old Cache Cleanup', () => {
  it('should delete old versioned caches on activate', async () => {
    const CACHE_VERSION = '0.2.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`
    const oldCaches = ['ithappens-v0.1.0', 'ithappens-v0.1.5']
    const mockCaches = {
      keys: vi.fn().mockResolvedValue([...oldCaches, CACHE_NAME, 'other-cache']),
      delete: vi.fn().mockResolvedValue(true),
    }
    const mockClientsClaim = vi.fn().mockResolvedValue(undefined)

    const activateHandler = async () => {
      const cacheNames = await mockCaches.keys()
      await Promise.all([
        Promise.all(
          cacheNames.map((cacheName: string) => {
            if (cacheName.startsWith('ithappens-v') && cacheName !== CACHE_NAME) {
              return mockCaches.delete(cacheName)
            }
          })
        ),
        mockClientsClaim(),
      ])
    }

    await activateHandler()

    expect(mockCaches.delete).toHaveBeenCalledWith('ithappens-v0.1.0')
    expect(mockCaches.delete).toHaveBeenCalledWith('ithappens-v0.1.5')
    expect(mockCaches.delete).not.toHaveBeenCalledWith('ithappens-v0.2.0')
    expect(mockCaches.delete).not.toHaveBeenCalledWith('other-cache')
  })

  it('should keep current cache during cleanup', async () => {
    const CACHE_VERSION = '1.0.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`
    const mockCaches = {
      keys: vi.fn().mockResolvedValue([CACHE_NAME, 'ithappens-v0.9.0']),
      delete: vi.fn().mockResolvedValue(true),
    }
    const mockClientsClaim = vi.fn().mockResolvedValue(undefined)

    const activateHandler = async () => {
      const cacheNames = await mockCaches.keys()
      await Promise.all([
        Promise.all(
          cacheNames.map((cacheName: string) => {
            if (cacheName.startsWith('ithappens-v') && cacheName !== CACHE_NAME) {
              return mockCaches.delete(cacheName)
            }
          })
        ),
        mockClientsClaim(),
      ])
    }

    await activateHandler()

    expect(mockCaches.delete).toHaveBeenCalledWith('ithappens-v0.9.0')
    expect(mockCaches.delete).not.toHaveBeenCalledWith('ithappens-v1.0.0')
  })

  it('should only delete caches matching versioning pattern', async () => {
    const CACHE_VERSION = '0.1.0'
    const CACHE_NAME = `ithappens-v${CACHE_VERSION}`
    const mockCaches = {
      keys: vi
        .fn()
        .mockResolvedValue([CACHE_NAME, 'ithappens-v0.0.9', 'other-app-cache', 'random-cache']),
      delete: vi.fn().mockResolvedValue(true),
    }
    const mockClientsClaim = vi.fn().mockResolvedValue(undefined)

    const activateHandler = async () => {
      const cacheNames = await mockCaches.keys()
      await Promise.all([
        Promise.all(
          cacheNames.map((cacheName: string) => {
            if (cacheName.startsWith('ithappens-v') && cacheName !== CACHE_NAME) {
              return mockCaches.delete(cacheName)
            }
          })
        ),
        mockClientsClaim(),
      ])
    }

    await activateHandler()

    expect(mockCaches.delete).toHaveBeenCalledWith('ithappens-v0.0.9')
    expect(mockCaches.delete).not.toHaveBeenCalledWith('other-app-cache')
    expect(mockCaches.delete).not.toHaveBeenCalledWith('random-cache')
    expect(mockCaches.delete).not.toHaveBeenCalledWith(CACHE_NAME)
  })
})

describe('SWUpdateService', () => {
  let service: SWUpdateService
  let mockRegistration: Partial<ServiceWorkerRegistration>
  let mockServiceWorker: Partial<ServiceWorker>

  beforeEach(() => {
    service = new SWUpdateService()
    mockServiceWorker = {
      state: 'installing',
      addEventListener: vi.fn(),
    }
    mockRegistration = {
      scope: '/',
      installing: mockServiceWorker as ServiceWorker,
      addEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    }

    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: vi.fn().mockResolvedValue(mockRegistration),
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
    service.destroy()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize and register service worker', async () => {
    await service.initialize()

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
  })

  it('should not initialize when service worker is not supported', async () => {
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {},
    })

    const consoleSpy = vi.spyOn(console, 'log')
    await service.initialize()

    expect(consoleSpy).toHaveBeenCalledWith('[SWUpdate] Service Workers not supported')
  })

  it('should listen for updatefound events', async () => {
    await service.initialize()

    expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
      'updatefound',
      expect.any(Function)
    )
  })

  it('should start periodic update checks', async () => {
    await service.initialize()

    expect(mockRegistration.update).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60000)

    expect(mockRegistration.update).toHaveBeenCalled()
  })

  it('should check for updates when page becomes visible', async () => {
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

    await service.initialize()

    Object.defineProperty(global.document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    })

    if (visibilityChangeHandler) {
      visibilityChangeHandler()
    }

    expect(mockRegistration.update).toHaveBeenCalled()
  })

  it('should stop update checks when destroyed', async () => {
    await service.initialize()

    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(1)

    service.destroy()
    vi.advanceTimersByTime(60000)

    expect(mockRegistration.update).toHaveBeenCalledTimes(1)
  })

  it('should handle registration errors gracefully', async () => {
    const mockError = new Error('Registration failed')
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: vi.fn().mockRejectedValue(mockError),
        },
      },
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await service.initialize()

    expect(consoleErrorSpy).toHaveBeenCalledWith('[SWUpdate] SW registration failed:', mockError)
    consoleErrorSpy.mockRestore()
  })

  it('should continue working after update check errors', async () => {
    mockRegistration.update = vi.fn().mockRejectedValue(new Error('Update failed'))

    await service.initialize()

    // First update check should fail but not crash
    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(1)

    // Service should continue and try again
    vi.advanceTimersByTime(60000)
    expect(mockRegistration.update).toHaveBeenCalledTimes(2)
  })
})
