// ABOUTME: Application configuration system for dataset selection and performance settings
// ABOUTME: Handles environment-based URL selection and performance monitoring configuration

interface AppConfig {
  storiesUrl: string
  isDevelopment: boolean
  enablePerformanceLogging: boolean
  maxLoadingTime: number // ms
  retryAttempts: number
  retryDelay: number // ms
}

/**
 * Get application configuration based on environment variables
 */
export function getAppConfig(): AppConfig {
  const isDevelopment = import.meta.env.DEV
  const useSampleData = import.meta.env.VITE_USE_SAMPLE_DATA === 'true'
  const enablePerfLogging = import.meta.env.VITE_ENABLE_PERF_LOGGING === 'true'

  // Determine stories URL based on environment and configuration
  let storiesUrl: string
  if (useSampleData) {
    storiesUrl = '/stories.json.sample'
  } else {
    storiesUrl = '/stories.json'
  }

  return {
    storiesUrl,
    isDevelopment,
    enablePerformanceLogging: enablePerfLogging || isDevelopment,
    maxLoadingTime: 30000, // 30 seconds for large dataset
    retryAttempts: 3,
    retryDelay: 1000, // 1 second between retries
  }
}

/**
 * Get fallback URL when primary dataset fails to load
 */
export function getFallbackStoriesUrl(): string {
  return '/stories.json.sample'
}

export type { AppConfig }
