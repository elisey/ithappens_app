// ABOUTME: Tests for keyboard utility functions including key normalization and shortcut management
// ABOUTME: Comprehensive test coverage for keyboard handling and OS-specific shortcuts
/* eslint-disable no-undef */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  normalizeKey,
  isInputElement,
  hasModifier,
  formatKeyForDisplay,
  getOSShortcuts,
  isKeySupported,
  shouldIgnoreShortcut,
} from '../../src/utils/keyboardUtils'

describe('Keyboard Utilities', () => {
  describe('normalizeKey', () => {
    it('should return event.key for standard keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(normalizeKey(event)).toBe('a')
    })

    it('should return event.key for arrow keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      expect(normalizeKey(event)).toBe('ArrowLeft')
    })

    it('should return event.key for special keys', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      expect(normalizeKey(enterEvent)).toBe('Enter')

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      expect(normalizeKey(escapeEvent)).toBe('Escape')
    })

    it('should return event.key for numeric keys', () => {
      const event = new KeyboardEvent('keydown', { key: '0' })
      expect(normalizeKey(event)).toBe('0')
    })

    it('should return event.key for symbol keys', () => {
      const event = new KeyboardEvent('keydown', { key: '?' })
      expect(normalizeKey(event)).toBe('?')
    })
  })

  describe('isInputElement', () => {
    it('should return false for null element', () => {
      expect(isInputElement(null)).toBe(false)
    })

    it('should return true for input element', () => {
      const input = document.createElement('input')
      expect(isInputElement(input)).toBe(true)
    })

    it('should return true for textarea element', () => {
      const textarea = document.createElement('textarea')
      expect(isInputElement(textarea)).toBe(true)
    })

    it('should return true for select element', () => {
      const select = document.createElement('select')
      expect(isInputElement(select)).toBe(true)
    })

    it('should return true for contentEditable element with value "true"', () => {
      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      expect(isInputElement(div)).toBe(true)
    })

    it('should return true for contentEditable element with empty value', () => {
      const div = document.createElement('div')
      div.setAttribute('contenteditable', '')
      expect(isInputElement(div)).toBe(true)
    })

    it('should return false for contentEditable element with value "false"', () => {
      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'false')
      expect(isInputElement(div)).toBe(false)
    })

    it('should return false for regular div element', () => {
      const div = document.createElement('div')
      expect(isInputElement(div)).toBe(false)
    })

    it('should return false for button element', () => {
      const button = document.createElement('button')
      expect(isInputElement(button)).toBe(false)
    })

    it('should return false for anchor element', () => {
      const anchor = document.createElement('a')
      expect(isInputElement(anchor)).toBe(false)
    })

    it('should return false for paragraph element', () => {
      const p = document.createElement('p')
      expect(isInputElement(p)).toBe(false)
    })

    it('should handle case-insensitive tag names', () => {
      const input = document.createElement('input')
      expect(isInputElement(input)).toBe(true)
    })
  })

  describe('hasModifier', () => {
    it('should return false when no modifier keys are pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      })
      expect(hasModifier(event)).toBe(false)
    })

    it('should return true when Ctrl key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: false,
        metaKey: false,
        shiftKey: false,
      })
      expect(hasModifier(event)).toBe(true)
    })

    it('should return true when Alt key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: false,
        altKey: true,
        metaKey: false,
        shiftKey: false,
      })
      expect(hasModifier(event)).toBe(true)
    })

    it('should return true when Meta key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: false,
        altKey: false,
        metaKey: true,
        shiftKey: false,
      })
      expect(hasModifier(event)).toBe(true)
    })

    it('should return true when Shift key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: true,
      })
      expect(hasModifier(event)).toBe(true)
    })

    it('should return true when multiple modifier keys are pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: true,
        metaKey: false,
        shiftKey: false,
      })
      expect(hasModifier(event)).toBe(true)
    })

    it('should return true when all modifier keys are pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: true,
        metaKey: true,
        shiftKey: true,
      })
      expect(hasModifier(event)).toBe(true)
    })

    it('should return true for Ctrl+Shift combination', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: false,
        metaKey: false,
        shiftKey: true,
      })
      expect(hasModifier(event)).toBe(true)
    })
  })

  describe('formatKeyForDisplay', () => {
    it('should format ArrowLeft as left arrow symbol', () => {
      expect(formatKeyForDisplay('ArrowLeft')).toBe('←')
    })

    it('should format ArrowRight as right arrow symbol', () => {
      expect(formatKeyForDisplay('ArrowRight')).toBe('→')
    })

    it('should format ArrowUp as up arrow symbol', () => {
      expect(formatKeyForDisplay('ArrowUp')).toBe('↑')
    })

    it('should format ArrowDown as down arrow symbol', () => {
      expect(formatKeyForDisplay('ArrowDown')).toBe('↓')
    })

    it('should format Enter as return symbol', () => {
      expect(formatKeyForDisplay('Enter')).toBe('⏎')
    })

    it('should format Escape as Esc', () => {
      expect(formatKeyForDisplay('Escape')).toBe('Esc')
    })

    it('should format Space as space symbol', () => {
      expect(formatKeyForDisplay('Space')).toBe('␣')
    })

    it('should format Tab as tab symbol', () => {
      expect(formatKeyForDisplay('Tab')).toBe('⇥')
    })

    it('should format Backspace as backspace symbol', () => {
      expect(formatKeyForDisplay('Backspace')).toBe('⌫')
    })

    it('should format Delete as delete symbol', () => {
      expect(formatKeyForDisplay('Delete')).toBe('⌦')
    })

    it('should format Home as home symbol', () => {
      expect(formatKeyForDisplay('Home')).toBe('⇱')
    })

    it('should format End as end symbol', () => {
      expect(formatKeyForDisplay('End')).toBe('⇲')
    })

    it('should return regular keys as-is', () => {
      expect(formatKeyForDisplay('a')).toBe('a')
      expect(formatKeyForDisplay('A')).toBe('A')
      expect(formatKeyForDisplay('1')).toBe('1')
      expect(formatKeyForDisplay('?')).toBe('?')
    })

    it('should return unmapped special keys as-is', () => {
      expect(formatKeyForDisplay('F1')).toBe('F1')
      expect(formatKeyForDisplay('PageUp')).toBe('PageUp')
      expect(formatKeyForDisplay('Insert')).toBe('Insert')
    })
  })

  describe('getOSShortcuts', () => {
    let originalUserAgent: string

    beforeEach(() => {
      originalUserAgent = navigator.userAgent
    })

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
        configurable: true,
      })
    })

    it('should return Mac shortcuts when on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(true)
      expect(shortcuts.modifier).toBe('⌘')
      expect(shortcuts.copy).toBe('⌘C')
      expect(shortcuts.paste).toBe('⌘V')
      expect(shortcuts.cut).toBe('⌘X')
      expect(shortcuts.selectAll).toBe('⌘A')
      expect(shortcuts.undo).toBe('⌘Z')
      expect(shortcuts.redo).toBe('⌘⇧Z')
    })

    it('should return Mac shortcuts when on iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(true)
      expect(shortcuts.modifier).toBe('⌘')
    })

    it('should return Mac shortcuts when on iPad', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(true)
      expect(shortcuts.modifier).toBe('⌘')
    })

    it('should return Mac shortcuts when on iPod', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(true)
      expect(shortcuts.modifier).toBe('⌘')
    })

    it('should return Windows shortcuts when on Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(false)
      expect(shortcuts.modifier).toBe('Ctrl')
      expect(shortcuts.copy).toBe('Ctrl+C')
      expect(shortcuts.paste).toBe('Ctrl+V')
      expect(shortcuts.cut).toBe('Ctrl+X')
      expect(shortcuts.selectAll).toBe('Ctrl+A')
      expect(shortcuts.undo).toBe('Ctrl+Z')
      expect(shortcuts.redo).toBe('Ctrl+Y')
    })

    it('should return Windows shortcuts when on Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(false)
      expect(shortcuts.modifier).toBe('Ctrl')
    })

    it('should return Windows shortcuts when on Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        writable: true,
        configurable: true,
      })

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(false)
      expect(shortcuts.modifier).toBe('Ctrl')
    })

    it('should handle server-side rendering when navigator is undefined', () => {
      const originalNavigator = global.navigator
      delete global.navigator

      const shortcuts = getOSShortcuts()
      expect(shortcuts.isMac).toBe(false)
      expect(shortcuts.modifier).toBe('Ctrl')

      global.navigator = originalNavigator
    })
  })

  describe('isKeySupported', () => {
    it('should return true for arrow keys', () => {
      expect(isKeySupported('ArrowLeft')).toBe(true)
      expect(isKeySupported('ArrowRight')).toBe(true)
      expect(isKeySupported('ArrowUp')).toBe(true)
      expect(isKeySupported('ArrowDown')).toBe(true)
    })

    it('should return true for special keys', () => {
      expect(isKeySupported('Enter')).toBe(true)
      expect(isKeySupported('Escape')).toBe(true)
      expect(isKeySupported('Space')).toBe(true)
      expect(isKeySupported('Home')).toBe(true)
      expect(isKeySupported('End')).toBe(true)
    })

    it('should return true for navigation keys', () => {
      expect(isKeySupported('a')).toBe(true)
      expect(isKeySupported('d')).toBe(true)
      expect(isKeySupported('j')).toBe(true)
      expect(isKeySupported('g')).toBe(true)
      expect(isKeySupported('h')).toBe(true)
    })

    it('should return true for special characters', () => {
      expect(isKeySupported('?')).toBe(true)
      expect(isKeySupported('0')).toBe(true)
      expect(isKeySupported(']')).toBe(true)
    })

    it('should return false for unsupported keys', () => {
      expect(isKeySupported('b')).toBe(false)
      expect(isKeySupported('c')).toBe(false)
      expect(isKeySupported('x')).toBe(false)
      expect(isKeySupported('1')).toBe(false)
      expect(isKeySupported('F1')).toBe(false)
      expect(isKeySupported('Tab')).toBe(false)
      expect(isKeySupported('Backspace')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isKeySupported('')).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(isKeySupported('a')).toBe(true)
      expect(isKeySupported('A')).toBe(false)
    })
  })

  describe('shouldIgnoreShortcut', () => {
    beforeEach(() => {
      document.body.innerHTML = ''
    })

    it('should return true when input element is focused', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when textarea is focused', () => {
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when select is focused', () => {
      const select = document.createElement('select')
      document.body.appendChild(select)
      select.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when contentEditable element is focused', () => {
      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when Ctrl key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when Alt key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true,
      })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when Meta key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        metaKey: true,
      })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return false when Shift key alone is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: '?',
        shiftKey: true,
      })
      expect(shouldIgnoreShortcut(event)).toBe(false)
    })

    it('should return false when no input is focused and no modifiers are pressed', () => {
      const div = document.createElement('div')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(false)
    })

    it('should return false when body is focused', () => {
      document.body.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(false)
    })

    it('should return true when both input focus and modifier key conditions are met', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return true when multiple modifiers are pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: true,
      })
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should return false for regular key press on button', () => {
      const button = document.createElement('button')
      button.tabIndex = 0
      document.body.appendChild(button)
      button.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(false)
    })

    it('should return false for regular key press on link', () => {
      const link = document.createElement('a')
      link.href = '#'
      link.tabIndex = 0
      document.body.appendChild(link)
      link.focus()

      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(shouldIgnoreShortcut(event)).toBe(false)
    })
  })

  describe('edge cases and integration', () => {
    it('should handle normalizeKey with formatKeyForDisplay', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      const normalized = normalizeKey(event)
      const formatted = formatKeyForDisplay(normalized)
      expect(formatted).toBe('←')
    })

    it('should handle isKeySupported with normalizeKey', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      const normalized = normalizeKey(event)
      expect(isKeySupported(normalized)).toBe(true)
    })

    it('should correctly identify input elements with hasModifier', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
      })

      expect(isInputElement(document.activeElement)).toBe(true)
      expect(hasModifier(event)).toBe(true)
      expect(shouldIgnoreShortcut(event)).toBe(true)
    })

    it('should handle all arrow keys consistently', () => {
      const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
      arrows.forEach((key) => {
        expect(isKeySupported(key)).toBe(true)
        expect(formatKeyForDisplay(key)).not.toBe(key)
      })
    })

    it('should handle special key formatting edge cases', () => {
      expect(formatKeyForDisplay('')).toBe('')
      expect(formatKeyForDisplay('UnknownKey')).toBe('UnknownKey')
    })
  })
})
