// ABOUTME: Performance monitoring utilities for measuring execution time and memory usage
// ABOUTME: Provides logging functions that respect development environment and configuration settings

import { getAppConfig } from '../config/app.config'

interface MemoryInfo {
  used: number
  total: number
  percentage: number
}

/**
 * Measure execution time of a function with optional labeling
 */
export async function measureExecutionTime<T>(fn: () => T | Promise<T>, label: string): Promise<T> {
  const config = getAppConfig()
  const startTime = performance.now()

  try {
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime

    if (config.enablePerformanceLogging) {
      console.log(`⏱️ [Performance] ${label}: ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    if (config.enablePerformanceLogging) {
      console.error(`⚠️ [Performance] ${label} failed after ${duration.toFixed(2)}ms:`, error)
    }

    throw error
  }
}

/**
 * Get current memory usage information
 * Returns null if not supported by the browser
 */
export function getMemoryUsage(): MemoryInfo | null {
  // Check if performance.memory is available (Chromium-based browsers)
  if (
    typeof performance !== 'undefined' &&
    'memory' in performance &&
    performance.memory &&
    typeof performance.memory === 'object' &&
    'usedJSHeapSize' in performance.memory &&
    'totalJSHeapSize' in performance.memory
  ) {
    const memory = performance.memory
    const used = memory.usedJSHeapSize as number
    const total = memory.totalJSHeapSize as number
    const percentage = (used / total) * 100

    return {
      used,
      total,
      percentage,
    }
  }

  return null
}

/**
 * Format bytes into human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Log memory usage if performance logging is enabled
 */
export function logMemoryUsage(label: string): void {
  const config = getAppConfig()

  if (!config.enablePerformanceLogging) {
    return
  }

  const memoryInfo = getMemoryUsage()
  if (memoryInfo) {
    console.log(
      `🧠 [Memory] ${label}: ${formatBytes(memoryInfo.used)} / ${formatBytes(memoryInfo.total)} (${memoryInfo.percentage.toFixed(1)}%)`
    )
  }
}

/**
 * Create a performance mark for complex operations
 */
export function createPerformanceMark(name: string): void {
  const config = getAppConfig()

  if (config.enablePerformanceLogging && typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * Measure time between two performance marks
 */
export function measureBetweenMarks(startMark: string, endMark: string, label: string): void {
  const config = getAppConfig()

  if (
    config.enablePerformanceLogging &&
    typeof performance !== 'undefined' &&
    performance.measure &&
    performance.getEntriesByName
  ) {
    try {
      performance.mark(endMark)
      performance.measure(label, startMark, endMark)

      const measure = performance.getEntriesByName(label)[0]
      if (measure) {
        console.log(`⏱️ [Performance] ${label}: ${measure.duration.toFixed(2)}ms`)
      }

      // Clean up marks and measures
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(label)
    } catch (error) {
      if (config.enablePerformanceLogging) {
        console.warn(`Failed to measure performance for ${label}:`, error)
      }
    }
  }
}
