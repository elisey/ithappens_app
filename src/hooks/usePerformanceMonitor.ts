// ABOUTME: React hook for performance monitoring with automatic updates
// ABOUTME: Provides metrics collection, health checks, and periodic updates

/* eslint-disable no-undef */
import { useEffect, useState, useCallback } from 'preact/hooks'
import {
  performanceMonitor,
  type PerformanceMetrics,
  type HealthStatus,
} from '../services/performanceMonitor'

interface UsePerformanceMonitorOptions {
  updateInterval?: number // Update interval in ms (default: 5000)
  enabled?: boolean // Override enabled state
}

interface UsePerformanceMonitorResult {
  metrics: PerformanceMetrics | null
  health: HealthStatus | null
  isEnabled: boolean
  startMeasure: (label: string) => void
  endMeasure: (label: string) => number
  setMetric: (label: string, value: number) => void
  logMetrics: () => void
}

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): UsePerformanceMonitorResult {
  const { updateInterval = 5000, enabled } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)

  const isEnabled = enabled !== undefined ? enabled : performanceMonitor.isEnabled()

  // Update metrics periodically
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics()
      const currentHealth = performanceMonitor.checkHealth()

      setMetrics(currentMetrics)
      setHealth(currentHealth)

      // Log warnings in production
      if (!import.meta.env.DEV && currentHealth && !currentHealth.healthy) {
        console.warn('[PerformanceMonitor] Health warnings:', currentHealth.warnings)
      }
    }

    // Initial update
    updateMetrics()

    // Set up periodic updates
    const intervalId = setInterval(updateMetrics, updateInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [isEnabled, updateInterval])

  const startMeasure = useCallback((label: string) => {
    performanceMonitor.startMeasure(label)
  }, [])

  const endMeasure = useCallback((label: string) => {
    return performanceMonitor.endMeasure(label)
  }, [])

  const setMetric = useCallback((label: string, value: number) => {
    performanceMonitor.setMetric(label, value)
  }, [])

  const logMetrics = useCallback(() => {
    performanceMonitor.logMetrics()
  }, [])

  return {
    metrics,
    health,
    isEnabled,
    startMeasure,
    endMeasure,
    setMetric,
    logMetrics,
  }
}
