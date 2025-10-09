// ABOUTME: Tests for DevPanel component displaying performance metrics
// ABOUTME: Validates rendering, collapsing, and metric display functionality

import { render, screen } from '@testing-library/preact'
import { describe, it, expect } from 'vitest'
import { DevPanel } from '../../src/components/DevPanel'
import type { PerformanceMetrics, HealthStatus } from '../../src/services/performanceMonitor'

describe('DevPanel', () => {
  const mockMetrics: PerformanceMetrics = {
    loadTime: 1234.56,
    parseTime: 1456.78,
    memoryUsed: 50 * 1024 * 1024, // 50MB
    memoryDelta: 10 * 1024 * 1024, // 10MB
    storyCount: 13489,
    indexingTime: 2123.45,
    firstRenderTime: 234.56,
  }

  const mockHealthHealthy: HealthStatus = {
    healthy: true,
    warnings: [],
    memoryPressure: false,
  }

  const mockHealthWarning: HealthStatus = {
    healthy: false,
    warnings: ['Slow loading: 3.5s'],
    memoryPressure: false,
  }

  const mockHealthCritical: HealthStatus = {
    healthy: false,
    warnings: ['Critical memory usage: 250MB'],
    memoryPressure: true,
  }

  describe('Visibility', () => {
    it('should not render when isVisible is false', () => {
      const { container } = render(
        <DevPanel metrics={mockMetrics} health={mockHealthHealthy} isVisible={false} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should render when isVisible is true', () => {
      render(<DevPanel metrics={mockMetrics} health={mockHealthHealthy} isVisible={true} />)
      expect(screen.getByText('📊 Dev Metrics')).toBeInTheDocument()
    })
  })

  describe('Metrics Display', () => {
    it('should display all metrics when provided', () => {
      render(<DevPanel metrics={mockMetrics} health={mockHealthHealthy} isVisible={true} />)

      expect(screen.getByText('1.2s')).toBeInTheDocument() // Load time
      expect(screen.getByText('1.5s')).toBeInTheDocument() // Parse time
      expect(screen.getByText('2.1s')).toBeInTheDocument() // Indexing time
      expect(screen.getByText('50MB')).toBeInTheDocument() // Memory
      expect(screen.getByText('13,489')).toBeInTheDocument() // Story count
    })

    it('should show "No metrics available" when metrics is null', () => {
      render(<DevPanel metrics={null} health={null} isVisible={true} />)
      expect(screen.getByText('No metrics available')).toBeInTheDocument()
    })
  })

  describe('Health Status', () => {
    it('should show healthy status', () => {
      render(<DevPanel metrics={mockMetrics} health={mockHealthHealthy} isVisible={true} />)
      expect(screen.getByText('✅ Healthy')).toBeInTheDocument()
    })

    it('should show warning status', () => {
      render(<DevPanel metrics={mockMetrics} health={mockHealthWarning} isVisible={true} />)
      expect(screen.getByText('⚠️ Warning')).toBeInTheDocument()
      expect(screen.getByText('Slow loading: 3.5s')).toBeInTheDocument()
    })

    it('should show critical status', () => {
      render(<DevPanel metrics={mockMetrics} health={mockHealthCritical} isVisible={true} />)
      expect(screen.getByText('⚠️ Critical')).toBeInTheDocument()
      expect(screen.getByText('Critical memory usage: 250MB')).toBeInTheDocument()
    })
  })

  describe('Formatting', () => {
    it('should format time values correctly', () => {
      const metricsWithMs: PerformanceMetrics = {
        ...mockMetrics,
        loadTime: 456, // Less than 1000ms
      }
      render(<DevPanel metrics={metricsWithMs} health={mockHealthHealthy} isVisible={true} />)
      expect(screen.getByText('456ms')).toBeInTheDocument()
    })

    it('should handle zero memory values', () => {
      const metricsWithNoMemory: PerformanceMetrics = {
        ...mockMetrics,
        memoryUsed: 0,
      }
      render(<DevPanel metrics={metricsWithNoMemory} health={mockHealthHealthy} isVisible={true} />)
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Warnings Display', () => {
    it('should display multiple warnings', () => {
      const healthWithMultipleWarnings: HealthStatus = {
        healthy: false,
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
        memoryPressure: false,
      }
      render(
        <DevPanel metrics={mockMetrics} health={healthWithMultipleWarnings} isVisible={true} />
      )
      expect(screen.getByText('Warning 1')).toBeInTheDocument()
      expect(screen.getByText('Warning 2')).toBeInTheDocument()
      expect(screen.getByText('Warning 3')).toBeInTheDocument()
    })

    it('should not display warnings section when healthy', () => {
      const { container } = render(
        <DevPanel metrics={mockMetrics} health={mockHealthHealthy} isVisible={true} />
      )
      const warningsSection = container.querySelector('[class*="warnings"]')
      expect(warningsSection).toBeNull()
    })
  })
})
