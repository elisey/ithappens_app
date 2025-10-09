#!/usr/bin/env node
/* eslint-env node */

// ABOUTME: Node.js script to validate stories.json file format, structure and integrity
// ABOUTME: Can be run manually or as part of CI/CD pipeline

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * Validates the stories.json file
 * @param {string} filePath - Path to stories.json file
 * @returns {Promise<ValidationResult>}
 */
async function validateStoriesFile(filePath) {
  const errors = []
  const warnings = []
  const stats = {
    totalStories: 0,
    fileSize: 0,
    minId: Number.POSITIVE_INFINITY,
    maxId: Number.NEGATIVE_INFINITY,
    missingIds: [],
    averageStoryLength: 0,
    storiesWithoutText: 0,
    duplicateIds: [],
  }

  try {
    // Read file
    const fileContent = await readFile(filePath, 'utf-8')
    stats.fileSize = fileContent.length

    // Parse JSON
    let data
    try {
      data = JSON.parse(fileContent)
    } catch (err) {
      errors.push(`Invalid JSON: ${err.message}`)
      return { valid: false, errors, warnings, stats }
    }

    // Basic type check
    if (!Array.isArray(data)) {
      errors.push('Data is not an array')
      return { valid: false, errors, warnings, stats }
    }

    if (data.length === 0) {
      errors.push('Stories array is empty')
      return { valid: false, errors, warnings, stats }
    }

    stats.totalStories = data.length

    // Track IDs for validation
    const seenIds = new Set()
    const idCounts = new Map()
    let totalTextLength = 0

    // Validate each story
    data.forEach((story, index) => {
      // Check story structure
      if (!story || typeof story !== 'object') {
        errors.push(`Story at index ${index} is not an object`)
        return
      }

      // Validate ID field
      if (!('id' in story)) {
        errors.push(`Story at index ${index} is missing 'id' field`)
        return
      }

      const { id } = story
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
      if (!('text' in story)) {
        errors.push(`Story ${id} at index ${index} is missing 'text' field`)
        return
      }

      const { text } = story
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
  } catch (err) {
    errors.push(`Failed to read file: ${err.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  }
}

/**
 * Formats validation result for console output
 * @param {ValidationResult} result
 * @returns {string}
 */
function formatValidationResult(result) {
  const lines = []

  lines.push('\n=== Data Validation Report ===\n')

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
  if (result.stats.totalStories > 0) {
    lines.push(`  ID range: ${result.stats.minId} - ${result.stats.maxId}`)
    lines.push(`  Missing IDs: ${result.stats.missingIds.length}`)
    lines.push(`  Duplicate IDs: ${result.stats.duplicateIds.length}`)
    lines.push(`  Average text length: ${result.stats.averageStoryLength} chars`)
    lines.push(`  Stories without text: ${result.stats.storiesWithoutText}`)
  }
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

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const filePath = args[0] || resolve(process.cwd(), 'public/stories.json')

  console.log(`Validating: ${filePath}`)

  const result = await validateStoriesFile(filePath)
  const output = formatValidationResult(result)

  console.log(output)

  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
