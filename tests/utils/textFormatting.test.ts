// ABOUTME: Test suite for text formatting utilities
// ABOUTME: Tests line break conversion, HTML escaping, and text analysis functions
import { describe, it, expect } from 'vitest'
import {
  formatLineBreaks,
  escapeHtml,
  countLines,
  isLongStory,
  truncateText,
} from '../../src/utils/textFormatting'

describe('Text Formatting', () => {
  describe('formatLineBreaks', () => {
    it('converts \\n to proper line breaks', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const result = formatLineBreaks(text)
      expect(result).toBe('Line 1\nLine 2\nLine 3')
    })

    it('handles multiple consecutive line breaks', () => {
      const text = 'Paragraph 1\n\n\nParagraph 2'
      const result = formatLineBreaks(text)
      expect(result).toBe('Paragraph 1\n\n\nParagraph 2')
    })

    it('handles empty string', () => {
      expect(formatLineBreaks('')).toBe('')
    })

    it('handles text without line breaks', () => {
      const text = 'Single line text'
      expect(formatLineBreaks(text)).toBe(text)
    })

    it('preserves spaces around line breaks', () => {
      const text = 'Line 1 \n Line 2'
      expect(formatLineBreaks(text)).toBe('Line 1 \n Line 2')
    })
  })

  describe('escapeHtml', () => {
    it('escapes < > & characters', () => {
      const text = '<script>alert("XSS")</script>'
      const result = escapeHtml(text)
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
    })

    it('escapes ampersands', () => {
      const text = 'Tom & Jerry'
      expect(escapeHtml(text)).toBe('Tom &amp; Jerry')
    })

    it('escapes quotes', () => {
      const text = 'She said "Hello"'
      expect(escapeHtml(text)).toBe('She said &quot;Hello&quot;')
    })

    it('escapes apostrophes', () => {
      const text = "It's a test"
      expect(escapeHtml(text)).toBe('It&#39;s a test')
    })

    it('handles empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('handles text without special characters', () => {
      const text = 'Normal text without special chars'
      expect(escapeHtml(text)).toBe(text)
    })

    it('handles multiple special characters', () => {
      const text = '<div class="test">&nbsp;</div>'
      const result = escapeHtml(text)
      expect(result).toBe('&lt;div class=&quot;test&quot;&gt;&amp;nbsp;&lt;/div&gt;')
    })
  })

  describe('countLines', () => {
    it('counts lines correctly', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      expect(countLines(text)).toBe(3)
    })

    it('counts single line', () => {
      expect(countLines('Single line')).toBe(1)
    })

    it('counts empty string as zero lines', () => {
      expect(countLines('')).toBe(0)
    })

    it('handles multiple consecutive line breaks', () => {
      const text = 'Line 1\n\n\nLine 2'
      expect(countLines(text)).toBe(4)
    })

    it('handles text ending with line break', () => {
      const text = 'Line 1\nLine 2\n'
      expect(countLines(text)).toBe(3)
    })
  })

  describe('isLongStory', () => {
    it('identifies long stories', () => {
      const longText = 'a'.repeat(2000)
      expect(isLongStory(longText)).toBe(true)
    })

    it('identifies short stories', () => {
      const shortText = 'Short story text'
      expect(isLongStory(shortText)).toBe(false)
    })

    it('uses custom threshold', () => {
      const text = 'a'.repeat(100)
      expect(isLongStory(text, 50)).toBe(true)
      expect(isLongStory(text, 150)).toBe(false)
    })

    it('handles empty string', () => {
      expect(isLongStory('')).toBe(false)
    })

    it('considers stories with many lines as long', () => {
      const text = Array(50).fill('Line').join('\n')
      expect(isLongStory(text)).toBe(true)
    })
  })

  describe('truncateText', () => {
    it('truncates text with ellipsis', () => {
      const text = 'This is a very long text that needs to be truncated'
      const result = truncateText(text, 20)
      expect(result).toBe('This is a very long ...')
      expect(result.length).toBe(23) // 20 + '...'
    })

    it('does not truncate short text', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe(text)
    })

    it('uses custom suffix', () => {
      const text = 'This is a long text'
      const result = truncateText(text, 10, '…')
      expect(result).toBe('This is a …')
    })

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })

    it('handles maxLength of 0', () => {
      expect(truncateText('text', 0)).toBe('...')
    })

    it('truncates at word boundary when possible', () => {
      const text = 'This is a very long text'
      const result = truncateText(text, 15)
      expect(result).toMatch(/\.\.\.$/)
    })
  })
})
