// ABOUTME: Navigation utility functions for story ID calculations and validation
// ABOUTME: Pure functions handling story navigation logic with circular support

import type { StoryId } from '../types/story'

export function calculateNextStoryId(currentId: StoryId, availableIds: StoryId[]): StoryId | null {
  if (availableIds.length === 0) {
    return null
  }

  // Remove duplicates and sort
  const sortedIds = [...new Set(availableIds)].sort((a, b) => a - b)
  const currentIndex = sortedIds.indexOf(currentId)

  if (currentIndex === -1) {
    return null
  }

  // Circular: if at last index, return first
  if (currentIndex === sortedIds.length - 1) {
    return sortedIds[0]
  }

  return sortedIds[currentIndex + 1]
}

export function calculatePrevStoryId(currentId: StoryId, availableIds: StoryId[]): StoryId | null {
  if (availableIds.length === 0) {
    return null
  }

  // Remove duplicates and sort
  const sortedIds = [...new Set(availableIds)].sort((a, b) => a - b)
  const currentIndex = sortedIds.indexOf(currentId)

  if (currentIndex === -1) {
    return null
  }

  // Circular: if at first index, return last
  if (currentIndex === 0) {
    return sortedIds[sortedIds.length - 1]
  }

  return sortedIds[currentIndex - 1]
}

export function canGoNext(currentId: StoryId, availableIds: StoryId[]): boolean {
  return calculateNextStoryId(currentId, availableIds) !== null
}

export function canGoPrev(currentId: StoryId, availableIds: StoryId[]): boolean {
  return calculatePrevStoryId(currentId, availableIds) !== null
}

export function findClosestExistingId(targetId: StoryId, availableIds: StoryId[]): StoryId | null {
  if (availableIds.length === 0) {
    return null
  }

  // Remove duplicates and sort
  const sortedIds = [...new Set(availableIds)].sort((a, b) => a - b)

  // If exact match exists
  if (sortedIds.includes(targetId)) {
    return targetId
  }

  // Find the first ID higher than target
  const higherIds = sortedIds.filter((id) => id > targetId)
  if (higherIds.length > 0) {
    return higherIds[0] // Return the smallest ID higher than target
  }

  // If no higher ID exists, return the highest available ID
  return sortedIds[sortedIds.length - 1]
}

export function validateStoryId(
  input: string,
  availableIds: StoryId[]
): { valid: boolean; id?: StoryId; error?: string } {
  const trimmed = input.trim()

  // Check if empty
  if (trimmed === '') {
    return { valid: false, error: 'ID cannot be empty' }
  }

  // Check if no stories available
  if (availableIds.length === 0) {
    return { valid: false, error: 'No stories available' }
  }

  // Check for negative numbers first
  if (trimmed.startsWith('-')) {
    return { valid: false, error: 'ID must be positive' }
  }

  // Check if it's a valid positive integer
  if (!/^\d+$/.test(trimmed)) {
    // Check for decimal
    if (/^\d*\.\d+$/.test(trimmed)) {
      return { valid: false, error: 'ID must be a whole number' }
    }
    return { valid: false, error: 'ID must be a number' }
  }

  const id = parseInt(trimmed, 10)

  // Check if positive (zero is not allowed)
  if (id <= 0) {
    return { valid: false, error: 'ID must be positive' }
  }

  // Check if story exists
  if (!availableIds.includes(id)) {
    return { valid: false, error: `Story with ID ${id} does not exist` }
  }

  return { valid: true, id }
}
