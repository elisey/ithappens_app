// ABOUTME: Development panel component for displaying performance metrics
// ABOUTME: Shows load time, memory usage, story count, and health status in dev mode

import { useState } from 'preact/hooks'
import type { PerformanceMetrics, HealthStatus } from '../services/performanceMonitor'
import styles from './DevPanel.module.css'

interface DevPanelProps {
  metrics: PerformanceMetrics | null
  health: HealthStatus | null
  isVisible: boolean
}

export function DevPanel({ metrics, health, isVisible }: DevPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!isVisible) {
    return null
  }

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (!metrics || !health) {
    return (
      <div className={styles.devPanel}>
        <div className={styles.header} onClick={toggleCollapsed}>
          <div className={styles.title}>📊 Dev Metrics</div>
          <button className={styles.toggleButton} aria-label="Toggle panel">
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
        <div className={styles.noData}>No metrics available</div>
      </div>
    )
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`
    }
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatMemory = (bytes: number) => {
    if (bytes === 0) return 'N/A'
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
  }

  const getStatusClass = () => {
    if (!health.healthy) {
      return health.memoryPressure ? styles.critical : styles.warning
    }
    return styles.healthy
  }

  const getStatusText = () => {
    if (!health.healthy) {
      return health.memoryPressure ? '⚠️ Critical' : '⚠️ Warning'
    }
    return '✅ Healthy'
  }

  return (
    <div className={`${styles.devPanel} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header} onClick={toggleCollapsed}>
        <div className={styles.title}>📊 Dev Metrics</div>
        <button className={styles.toggleButton} aria-label="Toggle panel">
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Load:</span>
          <span className={styles.metricValue}>{formatTime(metrics.loadTime)}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Parse:</span>
          <span className={styles.metricValue}>{formatTime(metrics.parseTime)}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Indexing:</span>
          <span className={styles.metricValue}>{formatTime(metrics.indexingTime)}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Memory:</span>
          <span className={styles.metricValue}>{formatMemory(metrics.memoryUsed)}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Stories:</span>
          <span className={styles.metricValue}>{metrics.storyCount.toLocaleString()}</span>
        </div>

        <div className={`${styles.status} ${getStatusClass()}`}>{getStatusText()}</div>

        {health.warnings.length > 0 && (
          <div className={styles.warnings}>
            {health.warnings.map((warning, index) => (
              <div key={index} className={styles.warningItem}>
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
