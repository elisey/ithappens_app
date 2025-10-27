// ABOUTME: Automatically updates Service Worker cache version before builds
// ABOUTME: Combines package.json version with git hash and timestamp for unique cache names

import { readFile, writeFile } from 'fs/promises'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

async function bumpSWVersion() {
  try {
    // Read package.json to get version
    const packageJsonPath = join(rootDir, 'package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
    const baseVersion = packageJson.version

    // Get git commit hash
    let gitHash = 'unknown'
    try {
      gitHash = execSync('git rev-parse --short HEAD').toString().trim()
    } catch (error) {
      console.warn('[bump-sw-version] Could not get git hash:', error.message)
    }

    // Get timestamp
    const timestamp = Date.now()

    // Create unique version string
    const newVersion = `${baseVersion}-${gitHash}-${timestamp}`

    // Read and update Service Worker
    const swPath = join(rootDir, 'public/sw.js')
    const swContent = await readFile(swPath, 'utf-8')

    const updatedContent = swContent.replace(
      /const CACHE_VERSION = ['"].*?['"]/,
      `const CACHE_VERSION = '${newVersion}'`
    )

    await writeFile(swPath, updatedContent)

    console.log(`[bump-sw-version] Updated SW cache version to: ${newVersion}`)
    console.log(`[bump-sw-version] Base version: ${baseVersion}`)
    console.log(`[bump-sw-version] Git hash: ${gitHash}`)
    console.log(`[bump-sw-version] Timestamp: ${timestamp}`)

    // Create .env file for Vite to use during build
    const envContent = `VITE_APP_VERSION=${newVersion}
VITE_BUILD_DATE=${new Date().toISOString()}
`
    const envPath = join(rootDir, '.env.production')
    await writeFile(envPath, envContent)
    console.log(`[bump-sw-version] Created ${envPath} with version info`)
  } catch (error) {
    console.error('[bump-sw-version] Error:', error)
    process.exit(1)
  }
}

bumpSWVersion()
