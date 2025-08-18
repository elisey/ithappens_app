// ABOUTME: Entry point for the application
// ABOUTME: Точка входа приложения, рендерит корневой компонент App в DOM
import { render } from 'preact'
import { App } from './app'
import './app.module.css'

render(<App />, document.getElementById('app')!)