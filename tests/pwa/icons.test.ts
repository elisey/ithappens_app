// ABOUTME: Unit tests for PWA icon files
// ABOUTME: Validates icon accessibility, format, and size requirements

import { readFileSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

describe('PWA Icons', () => {
  const publicDir = resolve(__dirname, '../../public')

  describe('Icon Files Existence', () => {
    it('should have icon-192.png in icons directory', () => {
      const iconPath = resolve(publicDir, 'icons', 'icon-192.png')
      expect(existsSync(iconPath)).toBe(true)
    })

    it('should have icon-512.png in icons directory', () => {
      const iconPath = resolve(publicDir, 'icons', 'icon-512.png')
      expect(existsSync(iconPath)).toBe(true)
    })

    it('should have favicon.ico in public directory', () => {
      const faviconPath = resolve(publicDir, 'favicon.ico')
      expect(existsSync(faviconPath)).toBe(true)
    })
  })

  describe('Icon File Formats', () => {
    it('icon-192.png should be a valid PNG file', () => {
      const iconPath = resolve(publicDir, 'icons', 'icon-192.png')
      const buffer = readFileSync(iconPath)

      // Check PNG signature (89 50 4E 47 0D 0A 1A 0A)
      expect(buffer[0]).toBe(0x89)
      expect(buffer[1]).toBe(0x50)
      expect(buffer[2]).toBe(0x4e)
      expect(buffer[3]).toBe(0x47)
    })

    it('icon-512.png should be a valid PNG file', () => {
      const iconPath = resolve(publicDir, 'icons', 'icon-512.png')
      const buffer = readFileSync(iconPath)

      // Check PNG signature
      expect(buffer[0]).toBe(0x89)
      expect(buffer[1]).toBe(0x50)
      expect(buffer[2]).toBe(0x4e)
      expect(buffer[3]).toBe(0x47)
    })

    it('favicon.ico should not be empty', () => {
      const faviconPath = resolve(publicDir, 'favicon.ico')
      const buffer = readFileSync(faviconPath)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('Icon File Sizes', () => {
    it('icon-192.png should not be empty', () => {
      const iconPath = resolve(publicDir, 'icons', 'icon-192.png')
      const stats = statSync(iconPath)
      expect(stats.size).toBeGreaterThan(0)
    })

    it('icon-512.png should not be empty', () => {
      const iconPath = resolve(publicDir, 'icons', 'icon-512.png')
      const stats = statSync(iconPath)
      expect(stats.size).toBeGreaterThan(0)
    })

    it('icon-512.png should be larger than icon-192.png', () => {
      const icon192Path = resolve(publicDir, 'icons', 'icon-192.png')
      const icon512Path = resolve(publicDir, 'icons', 'icon-512.png')

      const stats192 = statSync(icon192Path)
      const stats512 = statSync(icon512Path)

      expect(stats512.size).toBeGreaterThan(stats192.size)
    })

    it('favicon.ico should be reasonably small', () => {
      const faviconPath = resolve(publicDir, 'favicon.ico')
      const stats = statSync(faviconPath)

      // Favicon should be less than 10KB
      expect(stats.size).toBeLessThan(10 * 1024)
    })
  })

  describe('Manifest Icon References', () => {
    it('manifest should reference existing icon files', () => {
      const manifestPath = resolve(publicDir, 'manifest.json')
      const manifestContent = readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)

      const icon192 = manifest.icons.find((i: { sizes: string }) => i.sizes === '192x192')
      const icon512 = manifest.icons.find((i: { sizes: string }) => i.sizes === '512x512')

      expect(icon192).toBeDefined()
      expect(icon512).toBeDefined()

      // Verify files exist at referenced paths
      const icon192Path = resolve(publicDir, icon192.src.replace(/^\//, ''))
      const icon512Path = resolve(publicDir, icon512.src.replace(/^\//, ''))

      expect(existsSync(icon192Path)).toBe(true)
      expect(existsSync(icon512Path)).toBe(true)
    })
  })

  describe('Maskable Icon Compliance', () => {
    it('icons should have maskable purpose in manifest', () => {
      const manifestPath = resolve(publicDir, 'manifest.json')
      const manifestContent = readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)

      const icon192 = manifest.icons.find((i: { sizes: string }) => i.sizes === '192x192')
      const icon512 = manifest.icons.find((i: { sizes: string }) => i.sizes === '512x512')

      expect(icon192.purpose).toContain('maskable')
      expect(icon512.purpose).toContain('maskable')
    })
  })
})
