// ABOUTME: Performance monitoring service for tracking metrics and detecting issues
// ABOUTME: Measures load time, parse time, memory usage, and provides health checks

export interface PerformanceMetrics {
  loadTime: number
  parseTime: number
  memoryUsed: number
  memoryDelta: number
  storyCount: number
  indexingTime: number
  firstRenderTime: number
}

export interface MemoryInfo {
  used: number
  total: number
  limit: number
}

export interface HealthStatus {
  healthy: boolean
  warnings: string[]
  memoryPressure: boolean
}

export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private enabled: boolean
  private memoryBaseline: number = 0
  private startTimes: Map<string, number> = new Map()

  constructor(enabled: boolean = import.meta.env.DEV) {
    this.enabled = enabled
    if (this.enabled) {
      this.memoryBaseline = this.measureMemory().used
    }
  }

  /**
   * Start measuring an operation
   */
  startMeasure(label: string): void {
    if (!this.enabled) return
    this.startTimes.set(label, performance.now())
  }

  /**
   * End measuring and record the duration
   */
  endMeasure(label: string): number {
    if (!this.enabled) return 0

    const startTime = this.startTimes.get(label)
    if (!startTime) {
      console.warn(`[PerformanceMonitor] No start time found for "${label}"`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.set(label, duration)
    this.startTimes.delete(label)

    return duration
  }

  /**
   * Measure current memory usage
   */
  measureMemory(): MemoryInfo {
    if ('memory' in performance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mem = (performance as any).memory
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
      }
    }

    // Fallback when memory API is not available
    return {
      used: 0,
      total: 0,
      limit: 0,
    }
  }

  /**
   * Collect all metrics into a single object
   */
  getMetrics(): PerformanceMetrics | null {
    if (!this.enabled) return null

    const memory = this.measureMemory()

    return {
      loadTime: this.metrics.get('load') || 0,
      parseTime: this.metrics.get('parse') || 0,
      memoryUsed: memory.used,
      memoryDelta: memory.used - this.memoryBaseline,
      storyCount: this.metrics.get('storyCount') || 0,
      indexingTime: this.metrics.get('indexing') || 0,
      firstRenderTime: this.metrics.get('firstRender') || 0,
    }
  }

  /**
   * Set a metric value directly
   */
  setMetric(label: string, value: number): void {
    if (!this.enabled) return
    this.metrics.set(label, value)
  }

  /**
   * Check system health based on metrics
   */
  checkHealth(): HealthStatus {
    const metrics = this.getMetrics()
    if (!metrics) {
      return { healthy: true, warnings: [], memoryPressure: false }
    }

    const warnings: string[] = []
    let memoryPressure = false

    // Check load time
    if (metrics.loadTime > 5000) {
      warnings.push(`Критически медленная загрузка: ${(metrics.loadTime / 1000).toFixed(1)}s`)
    } else if (metrics.loadTime > 3000) {
      warnings.push(`Медленная загрузка: ${(metrics.loadTime / 1000).toFixed(1)}s`)
    }

    // Check memory usage (only if API available)
    if (metrics.memoryUsed > 0) {
      const memoryMB = metrics.memoryUsed / (1024 * 1024)
      if (memoryMB > 300) {
        warnings.push(`Критическое использование памяти: ${memoryMB.toFixed(0)}MB`)
        memoryPressure = true
      } else if (memoryMB > 200) {
        warnings.push(`Высокое использование памяти: ${memoryMB.toFixed(0)}MB`)
        memoryPressure = true
      }
    }

    // Check parse time
    if (metrics.parseTime > 2000) {
      warnings.push(`Критически медленный парсинг: ${(metrics.parseTime / 1000).toFixed(1)}s`)
    } else if (metrics.parseTime > 1000) {
      warnings.push(`Медленный парсинг: ${(metrics.parseTime / 1000).toFixed(1)}s`)
    }

    return {
      healthy: warnings.length === 0,
      warnings,
      memoryPressure,
    }
  }

  /**
   * Log metrics to console in a formatted table
   */
  logMetrics(): void {
    if (!this.enabled) return

    const metrics = this.getMetrics()
    if (!metrics) return

    console.group('📊 Performance Metrics')
    console.table({
      'Load Time': `${(metrics.loadTime / 1000).toFixed(2)}s`,
      'Parse Time': `${(metrics.parseTime / 1000).toFixed(2)}s`,
      'Indexing Time': `${(metrics.indexingTime / 1000).toFixed(2)}s`,
      'First Render': `${(metrics.firstRenderTime / 1000).toFixed(2)}s`,
      'Story Count': metrics.storyCount.toLocaleString(),
      'Memory Used': `${(metrics.memoryUsed / (1024 * 1024)).toFixed(1)}MB`,
      'Memory Delta': `${(metrics.memoryDelta / (1024 * 1024)).toFixed(1)}MB`,
    })

    const health = this.checkHealth()
    if (!health.healthy) {
      console.warn('⚠️ Health Warnings:', health.warnings)
    } else {
      console.log('✅ Status: Healthy')
    }
    console.groupEnd()
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear()
    this.startTimes.clear()
    if (this.enabled) {
      this.memoryBaseline = this.measureMemory().used
    }
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()
