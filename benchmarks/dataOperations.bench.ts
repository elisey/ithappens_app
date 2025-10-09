// ABOUTME: Performance benchmarks for critical data operations
// ABOUTME: Measures parsing, indexing, searching, and memory allocation patterns

import { bench, describe } from 'vitest'
import type { StoriesData } from '../src/types/story'

// Generate test data
function generateTestData(count: number): StoriesData {
  const stories: StoriesData = {}
  for (let i = 1; i <= count; i++) {
    stories[i.toString()] =
      `This is story number ${i}. It contains some text to simulate real data. The stories can vary in length and content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
  }
  return stories
}

function generateLargeJSON(count: number): string {
  return JSON.stringify(generateTestData(count))
}

describe('Data Operations', () => {
  const smallDataset = generateTestData(100)
  const mediumDataset = generateTestData(1000)
  const largeDataset = generateTestData(13000)

  const smallJSON = generateLargeJSON(100)
  const mediumJSON = generateLargeJSON(1000)
  const largeJSON = generateLargeJSON(13000)

  describe('JSON Parsing', () => {
    bench('Parse 100 stories (~50KB)', () => {
      JSON.parse(smallJSON)
    })

    bench('Parse 1,000 stories (~500KB)', () => {
      JSON.parse(mediumJSON)
    })

    bench('Parse 13,000 stories (~26MB)', () => {
      JSON.parse(largeJSON)
    })
  })

  describe('Index Building', () => {
    bench('Build index for 100 items', () => {
      const ids = Object.keys(smallDataset).map(Number)
      const index = new Map(ids.map((id) => [id, id]))
      return index
    })

    bench('Build index for 1,000 items', () => {
      const ids = Object.keys(mediumDataset).map(Number)
      const index = new Map(ids.map((id) => [id, id]))
      return index
    })

    bench('Build index for 13,000 items', () => {
      const ids = Object.keys(largeDataset).map(Number)
      const index = new Map(ids.map((id) => [id, id]))
      return index
    })
  })

  describe('Binary Search vs Linear Search', () => {
    const sortedIds = Object.keys(largeDataset)
      .map(Number)
      .sort((a, b) => a - b)
    const target = 6500

    function binarySearch(arr: number[], target: number): number {
      let left = 0
      let right = arr.length - 1

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        if (arr[mid] === target) return mid
        if (arr[mid] < target) left = mid + 1
        else right = mid - 1
      }
      return -1
    }

    bench('Binary search in 13k sorted IDs', () => {
      binarySearch(sortedIds, target)
    })

    bench('Array.indexOf in 13k IDs', () => {
      sortedIds.indexOf(target)
    })

    bench('Array.find in 13k IDs', () => {
      sortedIds.find((id) => id === target)
    })
  })

  describe('Map vs Object vs Array Lookup', () => {
    const ids = Object.keys(largeDataset).map(Number)
    const mapIndex = new Map(ids.map((id) => [id, largeDataset[id.toString()]]))
    const objectIndex = largeDataset
    const arrayIndex = ids.map((id) => ({ id, text: largeDataset[id.toString()] }))

    const targetId = 6500

    bench('Map.get() lookup', () => {
      const result = mapIndex.get(targetId)
      return result
    })

    bench('Object property lookup', () => {
      const result = objectIndex[targetId.toString()]
      return result
    })

    bench('Array.find() lookup', () => {
      arrayIndex.find((item) => item.id === targetId)
    })
  })

  describe('Memory Allocation Patterns', () => {
    bench('Spread operator on large object', () => {
      const copy = { ...largeDataset }
      return copy
    })

    bench('Object.assign on large object', () => {
      const copy = Object.assign({}, largeDataset)
      return copy
    })

    bench('JSON parse/stringify clone', () => {
      const copy = JSON.parse(JSON.stringify(largeDataset))
      return copy
    })

    bench('Object.entries iteration', () => {
      const entries = Object.entries(largeDataset)
      return entries
    })

    bench('Object.keys + map', () => {
      const keys = Object.keys(largeDataset).map((key) => ({
        id: key,
        text: largeDataset[key],
      }))
      return keys
    })
  })

  describe('String Operations', () => {
    const storyText = largeDataset['1']

    bench('String.length', () => {
      return storyText.length
    })

    bench('String.slice(0, 100)', () => {
      return storyText.slice(0, 100)
    })

    bench('String.substring(0, 100)', () => {
      return storyText.substring(0, 100)
    })

    bench('String.includes() search', () => {
      return storyText.includes('story')
    })

    bench('String.indexOf() search', () => {
      return storyText.indexOf('story')
    })
  })

  describe('Array Operations', () => {
    const ids = Object.keys(largeDataset).map(Number)

    bench('Array.map transformation', () => {
      ids.map((id) => id * 2)
    })

    bench('Array.filter', () => {
      ids.filter((id) => id > 5000)
    })

    bench('Array.reduce', () => {
      ids.reduce((sum, id) => sum + id, 0)
    })

    bench('for loop iteration', () => {
      let sum = 0
      for (let i = 0; i < ids.length; i++) {
        sum += ids[i]
      }
      return sum
    })

    bench('for...of iteration', () => {
      let sum = 0
      for (const id of ids) {
        sum += id
      }
      return sum
    })
  })
})
