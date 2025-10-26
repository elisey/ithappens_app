// ABOUTME: Low-level utilities for safe localStorage operations with error handling
// ABOUTME: Provides safe wrappers around localStorage API with fallback strategies

/**
 * Safely retrieves an item from localStorage
 * @param key - The storage key to retrieve
 * @returns The stored value or null if unavailable/error
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return null
  }
}

/**
 * Safely stores an item in localStorage
 * @param key - The storage key
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'QuotaExceededError'
    ) {
      console.warn('localStorage quota exceeded')
    } else {
      console.warn('Failed to write to localStorage:', error)
    }
    return false
  }
}

/**
 * Safely removes an item from localStorage
 * @param key - The storage key to remove
 * @returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
    return false
  }
}

/**
 * Checks if localStorage is available and functional
 * @returns true if localStorage is available, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Calculates the total size of localStorage in bytes (UTF-16)
 * @returns The size in bytes, or 0 if unavailable
 */
export function getStorageSize(): number {
  let size = 0
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        size += (localStorage[key].length + key.length) * 2 // UTF-16
      }
    }
  } catch (error) {
    console.warn('Failed to calculate storage size:', error)
  }
  return size
}
