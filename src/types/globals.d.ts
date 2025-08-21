// ABOUTME: Global type declarations for browser APIs and Node.js globals
// ABOUTME: Глобальные объявления типов для браузерных API и глобальных объектов Node.js

// Browser APIs that might not be fully typed in some environments
declare global {
  // AbortController for request cancellation
  class AbortController {
    readonly signal: AbortSignal
    abort(): void
  }

  interface AbortSignal {
    readonly aborted: boolean
    addEventListener(type: 'abort', listener: () => void): void
    removeEventListener(type: 'abort', listener: () => void): void
  }

  // Fetch Response type (already well-typed but included for consistency)
  interface Response {
    readonly ok: boolean
    readonly status: number
    readonly statusText: string
    json(): Promise<unknown>
  }

  // Timer functions
  function setTimeout(callback: () => void, delay: number): number
  function clearTimeout(id: number): void

  // Browser event types
  interface MouseEvent {
    preventDefault(): void
  }

  // Global fetch function
  function fetch(
    input: string,
    init?: {
      signal?: AbortSignal
      headers?: Record<string, string>
    }
  ): Promise<Response>

  // Performance API for timing measurements
  const performance: {
    now(): number
    mark(name: string): void
    measure(measureName: string, startMark: string, endMark: string): void
    getEntriesByName(name: string): PerformanceEntry[]
    clearMarks(name: string): void
    clearMeasures(name: string): void
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }

  interface PerformanceEntry {
    name: string
    entryType: string
    startTime: number
    duration: number
  }
}

export {}
