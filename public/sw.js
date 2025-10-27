// ABOUTME: Service Worker for offline support with Cache First strategy
// ABOUTME: Caches all static assets and stories.json for full offline functionality

const CACHE_NAME = 'ithappens-v1'

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
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell and content')
        return cache.addAll(ASSETS_TO_CACHE)
      })
      .then(() => {
        console.log('[SW] All assets cached successfully')
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim()
      })
  )
})

// Fetch event - Cache First strategy
self.addEventListener('fetch', (event) => {
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

          // Cache the new resource for future use
          const responseToCache = networkResponse.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return networkResponse
        })
        .catch((error) => {
          console.error('[SW] Fetch failed for:', event.request.url, error)
          // If offline and resource not cached, return a meaningful error
          // For navigation requests, try to return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html')
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
