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
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - Cache First strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Found in cache - return immediately
        return cachedResponse
      }

      // Not in cache - fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Don't cache non-successful responses
          if (!networkResponse || networkResponse.status !== 200) {
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
          console.error('[SW] Fetch failed:', error)
          throw error
        })
    })
  )
})
