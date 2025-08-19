// ABOUTME: Unit tests for navigation utility functions using TDD approach
// ABOUTME: Tests story navigation, validation, and ID calculation with edge cases

import { describe, it, expect } from 'vitest'
import type { StoryId } from '../../src/types/story'
import {
  calculateNextStoryId,
  calculatePrevStoryId,
  canGoNext,
  canGoPrev,
  findClosestExistingId,
  validateStoryId,
} from '../../src/utils/navigation'

const testIds: StoryId[] = [1, 3, 5, 7, 10, 15, 20]

describe('Navigation utilities', () => {
  describe('calculateNextStoryId', () => {
    it('should return next existing ID in normal sequence', () => {
      expect(calculateNextStoryId(1, testIds)).toBe(3)
      expect(calculateNextStoryId(3, testIds)).toBe(5)
      expect(calculateNextStoryId(5, testIds)).toBe(7)
    })

    it('should return first ID after last ID (circular)', () => {
      expect(calculateNextStoryId(20, testIds)).toBe(1)
    })

    it('should return null for non-existing current ID', () => {
      expect(calculateNextStoryId(2, testIds)).toBe(null)
      expect(calculateNextStoryId(999, testIds)).toBe(null)
    })

    it('should handle single ID array', () => {
      expect(calculateNextStoryId(5, [5])).toBe(5)
    })

    it('should return null for empty array', () => {
      expect(calculateNextStoryId(1, [])).toBe(null)
    })
  })

  describe('calculatePrevStoryId', () => {
    it('should return previous existing ID in normal sequence', () => {
      expect(calculatePrevStoryId(20, testIds)).toBe(15)
      expect(calculatePrevStoryId(15, testIds)).toBe(10)
      expect(calculatePrevStoryId(10, testIds)).toBe(7)
    })

    it('should return last ID before first ID (circular)', () => {
      expect(calculatePrevStoryId(1, testIds)).toBe(20)
    })

    it('should return null for non-existing current ID', () => {
      expect(calculatePrevStoryId(2, testIds)).toBe(null)
      expect(calculatePrevStoryId(999, testIds)).toBe(null)
    })

    it('should handle single ID array', () => {
      expect(calculatePrevStoryId(5, [5])).toBe(5)
    })

    it('should return null for empty array', () => {
      expect(calculatePrevStoryId(1, [])).toBe(null)
    })
  })

  describe('canGoNext', () => {
    it('should always return true for circular navigation with multiple IDs', () => {
      expect(canGoNext(1, testIds)).toBe(true)
      expect(canGoNext(20, testIds)).toBe(true)
      expect(canGoNext(10, testIds)).toBe(true)
    })

    it('should return true for single ID (circular to self)', () => {
      expect(canGoNext(5, [5])).toBe(true)
    })

    it('should return false for empty array', () => {
      expect(canGoNext(1, [])).toBe(false)
    })

    it('should return false for non-existing ID', () => {
      expect(canGoNext(2, testIds)).toBe(false)
      expect(canGoNext(999, testIds)).toBe(false)
    })
  })

  describe('canGoPrev', () => {
    it('should always return true for circular navigation with multiple IDs', () => {
      expect(canGoPrev(1, testIds)).toBe(true)
      expect(canGoPrev(20, testIds)).toBe(true)
      expect(canGoPrev(10, testIds)).toBe(true)
    })

    it('should return true for single ID (circular to self)', () => {
      expect(canGoPrev(5, [5])).toBe(true)
    })

    it('should return false for empty array', () => {
      expect(canGoPrev(1, [])).toBe(false)
    })

    it('should return false for non-existing ID', () => {
      expect(canGoPrev(2, testIds)).toBe(false)
      expect(canGoPrev(999, testIds)).toBe(false)
    })
  })

  describe('findClosestExistingId', () => {
    it('should return exact match if exists', () => {
      expect(findClosestExistingId(5, testIds)).toBe(5)
      expect(findClosestExistingId(1, testIds)).toBe(1)
    })

    it('should find closest higher ID', () => {
      expect(findClosestExistingId(2, testIds)).toBe(3)
      expect(findClosestExistingId(4, testIds)).toBe(5)
      expect(findClosestExistingId(6, testIds)).toBe(7)
      expect(findClosestExistingId(12, testIds)).toBe(15)
    })

    it('should find closest lower ID when no higher ID exists', () => {
      expect(findClosestExistingId(25, testIds)).toBe(20)
      expect(findClosestExistingId(999, testIds)).toBe(20)
    })

    it('should find closest ID when target is below minimum', () => {
      expect(findClosestExistingId(0, testIds)).toBe(1)
      expect(findClosestExistingId(-5, testIds)).toBe(1)
    })

    it('should return null for empty array', () => {
      expect(findClosestExistingId(5, [])).toBe(null)
    })

    it('should handle single ID array', () => {
      expect(findClosestExistingId(5, [10])).toBe(10)
      expect(findClosestExistingId(15, [10])).toBe(10)
    })
  })

  describe('validateStoryId', () => {
    it('should validate existing IDs as valid', () => {
      expect(validateStoryId('1', testIds)).toEqual({ valid: true, id: 1 })
      expect(validateStoryId('5', testIds)).toEqual({ valid: true, id: 5 })
      expect(validateStoryId('20', testIds)).toEqual({ valid: true, id: 20 })
    })

    it('should reject non-existing IDs', () => {
      expect(validateStoryId('2', testIds)).toEqual({
        valid: false,
        error: 'Story with ID 2 does not exist',
      })
      expect(validateStoryId('999', testIds)).toEqual({
        valid: false,
        error: 'Story with ID 999 does not exist',
      })
    })

    it('should reject empty input', () => {
      expect(validateStoryId('', testIds)).toEqual({
        valid: false,
        error: 'ID cannot be empty',
      })
      expect(validateStoryId('   ', testIds)).toEqual({
        valid: false,
        error: 'ID cannot be empty',
      })
    })

    it('should reject non-numeric input', () => {
      expect(validateStoryId('abc', testIds)).toEqual({
        valid: false,
        error: 'ID must be a number',
      })
      expect(validateStoryId('1.5', testIds)).toEqual({
        valid: false,
        error: 'ID must be a whole number',
      })
      expect(validateStoryId('1a', testIds)).toEqual({
        valid: false,
        error: 'ID must be a number',
      })
    })

    it('should reject negative numbers', () => {
      expect(validateStoryId('-1', testIds)).toEqual({
        valid: false,
        error: 'ID must be positive',
      })
      expect(validateStoryId('-999', testIds)).toEqual({
        valid: false,
        error: 'ID must be positive',
      })
    })

    it('should reject zero', () => {
      expect(validateStoryId('0', testIds)).toEqual({
        valid: false,
        error: 'ID must be positive',
      })
    })

    it('should handle edge cases with leading/trailing spaces', () => {
      expect(validateStoryId(' 5 ', testIds)).toEqual({ valid: true, id: 5 })
      expect(validateStoryId('  1  ', testIds)).toEqual({ valid: true, id: 1 })
    })

    it('should handle very large numbers', () => {
      expect(validateStoryId('999999999999999', testIds)).toEqual({
        valid: false,
        error: 'Story with ID 999999999999999 does not exist',
      })
    })

    it('should handle empty available IDs', () => {
      expect(validateStoryId('1', [])).toEqual({
        valid: false,
        error: 'No stories available',
      })
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle IDs in random order', () => {
      const randomIds = [20, 1, 10, 3, 15, 7, 5]
      expect(calculateNextStoryId(1, randomIds)).toBe(3)
      expect(calculatePrevStoryId(20, randomIds)).toBe(15)
    })

    it('should handle large gaps in IDs', () => {
      const sparseIds = [1, 1000, 5000]
      expect(calculateNextStoryId(1, sparseIds)).toBe(1000)
      expect(calculateNextStoryId(1000, sparseIds)).toBe(5000)
      expect(calculateNextStoryId(5000, sparseIds)).toBe(1)
    })

    it('should handle duplicate IDs gracefully', () => {
      const duplicateIds = [1, 1, 3, 3, 5]
      expect(calculateNextStoryId(1, duplicateIds)).toBe(3)
      expect(findClosestExistingId(2, duplicateIds)).toBe(3)
    })
  })
})
