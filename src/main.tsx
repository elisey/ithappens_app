// ABOUTME: Entry point for the application
// ABOUTME: Точка входа приложения, рендерит корневой компонент App в DOM
import { render } from 'preact'
import { App } from './app'

// Import global styles
import './styles/variables.css'
import './styles/reset.css'
import './styles/typography.css'

render(<App />, document.getElementById('app')!)
