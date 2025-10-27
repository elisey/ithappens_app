// ABOUTME: Service Worker update detection and notification service
// ABOUTME: Detects when new app version is available and manages update flow

/* eslint-disable no-undef */

export class SWUpdateService {
  private registration: ServiceWorkerRegistration | null = null
  private updateCheckInterval: number | null = null
  private readonly UPDATE_CHECK_INTERVAL = 60000 // Check every 60 seconds

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('[SWUpdate] Service Workers not supported')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[SWUpdate] SW registered:', this.registration.scope)

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        console.log('[SWUpdate] Update found, new worker installing')

        newWorker?.addEventListener('statechange', () => {
          console.log('[SWUpdate] New worker state:', newWorker.state)

          if (newWorker.state === 'activated') {
            this.notifyUpdate()
          }
        })
      })

      // Check for updates periodically
      this.startUpdateChecks()

      // Check for updates when page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          console.log('[SWUpdate] Page became visible, checking for updates')
          this.checkForUpdates()
        }
      })
    } catch (error) {
      console.error('[SWUpdate] SW registration failed:', error)
    }
  }

  private startUpdateChecks(): void {
    // Check for updates periodically
    this.updateCheckInterval = window.setInterval(() => {
      this.checkForUpdates()
    }, this.UPDATE_CHECK_INTERVAL)

    console.log(
      '[SWUpdate] Started periodic update checks (every',
      this.UPDATE_CHECK_INTERVAL / 1000,
      'seconds)'
    )
  }

  private async checkForUpdates(): Promise<void> {
    if (!this.registration) {
      return
    }

    try {
      await this.registration.update()
      console.log('[SWUpdate] Update check completed')
    } catch (error) {
      console.error('[SWUpdate] Update check failed:', error)
    }
  }

  private notifyUpdate(): void {
    console.log('[SWUpdate] New version available and activated!')
    console.log('[SWUpdate] Users will get the latest version on next page load')

    // Future enhancement: could show UI notification here
    // For example:
    // - Toast message: "New version available! Reload to update."
    // - Banner with reload button
    // - Auto-reload after delay
  }

  destroy(): void {
    if (this.updateCheckInterval !== null) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
      console.log('[SWUpdate] Stopped update checks')
    }
  }
}

export const swUpdateService = new SWUpdateService()
