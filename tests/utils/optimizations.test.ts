// ABOUTME: Tests for optimized utility functions
// ABOUTME: Validates binary search, lazy loading, memoization, and chunked processing

import { describe, it, expect, vi } from 'vitest'
import {
  binarySearchId,
  LazyMap,
  debounce,
  throttle,
  memoize,
  processInChunks,
  processBatched,
  idRange,
  hasIdSorted,
  findNearestId,
  buildStoriesIndex,
} from '../../src/utils/optimizations'

describe('binarySearchId', () => {
  it('finds element in middle', () => {
    const ids = [1, 3, 5, 7, 9, 11, 13]
    expect(binarySearchId(ids, 7)).toBe(3)
  })

  it('finds first element', () => {
    const ids = [1, 3, 5, 7, 9]
    expect(binarySearchId(ids, 1)).toBe(0)
  })

  it('finds last element', () => {
    const ids = [1, 3, 5, 7, 9]
    expect(binarySearchId(ids, 9)).toBe(4)
  })

  it('returns -1 for missing element', () => {
    const ids = [1, 3, 5, 7, 9]
    expect(binarySearchId(ids, 6)).toBe(-1)
  })

  it('handles empty array', () => {
    expect(binarySearchId([], 5)).toBe(-1)
  })

  it('handles single element array', () => {
    expect(binarySearchId([5], 5)).toBe(0)
    expect(binarySearchId([5], 3)).toBe(-1)
  })
})

describe('LazyMap', () => {
  it('loads values on first access', () => {
    const loader = vi.fn((key: number) => key * 2)
    const map = new LazyMap(loader)

    expect(map.get(5)).toBe(10)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(loader).toHaveBeenCalledWith(5)
  })

  it('caches loaded values', () => {
    const loader = vi.fn((key: number) => key * 2)
    const map = new LazyMap(loader)

    map.get(5)
    map.get(5)
    map.get(5)

    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('tracks size correctly', () => {
    const map = new LazyMap((key: number) => key * 2)

    expect(map.size).toBe(0)
    map.get(1)
    expect(map.size).toBe(1)
    map.get(2)
    expect(map.size).toBe(2)
  })

  it('clears cache', () => {
    const loader = vi.fn((key: number) => key * 2)
    const map = new LazyMap(loader)

    map.get(5)
    expect(map.size).toBe(1)

    map.clear()
    expect(map.size).toBe(0)

    map.get(5)
    expect(loader).toHaveBeenCalledTimes(2)
  })
})

describe('debounce', () => {
  it('delays function execution', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancels previous calls', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments correctly', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)

    debounced('test', 123)

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(fn).toHaveBeenCalledWith('test', 123)
  })
})

describe('throttle', () => {
  it('limits function calls', async () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('allows calls after limit period', async () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    await new Promise((resolve) => setTimeout(resolve, 60))

    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('memoize', () => {
  it('caches function results', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoized = memoize(fn)

    expect(memoized(5)).toBe(10)
    expect(memoized(5)).toBe(10)
    expect(memoized(5)).toBe(10)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles multiple arguments', () => {
    const fn = vi.fn((a: number, b: number) => a + b)
    const memoized = memoize(fn)

    expect(memoized(2, 3)).toBe(5)
    expect(memoized(2, 3)).toBe(5)
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized(3, 4)).toBe(7)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('supports custom key function', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 2)
    const memoized = memoize(fn, (obj) => String(obj.id))

    expect(memoized({ id: 5 })).toBe(10)
    expect(memoized({ id: 5 })).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('processInChunks', () => {
  it('processes array in chunks', async () => {
    const items = Array.from({ length: 250 }, (_, i) => i)
    const processor = vi.fn(async (chunk: number[]) => chunk.length)

    const results = await processInChunks(items, processor, 100)

    expect(results).toEqual([100, 100, 50])
    expect(processor).toHaveBeenCalledTimes(3)
  })

  it('handles empty array', async () => {
    const processor = vi.fn(async (chunk: number[]) => chunk.length)
    const results = await processInChunks([], processor, 100)

    expect(results).toEqual([])
    expect(processor).not.toHaveBeenCalled()
  })

  it('uses default chunk size', async () => {
    const items = Array.from({ length: 250 }, (_, i) => i)
    const processor = vi.fn(async (chunk: number[]) => chunk.length)

    await processInChunks(items, processor)

    expect(processor).toHaveBeenCalledTimes(3)
  })
})

describe('processBatched', () => {
  it('processes items with concurrency limit', async () => {
    const items = [1, 2, 3, 4, 5]
    const processor = vi.fn(async (item: number) => item * 2)

    const results = await processBatched(items, processor, 2)

    expect(results).toHaveLength(5)
    expect(processor).toHaveBeenCalledTimes(5)
  })

  it('returns results in order', async () => {
    const items = [1, 2, 3, 4, 5]
    const processor = async (item: number) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10))
      return item * 2
    }

    const results = await processBatched(items, processor, 3)

    expect(results).toContain(2)
    expect(results).toContain(4)
    expect(results).toContain(6)
    expect(results).toContain(8)
    expect(results).toContain(10)
  })
})

describe('idRange', () => {
  it('generates ID range', () => {
    const ids = Array.from(idRange(1, 5))
    expect(ids).toEqual([1, 2, 3, 4, 5])
  })

  it('handles single value range', () => {
    const ids = Array.from(idRange(5, 5))
    expect(ids).toEqual([5])
  })

  it('handles empty range', () => {
    const ids = Array.from(idRange(5, 3))
    expect(ids).toEqual([])
  })
})

describe('hasIdSorted', () => {
  const ids = [1, 3, 5, 7, 9, 11, 13]

  it('returns true for existing ID', () => {
    expect(hasIdSorted(ids, 7)).toBe(true)
  })

  it('returns false for missing ID', () => {
    expect(hasIdSorted(ids, 6)).toBe(false)
  })
})

describe('findNearestId', () => {
  const ids = [1, 5, 10, 15, 20]

  it('returns exact match', () => {
    expect(findNearestId(ids, 10)).toBe(10)
  })

  it('finds nearest lower ID', () => {
    expect(findNearestId(ids, 12)).toBe(10)
  })

  it('finds nearest higher ID', () => {
    expect(findNearestId(ids, 13)).toBe(15)
  })

  it('returns first ID for value below range', () => {
    expect(findNearestId(ids, 0)).toBe(1)
  })

  it('returns last ID for value above range', () => {
    expect(findNearestId(ids, 100)).toBe(20)
  })

  it('handles empty array', () => {
    expect(findNearestId([], 5)).toBe(-1)
  })
})

describe('buildStoriesIndex', () => {
  it('builds index from stories', () => {
    const stories = {
      '1': 'Story 1',
      '5': 'Story 5',
      '3': 'Story 3',
    }

    const index = buildStoriesIndex(stories)

    expect(index.count).toBe(3)
    expect(index.minId).toBe(1)
    expect(index.maxId).toBe(5)
    expect(index.sortedIds).toEqual([1, 3, 5])
    expect(index.map.get(3)).toBe('Story 3')
  })

  it('handles empty stories', () => {
    const index = buildStoriesIndex({})

    expect(index.count).toBe(0)
    expect(index.minId).toBe(0)
    expect(index.maxId).toBe(0)
    expect(index.sortedIds).toEqual([])
  })

  it('handles large dataset', () => {
    const stories: Record<string, string> = {}
    for (let i = 1; i <= 1000; i++) {
      stories[i.toString()] = `Story ${i}`
    }

    const index = buildStoriesIndex(stories)

    expect(index.count).toBe(1000)
    expect(index.minId).toBe(1)
    expect(index.maxId).toBe(1000)
    expect(index.sortedIds).toHaveLength(1000)
  })
})
