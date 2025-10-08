// ABOUTME: Analytics collection service for performance metrics (local storage only)
// ABOUTME: Collects anonymous metrics for analysis and provides export functionality

/* eslint-disable no-undef */
import type { PerformanceMetrics } from './performanceMonitor'

interface MetricRecord {
  timestamp: number
  metrics: PerformanceMetrics
  userAgent: string
  deviceMemory: number | null
}

interface AnalyticsSummary {
  totalRecords: number
  averageLoadTime: number
  averageMemoryUsage: number
  p50LoadTime: number
  p95LoadTime: number
  p99LoadTime: number
  deviceMemoryDistribution: Map<number, number>
}

export class AnalyticsCollector {
  private readonly STORAGE_KEY = 'performance_analytics'
  private readonly MAX_RECORDS = 100 // Keep last 100 records
  private enabled: boolean

  constructor(enabled: boolean = false) {
    this.enabled = enabled
  }

  /**
   * Enable or disable analytics collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      // Clear data when disabled
      this.clearAll()
    }
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Collect metrics locally (no external transmission)
   */
  collectAnonymous(metrics: PerformanceMetrics): void {
    if (!this.enabled) {
      return
    }

    try {
      const record: MetricRecord = {
        timestamp: Date.now(),
        metrics,
        userAgent: navigator.userAgent,
        deviceMemory: this.getDeviceMemory(),
      }

      const records = this.loadRecords()
      records.push(record)

      // Keep only last MAX_RECORDS
      const trimmedRecords = records.slice(-this.MAX_RECORDS)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedRecords))
    } catch (error) {
      console.warn('[AnalyticsCollector] Failed to save metrics:', error)
    }
  }

  /**
   * Save metrics with custom note
   */
  saveLocal(metrics: PerformanceMetrics, note?: string): void {
    if (!this.enabled) {
      return
    }

    try {
      const record: MetricRecord & { note?: string } = {
        timestamp: Date.now(),
        metrics,
        userAgent: navigator.userAgent,
        deviceMemory: this.getDeviceMemory(),
        note,
      }

      const records = this.loadRecords()
      records.push(record)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records.slice(-this.MAX_RECORDS)))
    } catch (error) {
      console.warn('[AnalyticsCollector] Failed to save metrics:', error)
    }
  }

  /**
   * Load all stored records
   */
  private loadRecords(): MetricRecord[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) {
        return []
      }
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  /**
   * Get analytics summary
   */
  getSummary(): AnalyticsSummary | null {
    const records = this.loadRecords()
    if (records.length === 0) {
      return null
    }

    const loadTimes = records.map((r) => r.metrics.loadTime).sort((a, b) => a - b)
    const memoryUsages = records.map((r) => r.metrics.memoryUsed)

    const p50Index = Math.floor(loadTimes.length * 0.5)
    const p95Index = Math.floor(loadTimes.length * 0.95)
    const p99Index = Math.floor(loadTimes.length * 0.99)

    const deviceMemoryDistribution = new Map<number, number>()
    records.forEach((r) => {
      if (r.deviceMemory !== null) {
        const count = deviceMemoryDistribution.get(r.deviceMemory) || 0
        deviceMemoryDistribution.set(r.deviceMemory, count + 1)
      }
    })

    return {
      totalRecords: records.length,
      averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
      averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      p50LoadTime: loadTimes[p50Index],
      p95LoadTime: loadTimes[p95Index],
      p99LoadTime: loadTimes[p99Index],
      deviceMemoryDistribution,
    }
  }

  /**
   * Export metrics as CSV
   */
  exportCSV(): string {
    const records = this.loadRecords()
    if (records.length === 0) {
      return ''
    }

    const headers = [
      'timestamp',
      'loadTime',
      'parseTime',
      'indexingTime',
      'memoryUsed',
      'memoryDelta',
      'storyCount',
      'deviceMemory',
    ]

    const rows = records.map((r) => [
      new Date(r.timestamp).toISOString(),
      r.metrics.loadTime.toFixed(2),
      r.metrics.parseTime.toFixed(2),
      r.metrics.indexingTime.toFixed(2),
      r.metrics.memoryUsed,
      r.metrics.memoryDelta,
      r.metrics.storyCount,
      r.deviceMemory ?? 'N/A',
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    return csv
  }

  /**
   * Export metrics as JSON
   */
  exportJSON(): string {
    const records = this.loadRecords()
    return JSON.stringify(records, null, 2)
  }

  /**
   * Clear all stored analytics
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('[AnalyticsCollector] Failed to clear analytics:', error)
    }
  }

  /**
   * Get device memory if available
   */
  private getDeviceMemory(): number | null {
    if ('deviceMemory' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (navigator as any).deviceMemory
    }
    return null
  }

  /**
   * Download exported data as file
   */
  downloadExport(format: 'csv' | 'json' = 'csv'): void {
    const data = format === 'csv' ? this.exportCSV() : this.exportJSON()
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${Date.now()}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Export singleton instance (disabled by default)
export const analyticsCollector = new AnalyticsCollector(false)
