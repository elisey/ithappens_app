// ABOUTME: Tests for performance monitoring utilities including execution time and memory usage
// ABOUTME: Comprehensive test coverage for performance measurement and logging functions

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import * as appConfig from '../../src/config/app.config'
import {
  measureExecutionTime,
  getMemoryUsage,
  formatBytes,
  logMemoryUsage,
  createPerformanceMark,
  measureBetweenMarks,
} from '../../src/utils/performance'

// Type definition for PerformanceEntry to avoid no-undef errors
interface PerformanceEntry {
  name: string
  entryType: string
  startTime: number
  duration: number
  toJSON: () => Record<string, unknown>
}

describe('Performance Utilities', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('measureExecutionTime', () => {
    test('measures execution time of synchronous function', async () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const syncFn = () => {
        return 'result'
      }

      const result = await measureExecutionTime(syncFn, 'test sync function')

      expect(result).toBe('result')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ [Performance] test sync function:')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ms'))

      mockConfig.mockRestore()
    })

    test('measures execution time of async function', async () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'async result'
      }

      const result = await measureExecutionTime(asyncFn, 'test async function')

      expect(result).toBe('async result')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ [Performance] test async function:')
      )

      mockConfig.mockRestore()
    })

    test('does not log when performance logging is disabled', async () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: false,
        isDevelopment: false,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const syncFn = () => 'result'
      const result = await measureExecutionTime(syncFn, 'test function')

      expect(result).toBe('result')
      expect(consoleLogSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
    })

    test('logs error and rethrows when function fails', async () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const error = new Error('Test error')
      const failingFn = () => {
        throw error
      }

      await expect(measureExecutionTime(failingFn, 'failing function')).rejects.toThrow(
        'Test error'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ [Performance] failing function failed after'),
        error
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ms:'), error)

      mockConfig.mockRestore()
    })

    test('does not log error when performance logging is disabled and function fails', async () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: false,
        isDevelopment: false,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const failingFn = () => {
        throw new Error('Test error')
      }

      await expect(measureExecutionTime(failingFn, 'failing function')).rejects.toThrow(
        'Test error'
      )

      expect(consoleErrorSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
    })

    test('formats duration with two decimal places', async () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const syncFn = () => 'result'
      await measureExecutionTime(syncFn, 'test')

      const logCall = consoleLogSpy.mock.calls[0][0] as string
      const durationMatch = logCall.match(/(\d+\.\d{2})ms/)
      expect(durationMatch).toBeTruthy()
      expect(durationMatch![1]).toMatch(/^\d+\.\d{2}$/)

      mockConfig.mockRestore()
    })
  })

  describe('getMemoryUsage', () => {
    test('returns memory info when performance.memory is available', () => {
      const mockMemory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 30000000,
      }

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      })

      const result = getMemoryUsage()

      expect(result).not.toBeNull()
      expect(result?.used).toBe(10000000)
      expect(result?.total).toBe(20000000)
      expect(result?.percentage).toBe(50)
    })

    test('returns null when performance.memory is not available', () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      })

      const result = getMemoryUsage()

      expect(result).toBeNull()
    })

    test('returns null when performance is undefined', () => {
      const originalPerformance = global.performance
      // @ts-expect-error - intentionally testing undefined performance
      global.performance = undefined

      const result = getMemoryUsage()

      expect(result).toBeNull()

      global.performance = originalPerformance
    })

    test('returns null when memory object is missing required properties', () => {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 10000000,
          // missing totalJSHeapSize
        },
        configurable: true,
      })

      const result = getMemoryUsage()

      expect(result).toBeNull()
    })

    test('calculates percentage correctly', () => {
      const mockMemory = {
        usedJSHeapSize: 7500000,
        totalJSHeapSize: 10000000,
        jsHeapSizeLimit: 20000000,
      }

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      })

      const result = getMemoryUsage()

      expect(result?.percentage).toBe(75)
    })

    test('returns null when performance.memory is not an object', () => {
      Object.defineProperty(performance, 'memory', {
        value: 'not an object',
        configurable: true,
      })

      const result = getMemoryUsage()

      expect(result).toBeNull()
    })
  })

  describe('formatBytes', () => {
    test('formats zero bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
    })

    test('formats bytes', () => {
      expect(formatBytes(512)).toBe('512 Bytes')
      expect(formatBytes(1023)).toBe('1023 Bytes')
    })

    test('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(2048)).toBe('2 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    test('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(5242880)).toBe('5 MB')
      expect(formatBytes(1572864)).toBe('1.5 MB')
    })

    test('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB')
      expect(formatBytes(2147483648)).toBe('2 GB')
      expect(formatBytes(1610612736)).toBe('1.5 GB')
    })

    test('formats terabytes', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB')
      expect(formatBytes(2199023255552)).toBe('2 TB')
    })

    test('uses custom decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 3)).toBe('1.5 KB')
    })

    test('handles negative decimal parameter', () => {
      expect(formatBytes(1536, -1)).toBe('2 KB')
    })

    test('formats fractional values correctly', () => {
      expect(formatBytes(1234567, 2)).toBe('1.18 MB')
      expect(formatBytes(1234567, 3)).toBe('1.177 MB')
    })

    test('formats very small KB values', () => {
      expect(formatBytes(1025, 2)).toBe('1 KB')
      expect(formatBytes(1100, 2)).toBe('1.07 KB')
    })
  })

  describe('logMemoryUsage', () => {
    test('logs memory usage when performance logging is enabled and memory is available', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const mockMemory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 30000000,
      }

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      })

      logMemoryUsage('test memory')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧠 [Memory] test memory:')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('9.54 MB'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('19.07 MB'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('50.0%'))

      mockConfig.mockRestore()
    })

    test('does not log when performance logging is disabled', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: false,
        isDevelopment: false,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const mockMemory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 30000000,
      }

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      })

      logMemoryUsage('test memory')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
    })

    test('does not log when memory is not available', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      })

      logMemoryUsage('test memory')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
    })

    test('formats percentage with one decimal place', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const mockMemory = {
        usedJSHeapSize: 7777777,
        totalJSHeapSize: 10000000,
        jsHeapSizeLimit: 30000000,
      }

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      })

      logMemoryUsage('test')

      const logCall = consoleLogSpy.mock.calls[0][0] as string
      const percentageMatch = logCall.match(/(\d+\.\d)%/)
      expect(percentageMatch).toBeTruthy()

      mockConfig.mockRestore()
    })
  })

  describe('createPerformanceMark', () => {
    test('creates performance mark when logging is enabled and performance.mark is available', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark')

      createPerformanceMark('test-mark')

      expect(markSpy).toHaveBeenCalledWith('test-mark')

      mockConfig.mockRestore()
      markSpy.mockRestore()
    })

    test('does not create mark when performance logging is disabled', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: false,
        isDevelopment: false,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark')

      createPerformanceMark('test-mark')

      expect(markSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
      markSpy.mockRestore()
    })

    test('does not create mark when performance.mark is not available', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const originalMark = performance.mark
      // @ts-expect-error - intentionally testing undefined mark
      performance.mark = undefined

      expect(() => createPerformanceMark('test-mark')).not.toThrow()

      performance.mark = originalMark
      mockConfig.mockRestore()
    })

    test('does not create mark when performance is undefined', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const originalPerformance = global.performance
      // @ts-expect-error - intentionally testing undefined performance
      global.performance = undefined

      expect(() => createPerformanceMark('test-mark')).not.toThrow()

      global.performance = originalPerformance
      mockConfig.mockRestore()
    })
  })

  describe('measureBetweenMarks', () => {
    test('measures time between marks and logs result', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark').mockImplementation(() => undefined)
      const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => undefined)
      const getEntriesByNameSpy = vi
        .spyOn(performance, 'getEntriesByName')
        .mockImplementation(() => [
          {
            name: 'test-measure',
            entryType: 'measure',
            startTime: 100,
            duration: 123.45,
            toJSON: () => ({}),
          } as PerformanceEntry,
        ])
      const clearMarksSpy = vi.spyOn(performance, 'clearMarks').mockImplementation(() => undefined)
      const clearMeasuresSpy = vi
        .spyOn(performance, 'clearMeasures')
        .mockImplementation(() => undefined)

      measureBetweenMarks('start-mark', 'end-mark', 'test-measure')

      expect(markSpy).toHaveBeenCalledWith('end-mark')
      expect(measureSpy).toHaveBeenCalledWith('test-measure', 'start-mark', 'end-mark')
      expect(getEntriesByNameSpy).toHaveBeenCalledWith('test-measure')
      expect(consoleLogSpy).toHaveBeenCalledWith('⏱️ [Performance] test-measure: 123.45ms')
      expect(clearMarksSpy).toHaveBeenCalledWith('start-mark')
      expect(clearMarksSpy).toHaveBeenCalledWith('end-mark')
      expect(clearMeasuresSpy).toHaveBeenCalledWith('test-measure')

      mockConfig.mockRestore()
      markSpy.mockRestore()
      measureSpy.mockRestore()
      getEntriesByNameSpy.mockRestore()
      clearMarksSpy.mockRestore()
      clearMeasuresSpy.mockRestore()
    })

    test('does not measure when performance logging is disabled', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: false,
        isDevelopment: false,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark')
      const measureSpy = vi.spyOn(performance, 'measure')

      measureBetweenMarks('start-mark', 'end-mark', 'test-measure')

      expect(markSpy).not.toHaveBeenCalled()
      expect(measureSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
      markSpy.mockRestore()
      measureSpy.mockRestore()
    })

    test('handles error during measurement', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const error = new Error('Measurement failed')
      const markSpy = vi.spyOn(performance, 'mark')
      const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => {
        throw error
      })

      measureBetweenMarks('start-mark', 'end-mark', 'test-measure')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to measure performance for test-measure:',
        error
      )

      mockConfig.mockRestore()
      markSpy.mockRestore()
      measureSpy.mockRestore()
    })

    test('does not log error when performance logging is disabled', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: false,
        isDevelopment: false,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark')

      measureBetweenMarks('start-mark', 'end-mark', 'test-measure')

      expect(consoleWarnSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
      markSpy.mockRestore()
    })

    test('does not measure when performance.measure is not available', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const originalMeasure = performance.measure
      // @ts-expect-error - intentionally testing undefined measure
      performance.measure = undefined

      expect(() => measureBetweenMarks('start', 'end', 'test')).not.toThrow()
      expect(consoleLogSpy).not.toHaveBeenCalled()

      performance.measure = originalMeasure
      mockConfig.mockRestore()
    })

    test('does not measure when performance.getEntriesByName is not available', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const originalGetEntriesByName = performance.getEntriesByName
      // @ts-expect-error - intentionally testing undefined getEntriesByName
      performance.getEntriesByName = undefined

      expect(() => measureBetweenMarks('start', 'end', 'test')).not.toThrow()

      performance.getEntriesByName = originalGetEntriesByName
      mockConfig.mockRestore()
    })

    test('does not log when no measure entry is found', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark').mockImplementation(() => undefined)
      const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => undefined)
      const getEntriesByNameSpy = vi
        .spyOn(performance, 'getEntriesByName')
        .mockImplementation(() => [])
      const clearMarksSpy = vi.spyOn(performance, 'clearMarks').mockImplementation(() => undefined)
      const clearMeasuresSpy = vi
        .spyOn(performance, 'clearMeasures')
        .mockImplementation(() => undefined)

      measureBetweenMarks('start-mark', 'end-mark', 'test-measure')

      expect(markSpy).toHaveBeenCalledWith('end-mark')
      expect(measureSpy).toHaveBeenCalledWith('test-measure', 'start-mark', 'end-mark')
      expect(getEntriesByNameSpy).toHaveBeenCalledWith('test-measure')
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(clearMarksSpy).toHaveBeenCalledWith('start-mark')
      expect(clearMarksSpy).toHaveBeenCalledWith('end-mark')
      expect(clearMeasuresSpy).toHaveBeenCalledWith('test-measure')

      mockConfig.mockRestore()
      markSpy.mockRestore()
      measureSpy.mockRestore()
      getEntriesByNameSpy.mockRestore()
      clearMarksSpy.mockRestore()
      clearMeasuresSpy.mockRestore()
    })

    test('cleans up marks and measures even when logging fails', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const markSpy = vi.spyOn(performance, 'mark')
      const measureSpy = vi.spyOn(performance, 'measure')
      const getEntriesByNameSpy = vi
        .spyOn(performance, 'getEntriesByName')
        .mockImplementation(() => {
          throw new Error('getEntriesByName failed')
        })
      const clearMarksSpy = vi.spyOn(performance, 'clearMarks')
      const clearMeasuresSpy = vi.spyOn(performance, 'clearMeasures')

      measureBetweenMarks('start-mark', 'end-mark', 'test-measure')

      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(clearMarksSpy).not.toHaveBeenCalled()
      expect(clearMeasuresSpy).not.toHaveBeenCalled()

      mockConfig.mockRestore()
      markSpy.mockRestore()
      measureSpy.mockRestore()
      getEntriesByNameSpy.mockRestore()
      clearMarksSpy.mockRestore()
      clearMeasuresSpy.mockRestore()
    })

    test('does not measure when performance is undefined', () => {
      const mockConfig = vi.spyOn(appConfig, 'getAppConfig').mockReturnValue({
        enablePerformanceLogging: true,
        isDevelopment: true,
        storiesUrl: '',
        maxLoadingTime: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: '1.0.0',
        buildDate: '2025-01-01',
      })

      const originalPerformance = global.performance
      // @ts-expect-error - intentionally testing undefined performance
      global.performance = undefined

      expect(() => measureBetweenMarks('start', 'end', 'test')).not.toThrow()
      expect(consoleLogSpy).not.toHaveBeenCalled()

      global.performance = originalPerformance
      mockConfig.mockRestore()
    })
  })
})
