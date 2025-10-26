// ABOUTME: Accessibility announcer component for screen reader notifications
// ABOUTME: Uses ARIA live regions to announce dynamic content changes

/* eslint-disable no-undef */

import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

export interface A11yAnnouncerProps {
  message: string
  politeness?: 'polite' | 'assertive'
  clearOnUnmount?: boolean
}

export function A11yAnnouncer({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
}: A11yAnnouncerProps) {
  const announceRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = announceRef.current
    if (element && message) {
      // Clear first to ensure screen reader picks up the change
      element.textContent = ''
      // Use setTimeout to ensure the change is detected
      const timeoutId = setTimeout(() => {
        const currentElement = announceRef.current
        if (currentElement) {
          currentElement.textContent = message
        }
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        // Capture ref value for cleanup
        if (clearOnUnmount && element) {
          element.textContent = ''
        }
      }
    }
  }, [message, clearOnUnmount])

  return (
    <div
      ref={announceRef}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="visually-hidden"
    />
  )
}

// Global announcer hook for use anywhere in the app
let globalAnnouncerCallback:
  | ((message: string, politeness?: 'polite' | 'assertive') => void)
  | null = null

export function setGlobalAnnouncer(
  callback: (message: string, politeness?: 'polite' | 'assertive') => void
) {
  globalAnnouncerCallback = callback
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  if (globalAnnouncerCallback) {
    globalAnnouncerCallback(message, politeness)
  }
}

// Provider component that sets up global announcer
export function A11yAnnouncerProvider({ children }: { children: ComponentChildren }) {
  const [announcement, setAnnouncement] = useState<{
    message: string
    politeness: 'polite' | 'assertive'
  } | null>(null)

  useEffect(() => {
    setGlobalAnnouncer((message, politeness = 'polite') => {
      setAnnouncement({ message, politeness })
      // Clear after announcement
      setTimeout(() => setAnnouncement(null), 1000)
    })

    return () => {
      setGlobalAnnouncer(() => {})
    }
  }, [])

  return (
    <>
      {children}
      {announcement && (
        <A11yAnnouncer message={announcement.message} politeness={announcement.politeness} />
      )}
    </>
  )
}
