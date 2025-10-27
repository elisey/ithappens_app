// ABOUTME: Entry point for the application
// ABOUTME: Точка входа приложения, рендерит корневой компонент App в DOM
import { render } from 'preact'
import { App } from './app'

// Import global styles
import './styles/variables.css'
import './styles/themes.css'
import './styles/reset.css'
import './styles/typography.css'
import './styles/global.css'
import './styles/animations.css'

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  })
}

render(<App />, document.getElementById('app')!)
