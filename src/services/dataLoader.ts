// ABOUTME: Specialized data loader with streaming, progress tracking, and retry logic
// ABOUTME: Handles large JSON files efficiently with error recovery strategies

/* eslint-disable no-undef */
import { NetworkError, ParseError, TimeoutError, ValidationError } from '../types/errors'
import type { StoriesData } from '../types/story'
import { logError } from '../utils/errorHandling'

export interface LoaderOptions {
  url: string
  timeout?: number
  retries?: number
  onProgress?: (loaded: number, total: number) => void
  signal?: AbortSignal
}

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

export class DataLoader {
  private readonly defaultTimeout = 30000 // 30 seconds for large files
  private readonly defaultRetries = 3

  /**
   * Fetch data with progress tracking using streaming
   */
  async fetchWithProgress(options: LoaderOptions): Promise<string> {
    const { url, timeout = this.defaultTimeout, onProgress, signal } = options

    // Create timeout controller
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

    // Combine user signal with timeout signal
    const combinedSignal = signal
      ? this.combineAbortSignals([signal, timeoutController.signal])
      : timeoutController.signal

    try {
      const response = await fetch(url, {
        signal: combinedSignal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new NetworkError(
          `Failed to fetch data: ${response.status} ${response.statusText}`,
          response.status
        )
      }

      // Get total size from Content-Length header
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      // Use streaming to track progress and reduce memory pressure
      if (response.body && total > 0) {
        return await this.readStreamWithProgress(response.body, total, onProgress, combinedSignal)
      }

      // Fallback to regular text() if streaming not available
      const text = await response.text()
      onProgress?.(text.length, text.length)
      return text
    } catch (error) {
      clearTimeout(timeoutId)

      if ((error as Error).name === 'AbortError') {
        if (signal?.aborted) {
          throw error // User-initiated abort
        }
        throw new TimeoutError(`Request timed out after ${timeout}ms`, timeout)
      }

      throw error
    }
  }

  /**
   * Read stream with progress tracking
   */
  private async readStreamWithProgress(
    body: ReadableStream<Uint8Array>,
    total: number,
    onProgress?: (loaded: number, total: number) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const reader = body.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0

    try {
      while (true) {
        // Check if aborted
        if (signal?.aborted) {
          reader.cancel()
          throw new Error('AbortError')
        }

        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        loaded += value.length

        onProgress?.(loaded, total)
      }

      // Combine chunks and decode
      const allChunks = new Uint8Array(loaded)
      let position = 0
      for (const chunk of chunks) {
        allChunks.set(chunk, position)
        position += chunk.length
      }

      return new TextDecoder('utf-8').decode(allChunks)
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Parse JSON with error handling
   */
  async parseJSON<T>(text: string): Promise<T> {
    try {
      // Use setTimeout to avoid blocking UI on large JSON parsing
      return await new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          try {
            const parsed = JSON.parse(text) as T
            resolve(parsed)
          } catch (error) {
            reject(error)
          }
        }, 0)
      })
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ParseError(`Failed to parse JSON: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Validate stories data structure
   */
  validateStoriesData(data: unknown): data is StoriesData {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid stories data: expected object')
    }

    const keys = Object.keys(data as Record<string, unknown>)

    if (keys.length === 0) {
      throw new ValidationError('No stories found in data')
    }

    // Check that keys are numeric IDs
    const invalidIds = keys.filter((id) => isNaN(parseInt(id, 10)))
    if (invalidIds.length > 0) {
      throw new ValidationError(`Invalid story IDs found: ${invalidIds.slice(0, 5).join(', ')}`)
    }

    // Validate a sample of stories are strings
    const sampleSize = Math.min(10, keys.length)
    for (let i = 0; i < sampleSize; i++) {
      const key = keys[i]
      const value = (data as Record<string, unknown>)[key]
      if (typeof value !== 'string') {
        throw new ValidationError(`Invalid story content at ID ${key}: expected string`)
      }
    }

    return true
  }

  /**
   * Fetch with retry logic using exponential backoff
   */
  async fetchWithRetry(
    options: LoaderOptions,
    retryOptions?: Partial<RetryOptions>
  ): Promise<string> {
    const {
      maxRetries = this.defaultRetries,
      baseDelay = 1000,
      maxDelay = 10000,
    } = retryOptions || {}

    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchWithProgress(options)
      } catch (error) {
        lastError = error as Error

        // Don't retry on non-retryable errors
        if (error instanceof ValidationError || error instanceof ParseError) {
          throw error
        }

        // Don't retry if user aborted
        if (options.signal?.aborted) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break
        }

        // Calculate backoff delay: min(baseDelay * 2^attempt, maxDelay)
        // In test mode, use zero delay to speed up tests
        const delay =
          import.meta.env.MODE === 'test' ? 0 : Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

        logError(lastError, {
          attempt: attempt + 1,
          maxRetries,
          retryAfter: delay,
        })

        // Wait before retry (skip in tests for speed)
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Fetch failed after retries')
  }

  /**
   * Load and parse stories data with all optimizations
   */
  async loadStories(options: LoaderOptions): Promise<StoriesData> {
    // Fetch with retry
    const text = await this.fetchWithRetry(options, {
      maxRetries: options.retries ?? this.defaultRetries,
      baseDelay: 1000,
      maxDelay: 10000,
    })

    // Parse JSON
    const data = await this.parseJSON<StoriesData>(text)

    // Validate
    if (this.validateStoriesData(data)) {
      return data
    }

    throw new ValidationError('Data validation failed')
  }

  /**
   * Combine multiple AbortSignals into one
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController()

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort()
        break
      }

      signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    return controller.signal
  }
}
