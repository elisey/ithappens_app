// ABOUTME: Tests for error types and utilities
// ABOUTME: Тесты для типов ошибок и утилит

import {
  NetworkError,
  ParseError,
  NotFoundError,
  TimeoutError,
  UnknownError,
  createAppError,
  ErrorType,
} from './errors'

describe('Error Types', () => {
  describe('NetworkError', () => {
    it('creates network error with default message', () => {
      const error = new NetworkError('Failed to fetch')

      expect(error.type).toBe(ErrorType.NETWORK)
      expect(error.retryable).toBe(true)
      expect(error.userMessage).toContain('Ошибка сети')
      expect(error.solutions).toHaveLength(2)
      expect(error.solutions[0].title).toContain('интернет-соединение')
    })

    it('creates network error with status code', () => {
      const error = new NetworkError('Server error', 500)

      expect(error.statusCode).toBe(500)
      expect(error.userMessage).toContain('(500)')
      expect(error.solutions).toHaveLength(3) // Includes server error solution
      expect(error.solutions[2].description).toContain('Сервер временно недоступен')
    })
  })

  describe('ParseError', () => {
    it('creates parse error with correct properties', () => {
      const error = new ParseError('JSON malformed')

      expect(error.type).toBe(ErrorType.PARSE)
      expect(error.retryable).toBe(false)
      expect(error.userMessage).toContain('Ошибка обработки данных')
      expect(error.solutions).toHaveLength(2)
      expect(error.solutions[0].action).toBe('reload')
    })
  })

  describe('NotFoundError', () => {
    it('creates not found error with resource info', () => {
      const error = new NotFoundError('/api/stories')

      expect(error.type).toBe(ErrorType.NOT_FOUND)
      expect(error.retryable).toBe(false)
      expect(error.message).toContain('/api/stories')
      expect(error.userMessage).toContain('не найдены')
      expect(error.solutions).toHaveLength(2)
    })
  })

  describe('TimeoutError', () => {
    it('creates timeout error with timeout info', () => {
      const error = new TimeoutError('Request timeout', 5000)

      expect(error.type).toBe(ErrorType.TIMEOUT)
      expect(error.retryable).toBe(true)
      expect(error.timeoutMs).toBe(5000)
      expect(error.userMessage).toContain('5с')
      expect(error.solutions).toHaveLength(2)
    })
  })

  describe('UnknownError', () => {
    it('creates unknown error from generic error', () => {
      const originalError = new Error('Something went wrong')
      const error = new UnknownError(originalError)

      expect(error.type).toBe(ErrorType.UNKNOWN)
      expect(error.retryable).toBe(true)
      expect(error.message).toBe('Something went wrong')
      expect(error.userMessage).toContain('Произошла неожиданная ошибка')
      expect(error.solutions).toHaveLength(2)
    })
  })

  describe('createAppError', () => {
    it('returns existing BaseAppError as is', () => {
      const networkError = new NetworkError('Test')
      const result = createAppError(networkError)

      expect(result).toBe(networkError)
    })

    it('converts TypeError with fetch to NetworkError', () => {
      const fetchError = new TypeError('Failed to fetch')
      const result = createAppError(fetchError)

      expect(result).toBeInstanceOf(NetworkError)
      expect(result.type).toBe(ErrorType.NETWORK)
    })

    it('converts SyntaxError with JSON to ParseError', () => {
      const jsonError = new SyntaxError('Unexpected token in JSON')
      const result = createAppError(jsonError)

      expect(result).toBeInstanceOf(ParseError)
      expect(result.type).toBe(ErrorType.PARSE)
    })

    it('converts 404 error to NotFoundError', () => {
      const notFoundError = new Error('404 Not Found')
      const result = createAppError(notFoundError)

      expect(result).toBeInstanceOf(NotFoundError)
      expect(result.type).toBe(ErrorType.NOT_FOUND)
    })

    it('converts timeout error to TimeoutError', () => {
      const timeoutError = new Error('Request timeout')
      const result = createAppError(timeoutError)

      expect(result).toBeInstanceOf(TimeoutError)
      expect(result.type).toBe(ErrorType.TIMEOUT)
    })

    it('converts generic Error to UnknownError', () => {
      const genericError = new Error('Generic error')
      const result = createAppError(genericError)

      expect(result).toBeInstanceOf(UnknownError)
      expect(result.type).toBe(ErrorType.UNKNOWN)
    })

    it('converts non-Error values to UnknownError', () => {
      const result1 = createAppError('string error')
      const result2 = createAppError(null)
      const result3 = createAppError(undefined)

      expect(result1).toBeInstanceOf(UnknownError)
      expect(result2).toBeInstanceOf(UnknownError)
      expect(result3).toBeInstanceOf(UnknownError)
    })
  })

  describe('Error properties', () => {
    it('all errors have timestamp', () => {
      const error = new NetworkError('Test')
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('all errors have proper prototype chain', () => {
      const networkError = new NetworkError('Test')
      const parseError = new ParseError('Test')

      expect(networkError instanceof NetworkError).toBe(true)
      expect(networkError instanceof Error).toBe(true)
      expect(parseError instanceof ParseError).toBe(true)
      expect(parseError instanceof Error).toBe(true)
    })

    it('error solutions have required properties', () => {
      const error = new NetworkError('Test')

      error.solutions.forEach((solution) => {
        expect(typeof solution.title).toBe('string')
        expect(typeof solution.description).toBe('string')
        if (solution.action) {
          expect(typeof solution.action).toBe('string')
        }
      })
    })
  })
})
