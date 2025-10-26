// ABOUTME: Component wrapper for handling touch gestures (swipe) on mobile devices
// ABOUTME: Detects swipe direction and calls appropriate handlers with configurable threshold

/* eslint-disable no-undef */

import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

interface TouchGesturesProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // minimum swipe distance in pixels
  velocityThreshold?: number // minimum swipe velocity
  children: ComponentChildren
  disabled?: boolean
}

export function TouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  children,
  disabled = false,
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    if (disabled || !containerRef.current) return

    const container = containerRef.current

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!touch || !touchStartRef.current) return

      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // Calculate velocity (pixels per millisecond)
      const velocityX = Math.abs(deltaX) / deltaTime
      const velocityY = Math.abs(deltaY) / deltaTime

      // Determine if swipe threshold is met
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Check if minimum threshold is met
      if (absX < threshold && absY < threshold) {
        touchStartRef.current = null
        return
      }

      // Determine primary direction (horizontal vs vertical)
      if (absX > absY) {
        // Horizontal swipe
        if (velocityX >= velocityThreshold) {
          if (deltaX > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        }
      } else {
        // Vertical swipe
        if (velocityY >= velocityThreshold) {
          if (deltaY > 0) {
            onSwipeDown?.()
          } else {
            onSwipeUp?.()
          }
        }
      }

      touchStartRef.current = null
    }

    const handleTouchCancel = () => {
      touchStartRef.current = null
    }

    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchCancel, {
      passive: true,
    })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [disabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold])

  return (
    <div ref={containerRef} style={{ touchAction: 'pan-y' }}>
      {children}
    </div>
  )
}
