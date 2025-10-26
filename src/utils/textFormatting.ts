// ABOUTME: Text formatting utilities for story display
// ABOUTME: Provides functions for line breaks, HTML escaping, and text analysis

/**
 * Formats text by preserving line breaks for display
 * @param text - The text to format
 * @returns The formatted text with preserved line breaks
 */
export function formatLineBreaks(text: string): string {
  return text
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns The escaped text safe for HTML display
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return text.replace(/[&<>"']/g, (match) => htmlEscapeMap[match] || match)
}

/**
 * Counts the number of lines in a text
 * @param text - The text to analyze
 * @returns The number of lines
 */
export function countLines(text: string): number {
  if (text.length === 0) {
    return 0
  }

  const lines = text.split('\n')
  return lines.length
}

/**
 * Determines if a story is considered long
 * @param text - The story text
 * @param threshold - Character count threshold (default: 1000)
 * @returns True if the story is long
 */
export function isLongStory(text: string, threshold: number = 1000): boolean {
  if (text.length === 0) {
    return false
  }

  // Consider long if exceeds character threshold or has many lines
  const lineCount = countLines(text)
  return text.length > threshold || lineCount > 30
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns The truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length === 0) {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + suffix
}
