// ABOUTME: Tests for data validation utilities for stories.json structure and integrity
// ABOUTME: Comprehensive test coverage for validation logic, error cases, and statistics

import { validateStoriesFile, formatValidationResult } from '@/utils/dataValidator'
import { describe, it, expect } from 'vitest'

describe('dataValidator', () => {
  describe('validateStoriesFile', () => {
    describe('basic validation', () => {
      it('should reject null data', () => {
        const result = validateStoriesFile(null)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Data is not an object')
      })

      it('should reject non-object data', () => {
        const result = validateStoriesFile('not an object')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Data is not an object')
      })

      it('should reject non-array data', () => {
        const result = validateStoriesFile({ not: 'array' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Data is not an array')
      })

      it('should reject empty array', () => {
        const result = validateStoriesFile([])
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Stories array is empty')
      })

      it('should accept valid stories array', () => {
        const data = [
          { id: 1, text: 'First story' },
          { id: 2, text: 'Second story' },
        ]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('story structure validation', () => {
      it('should reject non-object story', () => {
        const data = ['not an object']
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Story at index 0 is not an object')
      })

      it('should reject story without id field', () => {
        const data = [{ text: 'No ID' }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain("Story at index 0 is missing 'id' field")
      })

      it('should reject story without text field', () => {
        const data = [{ id: 1 }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain("Story 1 at index 0 is missing 'text' field")
      })
    })

    describe('ID validation', () => {
      it('should reject non-numeric id', () => {
        const data = [{ id: 'not a number', text: 'Story' }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors[0]).toContain('has non-numeric id')
      })

      it('should reject non-integer id', () => {
        const data = [{ id: 1.5, text: 'Story' }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Story at index 0 has non-integer id: 1.5')
      })

      it('should reject negative id', () => {
        const data = [{ id: -1, text: 'Story' }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Story at index 0 has negative id: -1')
      })

      it('should detect duplicate IDs', () => {
        const data = [
          { id: 1, text: 'First' },
          { id: 1, text: 'Duplicate' },
          { id: 2, text: 'Second' },
        ]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors[0]).toContain('1 duplicate IDs found')
        expect(result.stats.duplicateIds).toContain(1)
      })

      it('should detect multiple duplicate IDs', () => {
        const data = [
          { id: 1, text: 'First' },
          { id: 1, text: 'Duplicate 1' },
          { id: 2, text: 'Second' },
          { id: 2, text: 'Duplicate 2' },
        ]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.stats.duplicateIds).toEqual([1, 2])
      })
    })

    describe('text validation', () => {
      it('should reject non-string text', () => {
        const data = [{ id: 1, text: 123 }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Story 1 at index 0 has non-string text')
      })

      it('should warn about empty text', () => {
        const data = [{ id: 1, text: '' }]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(true)
        expect(result.warnings).toContain('Story 1 has empty text')
        expect(result.stats.storiesWithoutText).toBe(1)
      })

      it('should count multiple stories without text', () => {
        const data = [
          { id: 1, text: '' },
          { id: 2, text: '' },
          { id: 3, text: 'Has text' },
        ]
        const result = validateStoriesFile(data)
        expect(result.warnings).toContain('2 stories have empty text')
        expect(result.stats.storiesWithoutText).toBe(2)
      })
    })

    describe('statistics', () => {
      it('should calculate correct total stories', () => {
        const data = [
          { id: 1, text: 'First' },
          { id: 2, text: 'Second' },
          { id: 3, text: 'Third' },
        ]
        const result = validateStoriesFile(data)
        expect(result.stats.totalStories).toBe(3)
      })

      it('should calculate min and max IDs', () => {
        const data = [
          { id: 5, text: 'Story' },
          { id: 1, text: 'Story' },
          { id: 10, text: 'Story' },
        ]
        const result = validateStoriesFile(data)
        expect(result.stats.minId).toBe(1)
        expect(result.stats.maxId).toBe(10)
      })

      it('should detect missing IDs in sequence', () => {
        const data = [
          { id: 1, text: 'Story' },
          { id: 3, text: 'Story' },
          { id: 5, text: 'Story' },
        ]
        const result = validateStoriesFile(data)
        expect(result.stats.missingIds).toEqual([2, 4])
        expect(result.warnings[0]).toContain('2 missing IDs in sequence (1-5)')
      })

      it('should calculate average story length', () => {
        const data = [
          { id: 1, text: '12345' }, // 5 chars
          { id: 2, text: '1234567890' }, // 10 chars
          { id: 3, text: '123' }, // 3 chars
        ]
        const result = validateStoriesFile(data)
        expect(result.stats.averageStoryLength).toBe(6) // (5+10+3)/3 = 6
      })

      it('should estimate file size', () => {
        const data = [{ id: 1, text: 'Story' }]
        const result = validateStoriesFile(data)
        expect(result.stats.fileSize).toBeGreaterThan(0)
      })
    })

    describe('warnings', () => {
      it('should warn about large file size', () => {
        const largeText = 'a'.repeat(10 * 1024 * 1024) // 10MB of text
        const data = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          text: largeText,
        }))
        const result = validateStoriesFile(data)
        expect(result.warnings.some((w) => w.includes('File size is large'))).toBe(true)
      })

      it('should warn about large dataset', () => {
        const data = Array.from({ length: 16000 }, (_, i) => ({
          id: i + 1,
          text: 'Story',
        }))
        const result = validateStoriesFile(data)
        expect(
          result.warnings.some(
            (w) => w.includes('Large dataset') && w.includes('may impact performance')
          )
        ).toBe(true)
      })
    })

    describe('complex scenarios', () => {
      it('should handle valid complex dataset', () => {
        const data = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          text: `Story number ${i + 1}`,
        }))
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.stats.totalStories).toBe(100)
        expect(result.stats.minId).toBe(1)
        expect(result.stats.maxId).toBe(100)
        expect(result.stats.missingIds).toHaveLength(0)
      })

      it('should handle mixed valid and warning cases', () => {
        const data = [
          { id: 1, text: 'Good story' },
          { id: 2, text: '' }, // Warning: empty text
          { id: 5, text: 'Another story' }, // Warning: missing IDs 3,4
        ]
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(true)
        // Should have 3 warnings: empty text for story 2, missing IDs warning, and stories without text count
        expect(result.warnings).toHaveLength(3)
        expect(result.stats.missingIds).toEqual([3, 4])
      })

      it('should stop processing story on first error', () => {
        const data = [{ id: 'bad', text: 123 }] // Both id and text are invalid
        const result = validateStoriesFile(data)
        expect(result.valid).toBe(false)
        // Should only report ID error, not text error (early return)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toContain('non-numeric id')
      })
    })
  })

  describe('formatValidationResult', () => {
    it('should format successful validation', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalStories: 100,
          fileSize: 10240,
          minId: 1,
          maxId: 100,
          missingIds: [],
          averageStoryLength: 50,
          storiesWithoutText: 0,
          duplicateIds: [],
        },
      }
      const formatted = formatValidationResult(result)
      expect(formatted).toContain('✅ Validation: PASSED')
      expect(formatted).toContain('Total stories: 100')
      expect(formatted).toContain('ID range: 1 - 100')
    })

    it('should format failed validation', () => {
      const result = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
        stats: {
          totalStories: 50,
          fileSize: 5120,
          minId: 1,
          maxId: 50,
          missingIds: [10, 20],
          averageStoryLength: 30,
          storiesWithoutText: 5,
          duplicateIds: [1],
        },
      }
      const formatted = formatValidationResult(result)
      expect(formatted).toContain('❌ Validation: FAILED')
      expect(formatted).toContain('❌ Errors (2):')
      expect(formatted).toContain('Error 1')
      expect(formatted).toContain('Error 2')
      expect(formatted).toContain('⚠️  Warnings (1):')
      expect(formatted).toContain('Warning 1')
    })

    it('should format statistics correctly', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          totalStories: 1000,
          fileSize: 1024 * 1024 * 2.5, // 2.5 MB
          minId: 1,
          maxId: 1000,
          missingIds: [],
          averageStoryLength: 150,
          storiesWithoutText: 0,
          duplicateIds: [],
        },
      }
      const formatted = formatValidationResult(result)
      expect(formatted).toContain('File size: 2.50 MB')
      expect(formatted).toContain('Average text length: 150 chars')
    })

    it('should include all sections', () => {
      const result = {
        valid: false,
        errors: ['Test error'],
        warnings: ['Test warning'],
        stats: {
          totalStories: 10,
          fileSize: 1024,
          minId: 1,
          maxId: 10,
          missingIds: [],
          averageStoryLength: 20,
          storiesWithoutText: 1,
          duplicateIds: [],
        },
      }
      const formatted = formatValidationResult(result)
      expect(formatted).toContain('=== Data Validation Report ===')
      expect(formatted).toContain('📊 Statistics:')
      expect(formatted).toContain('❌ Errors')
      expect(formatted).toContain('⚠️  Warnings')
    })
  })
})
