// ABOUTME: Entry point for the application
// ABOUTME: Точка входа приложения, рендерит корневой компонент App в DOM
import { render } from 'preact'
import { App } from './app'
import './styles/variables.css'
import './styles/themes.css'
import './styles/reset.css'
import './styles/typography.css'
import './styles/global.css'
import './styles/animations.css'
import { getAppConfig } from './config/app.config'
import { swUpdateService } from './services/swUpdateService'

// Log app version on startup
const config = getAppConfig()
console.log(`[App] Version: ${config.version}`)
console.log(`[App] Build date: ${config.buildDate}`)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    swUpdateService.initialize()
  })
}

render(<App />, document.getElementById('app')!)
