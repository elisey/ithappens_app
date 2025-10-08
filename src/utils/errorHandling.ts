// ABOUTME: Utility functions for error categorization and user-friendly messaging
// ABOUTME: Утилиты для категоризации ошибок и создания понятных сообщений

import {
  BaseAppError,
  ErrorType,
  NetworkError,
  ParseError,
  ValidationError,
  TimeoutError,
  NotFoundError,
  UnknownError,
} from '../types/errors'

export interface ErrorCategory {
  type: ErrorType
  userMessage: string
  canRetry: boolean
  suggestedAction: string
}

/**
 * Categorize an error and provide user-friendly information
 */
export function categorizeError(error: Error): ErrorCategory {
  if (error instanceof BaseAppError) {
    const suggestedAction = error.solutions.find((s) => s.action)?.action || 'none'

    return {
      type: error.type,
      userMessage: error.userMessage,
      canRetry: error.retryable,
      suggestedAction,
    }
  }

  // Handle non-app errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      userMessage: 'Ошибка сети. Проверьте подключение к интернету.',
      canRetry: true,
      suggestedAction: 'retry',
    }
  }

  if (error instanceof SyntaxError) {
    return {
      type: ErrorType.PARSE,
      userMessage: 'Ошибка обработки данных. Попробуйте перезагрузить страницу.',
      canRetry: false,
      suggestedAction: 'reload',
    }
  }

  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      userMessage: 'Превышено время ожидания. Попробуйте еще раз.',
      canRetry: true,
      suggestedAction: 'retry',
    }
  }

  return {
    type: ErrorType.UNKNOWN,
    userMessage: 'Произошла неожиданная ошибка.',
    canRetry: true,
    suggestedAction: 'reload',
  }
}

/**
 * Format error message for display to user
 */
export function formatErrorMessage(error: Error): string {
  if (error instanceof BaseAppError) {
    return error.userMessage
  }

  const category = categorizeError(error)
  return category.userMessage
}

/**
 * Determine if an error is recoverable with retry
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof BaseAppError) {
    return error.retryable
  }

  const category = categorizeError(error)
  return category.canRetry
}

/**
 * Create appropriate error instance based on error characteristics
 */
export function createTypedError(error: unknown): BaseAppError {
  if (error instanceof BaseAppError) {
    return error
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed')
  }

  if (error instanceof SyntaxError) {
    return new ParseError(`Failed to parse data: ${error.message}`)
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new TimeoutError(error.message, 10000)
    }

    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return new NotFoundError(error.message)
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message)
    }

    return new UnknownError(error)
  }

  return new UnknownError(new Error(String(error)))
}

/**
 * Log error with context for debugging
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('[Error]', error.name, error.message, context)

    if (error instanceof BaseAppError) {
      console.error('[Error Details]', {
        type: error.type,
        retryable: error.retryable,
        solutions: error.solutions,
        timestamp: error.timestamp,
      })
    }

    if (error.stack) {
      console.error('[Stack Trace]', error.stack)
    }
  }
}
