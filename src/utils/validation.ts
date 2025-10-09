// ABOUTME: Validation utilities for story ID input in jump modal
// ABOUTME: Provides input sanitization, validation, and user hints

export interface ValidationResult {
  isValid: boolean
  value?: number
  error?: string
}

/**
 * Sanitizes user input by removing whitespace and non-numeric characters
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/\D/g, '')
}

/**
 * Checks if a given ID exists in the available IDs list
 */
export function isValidStoryId(id: number, availableIds: number[]): boolean {
  return availableIds.includes(id)
}

/**
 * Validates story ID input and returns structured result
 */
export function validateStoryIdInput(input: string, availableIds: number[]): ValidationResult {
  const sanitized = sanitizeInput(input)

  if (sanitized === '') {
    return {
      isValid: false,
      error: 'Please enter a story ID',
    }
  }

  const numericValue = parseInt(sanitized, 10)

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: 'Please enter a valid number',
    }
  }

  if (numericValue < 1) {
    return {
      isValid: false,
      error: 'Story ID must be greater than 0',
    }
  }

  if (!isValidStoryId(numericValue, availableIds)) {
    return {
      isValid: false,
      value: numericValue,
      error: `Story #${numericValue} does not exist`,
    }
  }

  return {
    isValid: true,
    value: numericValue,
  }
}

/**
 * Provides helpful hints for the user based on available IDs
 */
export function getValidationHint(input: string, availableIds: number[]): string {
  if (availableIds.length === 0) {
    return 'No stories available'
  }

  const min = Math.min(...availableIds)
  const max = Math.max(...availableIds)

  if (input === '') {
    return `Enter ID from ${min} to ${max}`
  }

  const sanitized = sanitizeInput(input)
  if (sanitized === '') {
    return `Enter ID from ${min} to ${max}`
  }

  const value = parseInt(sanitized, 10)
  if (isNaN(value)) {
    return 'Please enter a valid number'
  }

  if (value < min) {
    return `Minimum ID is ${min}`
  }

  if (value > max) {
    return `Maximum ID is ${max}`
  }

  return ''
}
