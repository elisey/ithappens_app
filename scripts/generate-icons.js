// ABOUTME: Script to generate PWA icons with maskable support
// ABOUTME: Creates icon-192.png, icon-512.png with safe area compliance

import { createCanvas } from 'canvas'
import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Icon configuration
const BRAND_COLOR = '#4A90E2' // Blue theme
const TEXT_COLOR = '#FFFFFF'
const SAFE_AREA_PERCENTAGE = 0.8 // 80% safe area for maskable icons

/**
 * Generate a maskable PWA icon with text logo
 * @param {number} size - Icon size in pixels (192 or 512)
 * @param {string} outputPath - Output file path
 */
async function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fill background with brand color
  ctx.fillStyle = BRAND_COLOR
  ctx.fillRect(0, 0, size, size)

  // Calculate safe area (80% of total size, centered)
  const safeAreaSize = size * SAFE_AREA_PERCENTAGE

  // Draw safe area guide (for debugging - comment out for production)
  // const padding = (size - safeAreaSize) / 2;
  // ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
  // ctx.lineWidth = 2;
  // ctx.strokeRect(padding, padding, safeAreaSize, safeAreaSize);

  // Draw "IH" text in the center of safe area
  ctx.fillStyle = TEXT_COLOR
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Font size should be roughly 40% of safe area
  const fontSize = Math.floor(safeAreaSize * 0.4)
  ctx.font = `bold ${fontSize}px Arial, sans-serif`

  // Draw text at center
  const centerX = size / 2
  const centerY = size / 2
  ctx.fillText('IH', centerX, centerY)

  // Save to file
  const buffer = canvas.toBuffer('image/png')
  await writeFile(outputPath, buffer)
  console.log(`✓ Generated ${outputPath} (${size}x${size}px)`)
}

/**
 * Generate a simple favicon
 * @param {string} outputPath - Output file path
 */
async function generateFavicon(outputPath) {
  const size = 32
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fill background
  ctx.fillStyle = BRAND_COLOR
  ctx.fillRect(0, 0, size, size)

  // Draw simplified "IH" text
  ctx.fillStyle = TEXT_COLOR
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText('IH', size / 2, size / 2)

  // Save as PNG (browsers handle PNG favicons well)
  const buffer = canvas.toBuffer('image/png')
  await writeFile(outputPath, buffer)
  console.log(`✓ Generated ${outputPath} (${size}x${size}px)`)
}

async function main() {
  const publicDir = join(__dirname, '..', 'public')
  const iconsDir = join(publicDir, 'icons')

  console.log('Generating PWA icons...\n')

  try {
    // Generate icons
    await generateIcon(192, join(iconsDir, 'icon-192.png'))
    await generateIcon(512, join(iconsDir, 'icon-512.png'))
    await generateFavicon(join(publicDir, 'favicon.ico'))

    console.log('\n✓ All icons generated successfully')
    console.log('\nNext steps:')
    console.log('1. Test icons at https://maskable.app/')
    console.log('2. Run npm test to verify accessibility')
    console.log('3. Check Chrome DevTools → Application → Manifest')
  } catch (error) {
    console.error('\n✗ Error generating icons:', error.message)
    process.exit(1)
  }
}

main()
