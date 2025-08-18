// ABOUTME: Tests for the main App component
// ABOUTME: Тесты для главного компонента приложения, проверка рендеринга и отображения текста
import { render, screen } from '@testing-library/preact'
import { App } from './app'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('displays the app title', () => {
    render(<App />)
    expect(screen.getByText('ithappens')).toBeInTheDocument()
  })

  it('displays the loading message', () => {
    render(<App />)
    expect(screen.getByText('Загрузка приложения...')).toBeInTheDocument()
  })
})
