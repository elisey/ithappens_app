// ABOUTME: Typed error classes for different error scenarios
// ABOUTME: Типизированные классы ошибок для различных сценариев

export enum ErrorType {
  NETWORK = 'NETWORK',
  PARSE = 'PARSE',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorSolution {
  title: string
  description: string
  action?: string
}

export abstract class BaseAppError extends Error {
  public readonly type: ErrorType
  public readonly userMessage: string
  public readonly solutions: ErrorSolution[]
  public readonly retryable: boolean
  public readonly timestamp: Date

  constructor(
    message: string,
    type: ErrorType,
    userMessage: string,
    solutions: ErrorSolution[] = [],
    retryable: boolean = false
  ) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.userMessage = userMessage
    this.solutions = solutions
    this.retryable = retryable
    this.timestamp = new Date()

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NetworkError extends BaseAppError {
  public readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    const userMessage = statusCode
      ? `Ошибка сети (${statusCode}). Проверьте подключение к интернету.`
      : 'Ошибка сети. Проверьте подключение к интернету.'

    const solutions: ErrorSolution[] = [
      {
        title: 'Проверьте интернет-соединение',
        description: 'Убедитесь, что устройство подключено к интернету',
      },
      {
        title: 'Повторите попытку',
        description: 'Возможно, это временная проблема',
        action: 'retry',
      },
    ]

    if (statusCode && statusCode >= 500) {
      solutions.push({
        title: 'Проблемы с сервером',
        description: 'Сервер временно недоступен. Попробуйте позже.',
      })
    }

    super(message, ErrorType.NETWORK, userMessage, solutions, true)
    this.statusCode = statusCode
  }
}

export class ParseError extends BaseAppError {
  constructor(message: string) {
    const userMessage = 'Ошибка обработки данных. Попробуйте перезагрузить страницу.'
    const solutions: ErrorSolution[] = [
      {
        title: 'Перезагрузите страницу',
        description: 'Данные могли быть повреждены при загрузке',
        action: 'reload',
      },
      {
        title: 'Очистите кеш браузера',
        description: 'Возможно, в кеше хранятся поврежденные данные',
      },
    ]

    super(message, ErrorType.PARSE, userMessage, solutions, false)
  }
}

export class NotFoundError extends BaseAppError {
  constructor(resource: string) {
    const message = `Resource not found: ${resource}`
    const userMessage = 'Запрашиваемые данные не найдены.'
    const solutions: ErrorSolution[] = [
      {
        title: 'Проверьте URL',
        description: 'Убедитесь, что адрес введен правильно',
      },
      {
        title: 'Свяжитесь с поддержкой',
        description: 'Если проблема повторяется, обратитесь к разработчикам',
      },
    ]

    super(message, ErrorType.NOT_FOUND, userMessage, solutions, false)
  }
}

export class TimeoutError extends BaseAppError {
  public readonly timeoutMs: number

  constructor(message: string, timeoutMs: number) {
    const userMessage = `Превышено время ожидания (${timeoutMs / 1000}с). Попробуйте еще раз.`
    const solutions: ErrorSolution[] = [
      {
        title: 'Проверьте скорость соединения',
        description: 'Медленное подключение может вызывать таймауты',
      },
      {
        title: 'Повторите попытку',
        description: 'Возможно, сервер был временно перегружен',
        action: 'retry',
      },
    ]

    super(message, ErrorType.TIMEOUT, userMessage, solutions, true)
    this.timeoutMs = timeoutMs
  }
}

export class UnknownError extends BaseAppError {
  constructor(originalError: Error) {
    const userMessage = 'Произошла неожиданная ошибка.'
    const solutions: ErrorSolution[] = [
      {
        title: 'Перезагрузите страницу',
        description: 'Это может решить временные проблемы',
        action: 'reload',
      },
      {
        title: 'Сообщите о проблеме',
        description: 'Опишите, что вы делали, когда возникла ошибка',
      },
    ]

    super(originalError.message, ErrorType.UNKNOWN, userMessage, solutions, true)
  }
}

export function createAppError(error: unknown): BaseAppError {
  if (error instanceof BaseAppError) {
    return error
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed')
  }

  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new ParseError('Failed to parse JSON response')
  }

  if (error instanceof Error) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return new NotFoundError(error.message)
    }

    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return new TimeoutError(error.message, 10000)
    }

    return new UnknownError(error)
  }

  return new UnknownError(new Error(String(error)))
}
