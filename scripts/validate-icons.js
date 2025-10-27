// ABOUTME: Validation script to check PWA icon files exist and have correct properties
// ABOUTME: Verifies icon-192.png, icon-512.png, and favicon.ico are present and valid

import { readFile, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Validate that an icon file exists and has content
 * @param {string} path - Path to icon file
 * @param {string} expectedSize - Expected dimensions (e.g., "192x192")
 * @returns {Promise<boolean>} - True if validation passes
 */
async function validateIcon(path, expectedSize) {
  try {
    const fileStats = await stat(path)

    if (fileStats.size === 0) {
      console.error(`✗ ${path}: File is empty`)
      return false
    }

    // Read first few bytes to verify it's a valid image
    const buffer = await readFile(path)

    // Check PNG signature (89 50 4E 47)
    const isPNG =
      path.endsWith('.png') &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47

    // For .ico files, just verify they're not empty
    const isICO = path.endsWith('.ico') && buffer.length > 0

    if (!isPNG && !isICO) {
      console.error(`✗ ${path}: Invalid file format`)
      return false
    }

    const sizeInKB = (fileStats.size / 1024).toFixed(2)
    console.log(`✓ ${path} exists (${sizeInKB} KB) - expected ${expectedSize}`)
    return true
  } catch (error) {
    console.error(`✗ ${path}: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('Validating PWA icons...\n')

  const publicDir = join(__dirname, '..', 'public')

  const results = await Promise.all([
    validateIcon(join(publicDir, 'icons', 'icon-192.png'), '192x192'),
    validateIcon(join(publicDir, 'icons', 'icon-512.png'), '512x512'),
    validateIcon(join(publicDir, 'favicon.ico'), '32x32'),
  ])

  if (results.every((r) => r)) {
    console.log('\n✓ All icons validated successfully')
    process.exit(0)
  } else {
    console.log('\n✗ Icon validation failed')
    process.exit(1)
  }
}

main()
