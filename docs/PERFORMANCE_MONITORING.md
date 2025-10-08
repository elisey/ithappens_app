# Performance Monitoring System

Complete implementation of performance monitoring for large dataset support (26MB, 13k+ stories).

## Components

### 1. PerformanceMonitor Service (`src/services/performanceMonitor.ts`)

Core monitoring service that tracks metrics and provides health checks.

**Features:**

- Automatic metric collection (load time, parse time, memory usage, etc.)
- Health status monitoring with configurable thresholds
- Memory API integration (when available)
- Console logging with formatted tables

**Thresholds:**

- Load Time: < 3s (good), 3-5s (warning), > 5s (critical)
- Memory: < 100MB (good), 100-200MB (warning), > 200MB (critical)
- Parse Time: < 1s (good), 1-2s (warning), > 2s (critical)

**Usage:**

```typescript
import { performanceMonitor } from './services/performanceMonitor'

// Start measuring
performanceMonitor.startMeasure('myOperation')

// ... perform operation ...

// End measuring
const duration = performanceMonitor.endMeasure('myOperation')

// Get all metrics
const metrics = performanceMonitor.getMetrics()

// Check health
const health = performanceMonitor.checkHealth()

// Log to console (dev mode only)
performanceMonitor.logMetrics()
```

### 2. DevPanel Component (`src/components/DevPanel.tsx`)

Compact development panel displayed in bottom-right corner (dev mode only).

**Features:**

- Collapsible panel
- Real-time metrics display
- Color-coded health status
- Warning/error messages

**Display:**

```
┌─────────────────────┐
│ 📊 Dev Metrics     ▼│
├─────────────────────┤
│ Load: 1.2s          │
│ Parse: 0.8s         │
│ Indexing: 0.1s      │
│ Memory: 45MB        │
│ Stories: 13,489     │
│ ✅ Healthy           │
└─────────────────────┘
```

### 3. usePerformanceMonitor Hook (`src/hooks/usePerformanceMonitor.ts`)

React hook for component-level monitoring.

**Features:**

- Automatic periodic updates (default: 5s)
- State management
- Health checks
- Production warning logs

**Usage:**

```typescript
const { metrics, health, startMeasure, endMeasure } = usePerformanceMonitor({
  updateInterval: 5000, // Optional
  enabled: true, // Optional
})
```

### 4. Memory Utilities (`src/utils/memoryUtils.ts`)

Helper functions for memory analysis.

**Functions:**

- `estimateObjectSize(obj)` - Estimate object size in bytes
- `detectMemoryLeaks(baseline, current, threshold)` - Detect memory leaks
- `getDeviceMemory()` - Get device memory capacity
- `suggestOptimizations(metrics)` - Get optimization suggestions
- `getOptimizationHints(metrics)` - Get hints with severity level
- `formatBytes(bytes)` - Format bytes to human-readable
- `getMemoryPressure(metrics)` - Calculate memory pressure

### 5. Analytics Collector (`src/services/analyticsCollector.ts`)

Local analytics collection (disabled by default, opt-in).

**Features:**

- Local-only storage (no external transmission)
- Percentile calculations (p50, p95, p99)
- CSV/JSON export
- Device memory tracking

**Usage:**

```typescript
import { analyticsCollector } from './services/analyticsCollector'

// Enable collection
analyticsCollector.setEnabled(true)

// Collect metrics
analyticsCollector.collectAnonymous(metrics)

// Get summary
const summary = analyticsCollector.getSummary()

// Export data
analyticsCollector.downloadExport('csv')
```

## Integration

### StoryService Integration

The `StoryService` automatically reports metrics to the performance monitor:

```typescript
// In storyService.ts
performanceMonitor.startMeasure('load')
// ... load data ...
performanceMonitor.endMeasure('load')

performanceMonitor.startMeasure('parse')
// ... parse JSON ...
performanceMonitor.endMeasure('parse')

performanceMonitor.setMetric('storyCount', storyCount)
```

### App Component Integration

The main app displays the DevPanel (dev mode only):

```typescript
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor'
import { DevPanel } from './components/DevPanel'

function App() {
  const { metrics, health, isEnabled } = usePerformanceMonitor()

  return (
    <>
      {/* App content */}
      <DevPanel metrics={metrics} health={health} isVisible={isEnabled} />
    </>
  )
}
```

## Environment-Based Behavior

Monitoring is automatically enabled in development mode:

- **Development (`import.meta.env.DEV === true`):**
  - PerformanceMonitor active
  - DevPanel visible
  - Console logging enabled
  - Detailed metrics tracking

- **Production (`import.meta.env.DEV === false`):**
  - Monitoring disabled (no overhead)
  - DevPanel hidden
  - Only critical warnings logged
  - Minimal performance impact

## Testing

### Memory Leak Tests (`tests/performance/memoryLeaks.test.ts`)

Comprehensive tests for memory stability:

- Navigation memory stability (1000+ operations)
- Repeated initialization (no leaks)
- Large dataset stability (10,000 stories)
- Circular navigation at boundaries
- Story content retrieval (1000+ calls)
- Metrics consistency
- Boundary conditions

### DevPanel Tests (`tests/components/DevPanel.test.tsx`)

Component tests covering:

- Visibility control
- Metrics display
- Health status rendering
- Time/memory formatting
- Warning messages
- Multiple warnings

## Metrics Collected

1. **Load Time** - Total time from start to data ready
2. **Parse Time** - JSON parsing duration
3. **Indexing Time** - Story ID sorting and indexing
4. **Memory Used** - Current heap size (if available)
5. **Memory Delta** - Change from baseline
6. **Story Count** - Number of stories loaded
7. **First Render Time** - Time to first render (if tracked)

## Performance Impact

- **Dev Mode:** Minimal impact (~1-2ms overhead per operation)
- **Production:** Zero impact (monitoring disabled)
- **Memory Overhead:** ~10KB (service + hooks)

## Best Practices

1. **Always use environment checks:**

   ```typescript
   if (import.meta.env.DEV) {
     performanceMonitor.logMetrics()
   }
   ```

2. **Use startMeasure/endMeasure for critical operations:**

   ```typescript
   performanceMonitor.startMeasure('criticalOperation')
   await criticalOperation()
   performanceMonitor.endMeasure('criticalOperation')
   ```

3. **Check health before reporting:**

   ```typescript
   const health = performanceMonitor.checkHealth()
   if (!health.healthy) {
     console.warn('Performance issues:', health.warnings)
   }
   ```

4. **Enable analytics only with user consent:**
   ```typescript
   if (userConsentedToAnalytics) {
     analyticsCollector.setEnabled(true)
   }
   ```

## Troubleshooting

### Memory API Not Available

If `performance.memory` is unavailable (e.g., Firefox):

- Memory metrics will show 0
- DevPanel will display "N/A"
- No errors, graceful degradation

### High Memory Usage Warnings

If you see memory warnings:

1. Check `getOptimizationHints()` for suggestions
2. Consider implementing virtual scrolling
3. Review data structure efficiency
4. Check for circular references

### Slow Load Times

If load times exceed thresholds:

1. Enable compression (gzip/brotli)
2. Consider progressive loading
3. Implement data streaming
4. Use Web Workers for parsing

## Future Enhancements

Potential improvements:

- Web Worker integration for indexing
- IndexedDB for very large datasets
- Virtual scrolling implementation
- Real-time FPS tracking
- Network speed detection
- Adaptive loading strategies
