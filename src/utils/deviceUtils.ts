// ABOUTME: Utility functions for device detection and capability checking
// ABOUTME: Provides helpers for touch detection, platform identification, and device features

/* eslint-disable no-undef */

/**
 * Check if the device supports touch events
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is legacy IE property
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Check if the device is running iOS
 */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/**
 * Check if the device is running Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent)
}

/**
 * Check if the device is a mobile device
 */
export function isMobile(): boolean {
  return isIOS() || isAndroid() || /Mobile|Tablet/.test(navigator.userAgent)
}

/**
 * Get current viewport size
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/**
 * Check if the device is in landscape orientation
 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight
}

/**
 * Check if the device has a notch (iPhone X and newer)
 * Uses CSS env() variables to detect safe area insets
 */
export function hasNotch(): boolean {
  if (!isIOS()) return false

  // Check if safe-area-inset-top is greater than 0
  const div = document.createElement('div')
  div.style.paddingTop = 'env(safe-area-inset-top)'
  document.body.appendChild(div)
  const hasInset = getComputedStyle(div).paddingTop !== '0px'
  document.body.removeChild(div)

  return hasInset
}

/**
 * Check if the device supports vibration API
 */
export function supportsVibration(): boolean {
  return 'vibrate' in navigator
}

/**
 * Trigger device vibration for haptic feedback
 * @param pattern - Duration in ms or array of durations [vibrate, pause, vibrate, ...]
 */
export function vibrate(pattern: number | number[] = 50): void {
  if (supportsVibration()) {
    navigator.vibrate(pattern)
  }
}

/**
 * Check if the device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if the device prefers dark color scheme
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Get device pixel ratio for high-DPI displays
 */
export function getPixelRatio(): number {
  return window.devicePixelRatio || 1
}

/**
 * Check if device is in standalone/PWA mode
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - navigator.standalone is iOS-specific
    window.navigator.standalone === true
  )
}

/**
 * Get safe area insets for devices with notches
 */
export function getSafeAreaInsets(): {
  top: number
  right: number
  bottom: number
  left: number
} {
  const style = getComputedStyle(document.documentElement)

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
  }
}
