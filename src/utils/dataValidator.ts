// ABOUTME: Validates stories.json file structure, format, and data integrity
// ABOUTME: Provides detailed validation results with errors, warnings, and statistics

import type { StoryId } from '../types/story'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalStories: number
    fileSize: number
    minId: number
    maxId: number
    missingIds: number[]
    averageStoryLength: number
    storiesWithoutText: number
    duplicateIds: number[]
  }
}

interface RawStory {
  id?: unknown
  text?: unknown
}

export function validateStoriesFile(data: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const stats = {
    totalStories: 0,
    fileSize: 0,
    minId: Number.POSITIVE_INFINITY,
    maxId: Number.NEGATIVE_INFINITY,
    missingIds: [] as number[],
    averageStoryLength: 0,
    storiesWithoutText: 0,
    duplicateIds: [] as number[],
  }

  // Basic type check
  if (!data || typeof data !== 'object') {
    errors.push('Data is not an object')
    return { valid: false, errors, warnings, stats }
  }

  // Check if it's an array
  if (!Array.isArray(data)) {
    errors.push('Data is not an array')
    return { valid: false, errors, warnings, stats }
  }

  // Check if array is empty
  if (data.length === 0) {
    errors.push('Stories array is empty')
    return { valid: false, errors, warnings, stats }
  }

  stats.totalStories = data.length

  // Estimate file size (rough approximation)
  stats.fileSize = JSON.stringify(data).length

  // Track IDs for validation
  const seenIds = new Set<StoryId>()
  const idCounts = new Map<StoryId, number>()
  let totalTextLength = 0

  // Validate each story
  data.forEach((story: unknown, index: number) => {
    const rawStory = story as RawStory

    // Check story structure
    if (!rawStory || typeof rawStory !== 'object') {
      errors.push(`Story at index ${index} is not an object`)
      return
    }

    // Validate ID field
    if (!('id' in rawStory)) {
      errors.push(`Story at index ${index} is missing 'id' field`)
      return
    }

    const id = rawStory.id
    if (typeof id !== 'number') {
      errors.push(`Story at index ${index} has non-numeric id: ${String(id)}`)
      return
    }

    if (!Number.isInteger(id)) {
      errors.push(`Story at index ${index} has non-integer id: ${id}`)
      return
    }

    if (id < 0) {
      errors.push(`Story at index ${index} has negative id: ${id}`)
      return
    }

    // Track ID statistics
    stats.minId = Math.min(stats.minId, id)
    stats.maxId = Math.max(stats.maxId, id)

    // Check for duplicate IDs
    const count = idCounts.get(id) || 0
    idCounts.set(id, count + 1)
    if (count === 1) {
      stats.duplicateIds.push(id)
    }

    seenIds.add(id)

    // Validate text field
    if (!('text' in rawStory)) {
      errors.push(`Story ${id} at index ${index} is missing 'text' field`)
      return
    }

    const text = rawStory.text
    if (typeof text !== 'string') {
      errors.push(`Story ${id} at index ${index} has non-string text`)
      return
    }

    if (text.length === 0) {
      warnings.push(`Story ${id} has empty text`)
      stats.storiesWithoutText++
    }

    totalTextLength += text.length
  })

  // Calculate average text length
  if (stats.totalStories > 0) {
    stats.averageStoryLength = Math.round(totalTextLength / stats.totalStories)
  }

  // Find missing IDs in sequence
  if (seenIds.size > 0) {
    for (let id = stats.minId; id <= stats.maxId; id++) {
      if (!seenIds.has(id)) {
        stats.missingIds.push(id)
      }
    }
  }

  // Warnings for data quality
  if (stats.missingIds.length > 0) {
    warnings.push(
      `${stats.missingIds.length} missing IDs in sequence (${stats.minId}-${stats.maxId})`
    )
  }

  if (stats.duplicateIds.length > 0) {
    errors.push(
      `${stats.duplicateIds.length} duplicate IDs found: ${stats.duplicateIds.slice(0, 10).join(', ')}${stats.duplicateIds.length > 10 ? '...' : ''}`
    )
  }

  if (stats.storiesWithoutText > 0) {
    warnings.push(`${stats.storiesWithoutText} stories have empty text`)
  }

  // Size warnings
  const sizeMB = stats.fileSize / (1024 * 1024)
  if (sizeMB > 30) {
    warnings.push(`File size is large: ${sizeMB.toFixed(2)} MB`)
  }

  // Performance warnings
  if (stats.totalStories > 15000) {
    warnings.push(`Large dataset: ${stats.totalStories} stories may impact performance`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  }
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []

  lines.push('=== Data Validation Report ===\n')

  // Status
  if (result.valid) {
    lines.push('✅ Validation: PASSED')
  } else {
    lines.push('❌ Validation: FAILED')
  }
  lines.push('')

  // Statistics
  lines.push('📊 Statistics:')
  lines.push(`  Total stories: ${result.stats.totalStories}`)
  lines.push(`  File size: ${(result.stats.fileSize / (1024 * 1024)).toFixed(2)} MB`)
  lines.push(`  ID range: ${result.stats.minId} - ${result.stats.maxId}`)
  lines.push(`  Missing IDs: ${result.stats.missingIds.length}`)
  lines.push(`  Duplicate IDs: ${result.stats.duplicateIds.length}`)
  lines.push(`  Average text length: ${result.stats.averageStoryLength} chars`)
  lines.push(`  Stories without text: ${result.stats.storiesWithoutText}`)
  lines.push('')

  // Errors
  if (result.errors.length > 0) {
    lines.push(`❌ Errors (${result.errors.length}):`)
    result.errors.forEach((error) => {
      lines.push(`  - ${error}`)
    })
    lines.push('')
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`⚠️  Warnings (${result.warnings.length}):`)
    result.warnings.forEach((warning) => {
      lines.push(`  - ${warning}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}
