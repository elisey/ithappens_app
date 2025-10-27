// ABOUTME: Unit tests for PWA manifest configuration
// ABOUTME: Validates manifest accessibility, structure, and required fields

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose: string
}

interface ManifestData {
  name: string
  short_name: string
  description: string
  start_url: string
  display: string
  background_color: string
  theme_color: string
  orientation: string
  icons: ManifestIcon[]
}

describe('Web App Manifest', () => {
  let manifest: ManifestData | null = null

  const getManifest = () => {
    if (!manifest) {
      const manifestPath = resolve(__dirname, '../../public/manifest.json')
      const manifestContent = readFileSync(manifestPath, 'utf-8')
      manifest = JSON.parse(manifestContent)
    }
    return manifest
  }

  it('should exist at public/manifest.json', () => {
    expect(() => getManifest()).not.toThrow()
  })

  it('should be valid JSON', () => {
    const manifestData = getManifest()
    expect(manifestData).toBeDefined()
    expect(typeof manifestData).toBe('object')
  })

  it('should have all required fields', () => {
    const manifestData = getManifest()

    expect(manifestData.name).toBe('ithappens')
    expect(manifestData.short_name).toBe('ithappens')
    expect(manifestData.start_url).toBe('/')
    expect(manifestData.display).toBe('standalone')
    expect(manifestData.icons).toHaveLength(2)
  })

  it('should have correct icon definitions', () => {
    const manifestData = getManifest()

    const icon192 = manifestData.icons.find((i) => i.sizes === '192x192')
    const icon512 = manifestData.icons.find((i) => i.sizes === '512x512')

    expect(icon192).toBeDefined()
    expect(icon512).toBeDefined()
    expect(icon192?.purpose).toContain('maskable')
    expect(icon512?.purpose).toContain('maskable')
    expect(icon192?.src).toBe('/icons/icon-192.png')
    expect(icon512?.src).toBe('/icons/icon-512.png')
    expect(icon192?.type).toBe('image/png')
    expect(icon512?.type).toBe('image/png')
  })

  it('should have correct theme and background colors', () => {
    const manifestData = getManifest()

    expect(manifestData.background_color).toBe('#ffffff')
    expect(manifestData.theme_color).toBe('#ffffff')
  })

  it('should have portrait orientation', () => {
    const manifestData = getManifest()

    expect(manifestData.orientation).toBe('portrait')
  })

  it('should have a description', () => {
    const manifestData = getManifest()

    expect(manifestData.description).toBe('Смешные истории')
  })
})
