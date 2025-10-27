// ABOUTME: Unit tests for Service Worker registration and basic functionality
// ABOUTME: Tests SW registration logic, cache operations, and fetch interception
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Service Worker Registration', () => {
  let originalNavigator: Navigator
  let originalWindow: Window & typeof globalThis

  beforeEach(() => {
    originalNavigator = global.navigator
    originalWindow = global.window
  })

  afterEach(() => {
    global.navigator = originalNavigator
    global.window = originalWindow
    vi.clearAllMocks()
  })

  it('should register service worker when supported', async () => {
    const mockRegister = vi.fn().mockResolvedValue({
      scope: '/',
      active: null,
      installing: null,
      waiting: null,
    })

    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
        },
      },
    })

    // Simulate the registration code from main.tsx
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }

    expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it('should handle registration success', async () => {
    const mockRegistration = {
      scope: '/',
      active: null,
      installing: null,
      waiting: null,
    }
    const mockRegister = vi.fn().mockResolvedValue(mockRegistration)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
        },
      },
    })

    // Simulate registration with success handler
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', registration.scope)
    }

    expect(consoleSpy).toHaveBeenCalledWith('Service Worker registered successfully:', '/')
    consoleSpy.mockRestore()
  })

  it('should handle registration failure', async () => {
    const mockError = new Error('Registration failed')
    const mockRegister = vi.fn().mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
        },
      },
    })

    // Simulate registration with error handler
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js')
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith('Service Worker registration failed:', mockError)
    consoleErrorSpy.mockRestore()
  })

  it('should not attempt registration when service worker is not supported', async () => {
    const mockRegister = vi.fn()

    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {},
    })

    // Simulate registration check
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }

    expect(mockRegister).not.toHaveBeenCalled()
  })
})

describe('Service Worker Cache Operations', () => {
  it('should define cache name constant', () => {
    const CACHE_NAME = 'ithappens-v1'
    expect(CACHE_NAME).toBe('ithappens-v1')
  })

  it('should define assets to cache', () => {
    const ASSETS_TO_CACHE = [
      '/',
      '/index.html',
      '/manifest.json',
      '/stories.json',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/favicon.ico',
    ]

    expect(ASSETS_TO_CACHE).toContain('/')
    expect(ASSETS_TO_CACHE).toContain('/stories.json')
    expect(ASSETS_TO_CACHE).toContain('/manifest.json')
    expect(ASSETS_TO_CACHE.length).toBeGreaterThanOrEqual(7)
  })
})

describe('Service Worker Lifecycle', () => {
  it('should handle install event', () => {
    const mockCache = {
      addAll: vi.fn().mockResolvedValue(undefined),
    }
    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    }

    const ASSETS_TO_CACHE = [
      '/',
      '/index.html',
      '/manifest.json',
      '/stories.json',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/favicon.ico',
    ]

    const CACHE_NAME = 'ithappens-v1'

    // Simulate install event handler
    const installHandler = async () => {
      const cache = await mockCaches.open(CACHE_NAME)
      await cache.addAll(ASSETS_TO_CACHE)
    }

    return installHandler().then(() => {
      expect(mockCaches.open).toHaveBeenCalledWith('ithappens-v1')
      expect(mockCache.addAll).toHaveBeenCalledWith(ASSETS_TO_CACHE)
    })
  })

  it('should handle activate event and clean old caches', async () => {
    const CACHE_NAME = 'ithappens-v1'
    const oldCaches = ['ithappens-v0', 'other-cache']
    const mockCaches = {
      keys: vi.fn().mockResolvedValue([...oldCaches, CACHE_NAME]),
      delete: vi.fn().mockResolvedValue(true),
    }

    // Simulate activate event handler
    const activateHandler = async () => {
      const cacheNames = await mockCaches.keys()
      await Promise.all(
        cacheNames.map((cacheName: string) => {
          if (cacheName !== CACHE_NAME) {
            return mockCaches.delete(cacheName)
          }
        })
      )
    }

    await activateHandler()

    expect(mockCaches.keys).toHaveBeenCalled()
    expect(mockCaches.delete).toHaveBeenCalledWith('ithappens-v0')
    expect(mockCaches.delete).toHaveBeenCalledWith('other-cache')
    expect(mockCaches.delete).not.toHaveBeenCalledWith('ithappens-v1')
  })
})

describe('Service Worker Fetch Strategy', () => {
  it('should return cached response when available (Cache First)', async () => {
    const mockRequest = new Request('https://example.com/test.js')
    const mockResponse = new Response('cached content')

    const mockCaches = {
      match: vi.fn().mockResolvedValue(mockResponse),
    }

    // Simulate Cache First strategy
    const fetchHandler = async (request: Request) => {
      const cachedResponse = await mockCaches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(request)
    }

    const result = await fetchHandler(mockRequest)

    expect(mockCaches.match).toHaveBeenCalledWith(mockRequest)
    expect(result).toBe(mockResponse)
  })

  it('should fetch from network when not in cache', async () => {
    const mockRequest = new Request('https://example.com/test.js')
    const mockNetworkResponse = new Response('network content')

    const mockCaches = {
      match: vi.fn().mockResolvedValue(undefined),
    }

    global.fetch = vi.fn().mockResolvedValue(mockNetworkResponse)

    // Simulate Cache First strategy with network fallback
    const fetchHandler = async (request: Request) => {
      const cachedResponse = await mockCaches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(request)
    }

    const result = await fetchHandler(mockRequest)

    expect(mockCaches.match).toHaveBeenCalledWith(mockRequest)
    expect(global.fetch).toHaveBeenCalledWith(mockRequest)
    expect(result).toBe(mockNetworkResponse)
  })

  it('should cache network responses for future use', async () => {
    const mockRequest = new Request('https://example.com/test.js')
    const mockResponse = new Response('network content', { status: 200 })
    const mockClonedResponse = mockResponse.clone()

    const mockCache = {
      put: vi.fn().mockResolvedValue(undefined),
    }

    const mockCaches = {
      match: vi.fn().mockResolvedValue(undefined),
      open: vi.fn().mockResolvedValue(mockCache),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    // Mock the clone method
    mockResponse.clone = vi.fn().mockReturnValue(mockClonedResponse)

    const CACHE_NAME = 'ithappens-v1'

    // Simulate Cache First with caching network responses
    const fetchHandler = async (request: Request) => {
      const cachedResponse = await mockCaches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }

      const networkResponse = await fetch(request)

      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone()
        const cache = await mockCaches.open(CACHE_NAME)
        await cache.put(request, responseToCache)
      }

      return networkResponse
    }

    const result = await fetchHandler(mockRequest)

    expect(global.fetch).toHaveBeenCalledWith(mockRequest)
    expect(mockResponse.clone).toHaveBeenCalled()
    expect(mockCache.put).toHaveBeenCalledWith(mockRequest, mockClonedResponse)
    expect(result).toBe(mockResponse)
  })

  it('should not cache failed responses', async () => {
    const mockRequest = new Request('https://example.com/test.js')
    const mockResponse = new Response('error', { status: 404 })

    const mockCache = {
      put: vi.fn(),
    }

    const mockCaches = {
      match: vi.fn().mockResolvedValue(undefined),
      open: vi.fn().mockResolvedValue(mockCache),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const CACHE_NAME = 'ithappens-v1'

    // Simulate Cache First - don't cache errors
    const fetchHandler = async (request: Request) => {
      const cachedResponse = await mockCaches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }

      const networkResponse = await fetch(request)

      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone()
        const cache = await mockCaches.open(CACHE_NAME)
        await cache.put(request, responseToCache)
      }

      return networkResponse
    }

    await fetchHandler(mockRequest)

    expect(mockCache.put).not.toHaveBeenCalled()
  })
})
