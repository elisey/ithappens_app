// ABOUTME: Service Worker for offline support with Cache First strategy
// ABOUTME: Caches all static assets and stories.json with versioned cache management

// Version the cache - automatically updated by build script
const CACHE_VERSION = '0.1.0-e25fda0-1761590878455'
const CACHE_NAME = `ithappens-v${CACHE_VERSION}`

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/stories.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
]

// Install event - cache all assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION)
  console.log('[SW] Cache name:', CACHE_NAME)

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell and content for version:', CACHE_VERSION)
        console.log('[SW] Assets to cache:', ASSETS_TO_CACHE)
        return cache.addAll(ASSETS_TO_CACHE)
      })
      .then(() => {
        console.log('[SW] All assets cached successfully for version:', CACHE_VERSION)
        console.log('[SW] Skipping waiting phase to activate immediately')
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets for version:', CACHE_VERSION, error)
        console.error('[SW] Error details:', error.message, error.stack)
        // Still skip waiting even if caching fails
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION)

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('ithappens-v') && cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all pages immediately
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Version', CACHE_VERSION, 'now active and controlling all pages')
    })
  )
})

// Fetch event - Cache First strategy
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests or specific cross-origin requests
  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin

  if (!isSameOrigin) {
    // Let cross-origin requests pass through
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Found in cache - return immediately
        console.log('[SW] Serving from cache:', event.request.url)
        return cachedResponse
      }

      // Not in cache - fetch from network
      console.log('[SW] Fetching from network:', event.request.url)
      return fetch(event.request)
        .then((networkResponse) => {
          // Don't cache non-successful responses or non-GET requests
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === 'error' ||
            event.request.method !== 'GET'
          ) {
            return networkResponse
          }

          // Cache the new resource for future use (especially JS/CSS bundles)
          const responseToCache = networkResponse.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
            console.log('[SW] Cached new resource:', event.request.url)
          })

          return networkResponse
        })
        .catch((error) => {
          console.error('[SW] Fetch failed for:', event.request.url, error)
          // If offline and resource not cached, return a meaningful error
          // For navigation requests, try to return cached index.html
          if (event.request.mode === 'navigate') {
            console.log('[SW] Navigation failed, trying index.html fallback')
            return caches.match('/index.html').then((response) => {
              if (response) {
                return response
              }
              // Try root as fallback
              return caches.match('/')
            })
          }
          // For other requests, let them fail gracefully
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
    })
  )
})
