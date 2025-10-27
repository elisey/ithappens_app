// ABOUTME: TypeScript type definitions for Web App Manifest
// ABOUTME: Provides type safety and validation for PWA manifest structure

interface WebAppManifest {
  name: string
  short_name: string
  description: string
  start_url: string
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  background_color: string
  theme_color: string
  orientation: 'portrait' | 'landscape' | 'any'
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose: string
  }>
}
