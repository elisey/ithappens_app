// ABOUTME: Optimized utility functions for critical performance paths
// ABOUTME: Binary search, lazy loading, debouncing, memoization, and chunked processing

/**
 * Binary search for sorted numeric ID arrays
 * Time complexity: O(log n)
 */
export function binarySearchId(ids: number[], target: number): number {
  let left = 0
  let right = ids.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (ids[mid] === target) {
      return mid
    }
    if (ids[mid] < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return -1 // Not found
}

/**
 * Lazy map that loads values on-demand
 * Useful for large datasets where not all data is accessed
 */
export class LazyMap<K, V> {
  private cache: Map<K, V>
  private loader: (key: K) => V

  constructor(loader: (key: K) => V) {
    this.cache = new Map()
    this.loader = loader
  }

  get(key: K): V {
    if (!this.cache.has(key)) {
      const value = this.loader(key)
      this.cache.set(key, value)
    }
    return this.cache.get(key) as V
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

/**
 * Debounce function calls to reduce frequency
 * Useful for user input handlers and frequent events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function calls to limit frequency
 * Unlike debounce, ensures function is called at regular intervals
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function throttled(...args: Parameters<T>): void {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Memoize function results for expensive computations
 * Caches results based on function arguments
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  } as T
}

/**
 * Process large arrays in chunks to avoid blocking the main thread
 * Returns results in the same order as input
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (chunk: T[]) => Promise<R>,
  chunkSize: number = 100
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const result = await processor(chunk)
    results.push(result)

    // Yield to the event loop to keep UI responsive
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return results
}

/**
 * Process items in batches with concurrency limit
 * Useful for parallel async operations with rate limiting
 */
export async function processBatched<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const promise = processor(item).then((result) => {
      results.push(result)
      executing.splice(executing.indexOf(promise), 1)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Efficient ID range generator
 * Useful for generating sequences without allocating full array
 */
export function* idRange(start: number, end: number): Generator<number> {
  for (let i = start; i <= end; i++) {
    yield i
  }
}

/**
 * Check if ID exists using binary search on sorted array
 * More efficient than Set for large sorted arrays
 */
export function hasIdSorted(ids: number[], target: number): boolean {
  return binarySearchId(ids, target) !== -1
}

/**
 * Find nearest ID in sorted array
 * Returns the closest ID that exists
 */
export function findNearestId(ids: number[], target: number): number {
  if (ids.length === 0) return -1

  const index = binarySearchId(ids, target)
  if (index !== -1) return ids[index]

  // Binary search for insertion point
  let left = 0
  let right = ids.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (ids[mid] < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  // left is the insertion point, find nearest
  if (left >= ids.length) return ids[ids.length - 1]
  if (left === 0) return ids[0]

  const distLeft = Math.abs(ids[left - 1] - target)
  const distRight = Math.abs(ids[left] - target)

  return distLeft < distRight ? ids[left - 1] : ids[left]
}

/**
 * Create an optimized index structure from stories data
 * Returns a Map for O(1) lookups and sorted array for binary search
 */
export interface StoriesIndex {
  map: Map<number, string>
  sortedIds: number[]
  minId: number
  maxId: number
  count: number
}

export function buildStoriesIndex(stories: Record<string, string>): StoriesIndex {
  const map = new Map<number, string>()
  const ids: number[] = []

  for (const [idStr, text] of Object.entries(stories)) {
    const id = Number(idStr)
    map.set(id, text)
    ids.push(id)
  }

  ids.sort((a, b) => a - b)

  return {
    map,
    sortedIds: ids,
    minId: ids[0] || 0,
    maxId: ids[ids.length - 1] || 0,
    count: ids.length,
  }
}
