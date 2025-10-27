// ABOUTME: Utilities for memory analysis, leak detection, and optimization suggestions
// ABOUTME: Provides estimates, leak detection, and actionable optimization hints

import type { PerformanceMetrics } from '../services/performanceMonitor'

/**
 * Estimate the size of a JavaScript object in bytes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function estimateObjectSize(obj: any): number {
  const seen = new WeakSet()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function sizeOf(value: any): number {
    if (value === null || value === undefined) {
      return 0
    }

    // Primitives
    if (typeof value === 'boolean') {
      return 4
    }
    if (typeof value === 'number') {
      return 8
    }
    if (typeof value === 'string') {
      return value.length * 2
    }

    // Objects and arrays
    if (typeof value === 'object') {
      // Avoid circular references
      if (seen.has(value)) {
        return 0
      }
      seen.add(value)

      let size = 0

      if (Array.isArray(value)) {
        size += value.reduce((acc, item) => acc + sizeOf(item), 0)
      } else {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            size += key.length * 2 // Key size
            size += sizeOf(value[key]) // Value size
          }
        }
      }

      return size
    }

    return 0
  }

  return sizeOf(obj)
}

/**
 * Detect potential memory leaks by comparing baseline to current usage
 */
export function detectMemoryLeaks(
  baseline: number,
  current: number,
  threshold: number = 0.5 // 50% increase
): boolean {
  if (baseline === 0) {
    return false
  }

  const increase = (current - baseline) / baseline
  return increase > threshold
}

/**
 * Get device memory information if available
 */
export function getDeviceMemory(): number | null {
  if ('deviceMemory' in navigator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (navigator as any).deviceMemory
  }
  return null
}

/**
 * Suggest optimizations based on current metrics
 */
export function suggestOptimizations(metrics: PerformanceMetrics): string[] {
  const suggestions: string[] = []

  // Load time optimizations
  if (metrics.loadTime > 3000) {
    suggestions.push('Consider implementing progressive loading or data streaming')
    suggestions.push('Enable compression on the server side (gzip/brotli)')
  }

  // Parse time optimizations
  if (metrics.parseTime > 1000) {
    suggestions.push('Consider using a streaming JSON parser for large datasets')
    suggestions.push('Split data into smaller chunks for faster parsing')
  }

  // Memory optimizations
  const memoryMB = metrics.memoryUsed / (1024 * 1024)
  if (memoryMB > 150) {
    suggestions.push('Consider implementing virtual scrolling for story navigation')
    suggestions.push('Implement data pagination or lazy loading')
  }

  // Indexing optimizations
  if (metrics.indexingTime > 500) {
    suggestions.push('Consider using Web Workers for indexing operations')
    suggestions.push('Implement incremental indexing instead of processing all at once')
  }

  // Story count optimizations
  if (metrics.storyCount > 20000) {
    suggestions.push('Consider implementing search/filter capabilities to reduce data in view')
    suggestions.push('Use IndexedDB for large dataset storage instead of memory')
  }

  return suggestions
}

/**
 * Get optimization hints with severity level
 */
export function getOptimizationHints(metrics: PerformanceMetrics): {
  level: 'good' | 'warning' | 'critical'
  suggestions: string[]
} {
  const suggestions = suggestOptimizations(metrics)

  // Determine severity level
  const memoryMB = metrics.memoryUsed / (1024 * 1024)
  const hasSlowLoad = metrics.loadTime > 5000
  const hasCriticalMemory = memoryMB > 200

  if (hasSlowLoad || hasCriticalMemory) {
    return {
      level: 'critical',
      suggestions,
    }
  }

  if (metrics.loadTime > 3000 || memoryMB > 100 || metrics.parseTime > 1000) {
    return {
      level: 'warning',
      suggestions,
    }
  }

  return {
    level: 'good',
    suggestions: [],
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Check if memory API is available
 */
export function isMemoryAPIAvailable(): boolean {
  return 'memory' in performance
}

/**
 * Get memory pressure status
 */
export function getMemoryPressure(metrics: PerformanceMetrics): {
  pressure: 'low' | 'medium' | 'high'
  percentage: number
} {
  if (metrics.memoryUsed === 0) {
    return { pressure: 'low', percentage: 0 }
  }

  // Estimate based on typical browser limits (~2GB for 64-bit)
  const estimatedLimit = 2 * 1024 * 1024 * 1024 // 2GB in bytes
  const percentage = (metrics.memoryUsed / estimatedLimit) * 100

  if (percentage > 75) {
    return { pressure: 'high', percentage }
  }
  if (percentage > 50) {
    return { pressure: 'medium', percentage }
  }
  return { pressure: 'low', percentage }
}
