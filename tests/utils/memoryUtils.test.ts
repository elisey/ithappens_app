// ABOUTME: Tests for memory utilities including size estimation, leak detection, and optimization suggestions
// ABOUTME: Comprehensive test coverage for memory analysis and monitoring functions

import type { PerformanceMetrics } from '@/services/performanceMonitor'
import {
  estimateObjectSize,
  detectMemoryLeaks,
  getDeviceMemory,
  suggestOptimizations,
  getOptimizationHints,
  formatBytes,
  isMemoryAPIAvailable,
  getMemoryPressure,
} from '@/utils/memoryUtils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('memoryUtils', () => {
  describe('estimateObjectSize', () => {
    it('should return 0 for null', () => {
      expect(estimateObjectSize(null)).toBe(0)
    })

    it('should return 0 for undefined', () => {
      expect(estimateObjectSize(undefined)).toBe(0)
    })

    it('should estimate boolean size as 4 bytes', () => {
      expect(estimateObjectSize(true)).toBe(4)
      expect(estimateObjectSize(false)).toBe(4)
    })

    it('should estimate number size as 8 bytes', () => {
      expect(estimateObjectSize(42)).toBe(8)
      expect(estimateObjectSize(3.14)).toBe(8)
    })

    it('should estimate string size as 2 bytes per character', () => {
      expect(estimateObjectSize('hello')).toBe(10) // 5 * 2
      expect(estimateObjectSize('test')).toBe(8) // 4 * 2
    })

    it('should estimate array size', () => {
      const arr = [1, 2, 3]
      const size = estimateObjectSize(arr)
      expect(size).toBe(24) // 3 numbers * 8 bytes
    })

    it('should estimate object size', () => {
      const obj = { a: 1, b: 2 }
      const size = estimateObjectSize(obj)
      // Keys: 'a' (2) + 'b' (2) = 4
      // Values: 8 + 8 = 16
      // Total: 20
      expect(size).toBe(20)
    })

    it('should handle nested objects', () => {
      const obj = {
        name: 'test', // 'name' (8) + 'test' (8) = 16
        nested: {
          value: 42, // 'value' (10) + 8 = 18
        }, // 'nested' (12) + 18 = 30
      }
      const size = estimateObjectSize(obj)
      expect(size).toBe(46) // 16 + 30
    })

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { a: 1 }
      obj.self = obj
      const size = estimateObjectSize(obj)
      // Should not infinite loop
      expect(size).toBeGreaterThan(0)
      expect(size).toBeLessThan(1000)
    })

    it('should handle mixed types in array', () => {
      const arr = [1, 'hello', true, { x: 10 }]
      const size = estimateObjectSize(arr)
      // number(8) + string(10) + boolean(4) + object(key 'x' is 2, value 10 is 8 = 10)
      // Total: 8 + 10 + 4 + 10 = 32
      expect(size).toBe(32)
    })
  })

  describe('detectMemoryLeaks', () => {
    it('should return false when baseline is 0', () => {
      expect(detectMemoryLeaks(0, 1000)).toBe(false)
    })

    it('should return false when increase is below threshold', () => {
      expect(detectMemoryLeaks(1000, 1400, 0.5)).toBe(false) // 40% increase
    })

    it('should return true when increase exceeds threshold', () => {
      expect(detectMemoryLeaks(1000, 1600, 0.5)).toBe(true) // 60% increase
    })

    it('should use default threshold of 50%', () => {
      expect(detectMemoryLeaks(1000, 1500)).toBe(false) // Exactly 50%
      expect(detectMemoryLeaks(1000, 1501)).toBe(true) // Just over 50%
    })

    it('should handle custom thresholds', () => {
      expect(detectMemoryLeaks(1000, 1200, 0.3)).toBe(false) // 20% < 30%
      expect(detectMemoryLeaks(1000, 1400, 0.3)).toBe(true) // 40% > 30%
    })

    it('should handle decrease in memory usage', () => {
      expect(detectMemoryLeaks(1000, 500)).toBe(false)
    })
  })

  describe('getDeviceMemory', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should return memory value when available', () => {
      const mockNavigator = { deviceMemory: 8 }
      vi.stubGlobal('navigator', mockNavigator)
      expect(getDeviceMemory()).toBe(8)
    })

    it('should return null when not available', () => {
      vi.stubGlobal('navigator', {})
      expect(getDeviceMemory()).toBeNull()
    })
  })

  describe('suggestOptimizations', () => {
    it('should suggest load time optimizations for slow loads', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 4000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 10 * 1024 * 1024,
        memoryDelta: 0,
      }
      const suggestions = suggestOptimizations(metrics)
      expect(suggestions).toContain('Consider implementing progressive loading or data streaming')
      expect(suggestions).toContain('Enable compression on the server side (gzip/brotli)')
    })

    it('should suggest parse time optimizations for slow parsing', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 500,
        parseTime: 1500,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 10 * 1024 * 1024,
        memoryDelta: 0,
      }
      const suggestions = suggestOptimizations(metrics)
      expect(suggestions).toContain('Consider using a streaming JSON parser for large datasets')
      expect(suggestions).toContain('Split data into smaller chunks for faster parsing')
    })

    it('should suggest memory optimizations for high usage', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 500,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 160 * 1024 * 1024, // 160 MB
        memoryDelta: 0,
      }
      const suggestions = suggestOptimizations(metrics)
      expect(suggestions).toContain('Consider implementing virtual scrolling for story navigation')
      expect(suggestions).toContain('Implement data pagination or lazy loading')
    })

    it('should suggest indexing optimizations for slow indexing', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 500,
        parseTime: 100,
        indexingTime: 600,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 10 * 1024 * 1024,
        memoryDelta: 0,
      }
      const suggestions = suggestOptimizations(metrics)
      expect(suggestions).toContain('Consider using Web Workers for indexing operations')
      expect(suggestions).toContain(
        'Implement incremental indexing instead of processing all at once'
      )
    })

    it('should suggest story count optimizations for large datasets', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 500,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 25000,
        memoryUsed: 10 * 1024 * 1024,
        memoryDelta: 0,
      }
      const suggestions = suggestOptimizations(metrics)
      expect(suggestions).toContain(
        'Consider implementing search/filter capabilities to reduce data in view'
      )
      expect(suggestions).toContain('Use IndexedDB for large dataset storage instead of memory')
    })

    it('should return empty array for optimal metrics', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 500,
        indexingTime: 300,
        firstRender: 100,
        storyCount: 5000,
        memoryUsed: 50 * 1024 * 1024,
        memoryDelta: 0,
      }
      const suggestions = suggestOptimizations(metrics)
      expect(suggestions).toHaveLength(0)
    })
  })

  describe('getOptimizationHints', () => {
    it('should return critical level for very slow load', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 6000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 50 * 1024 * 1024,
        memoryDelta: 0,
      }
      const hints = getOptimizationHints(metrics)
      expect(hints.level).toBe('critical')
      expect(hints.suggestions.length).toBeGreaterThan(0)
    })

    it('should return critical level for excessive memory', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 250 * 1024 * 1024, // 250 MB
        memoryDelta: 0,
      }
      const hints = getOptimizationHints(metrics)
      expect(hints.level).toBe('critical')
    })

    it('should return warning level for moderately slow performance', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 3500,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 50 * 1024 * 1024,
        memoryDelta: 0,
      }
      const hints = getOptimizationHints(metrics)
      expect(hints.level).toBe('warning')
      expect(hints.suggestions.length).toBeGreaterThan(0)
    })

    it('should return warning level for high memory usage', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 110 * 1024 * 1024, // 110 MB
        memoryDelta: 0,
      }
      const hints = getOptimizationHints(metrics)
      expect(hints.level).toBe('warning')
    })

    it('should return good level for optimal metrics', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 500,
        indexingTime: 300,
        firstRender: 100,
        storyCount: 5000,
        memoryUsed: 50 * 1024 * 1024,
        memoryDelta: 0,
      }
      const hints = getOptimizationHints(metrics)
      expect(hints.level).toBe('good')
      expect(hints.suggestions).toHaveLength(0)
    })
  })

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatBytes(1.75 * 1024 * 1024 * 1024)).toBe('1.75 GB')
    })

    it('should round to 2 decimal places', () => {
      expect(formatBytes(1234)).toBe('1.21 KB')
    })
  })

  describe('isMemoryAPIAvailable', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should return true when memory API is available', () => {
      const mockPerformance = { memory: {} }
      vi.stubGlobal('performance', mockPerformance)
      expect(isMemoryAPIAvailable()).toBe(true)
    })

    it('should return false when memory API is not available', () => {
      vi.stubGlobal('performance', {})
      expect(isMemoryAPIAvailable()).toBe(false)
    })
  })

  describe('getMemoryPressure', () => {
    it('should return low pressure for zero memory usage', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 0,
        memoryDelta: 0,
      }
      const pressure = getMemoryPressure(metrics)
      expect(pressure.pressure).toBe('low')
      expect(pressure.percentage).toBe(0)
    })

    it('should return low pressure for small memory usage', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 100 * 1024 * 1024, // 100 MB
        memoryDelta: 0,
      }
      const pressure = getMemoryPressure(metrics)
      expect(pressure.pressure).toBe('low')
      expect(pressure.percentage).toBeLessThan(50)
    })

    it('should return medium pressure for moderate memory usage', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 1.2 * 1024 * 1024 * 1024, // 1.2 GB (~60%)
        memoryDelta: 0,
      }
      const pressure = getMemoryPressure(metrics)
      expect(pressure.pressure).toBe('medium')
      expect(pressure.percentage).toBeGreaterThan(50)
      expect(pressure.percentage).toBeLessThan(75)
    })

    it('should return high pressure for large memory usage', () => {
      const metrics: PerformanceMetrics = {
        loadTime: 1000,
        parseTime: 100,
        indexingTime: 100,
        firstRender: 100,
        storyCount: 1000,
        memoryUsed: 1.6 * 1024 * 1024 * 1024, // 1.6 GB (~80%)
        memoryDelta: 0,
      }
      const pressure = getMemoryPressure(metrics)
      expect(pressure.pressure).toBe('high')
      expect(pressure.percentage).toBeGreaterThan(75)
    })
  })
})
