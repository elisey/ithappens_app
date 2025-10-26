// ABOUTME: Component for toggling between light and dark themes
// ABOUTME: Displays sun/moon icons and supports dropdown for auto mode

import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../utils/themeUtils'
import styles from './ThemeToggle.module.css'

export interface ThemeToggleProps {
  /** Additional CSS class name */
  className?: string
  /** Whether to show label text */
  showLabel?: boolean
  /** Mode: 'toggle' for simple button, 'select' for dropdown with auto option */
  mode?: 'toggle' | 'select'
}

/**
 * Theme toggle component
 *
 * Features:
 * - Toggle mode: Simple button to switch between light/dark
 * - Select mode: Dropdown with light/dark/auto options
 * - Visual icons for light/dark states
 * - Accessible with proper ARIA labels
 */
export function ThemeToggle({ className, showLabel = false, mode = 'toggle' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  if (mode === 'select') {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        {showLabel && <label htmlFor="theme-select">Theme:</label>}
        <select
          id="theme-select"
          className={styles.select}
          value={theme}
          onChange={(e) => setTheme(e.currentTarget.value as Theme)}
          aria-label="Select theme"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>
    )
  }

  // Toggle mode
  const icon = resolvedTheme === 'light' ? '☀️' : '🌙'
  const label = resolvedTheme === 'light' ? 'Light mode' : 'Dark mode'

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className || ''}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current: ${label}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {showLabel && <span className={styles.label}>{label}</span>}
    </button>
  )
}
