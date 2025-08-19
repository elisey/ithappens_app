// ABOUTME: Tests for the main App component
// ABOUTME: Тесты для главного компонента приложения, проверка рендеринга и отображения текста
import { render, screen } from '@testing-library/preact'
import { axe, toHaveNoViolations } from 'jest-axe'
import { App } from './app'

expect.extend(toHaveNoViolations)

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('displays the app title', () => {
    render(<App />)
    expect(screen.getByText('ithappens')).toBeInTheDocument()
  })

  it('displays story content', () => {
    render(<App />)
    expect(screen.getByText(/Это пример истории для демонстрации типографики/)).toBeInTheDocument()
  })

  it('has correct landmarks', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('has skip link for accessibility', () => {
    render(<App />)

    const skipLink = screen.getByText('Перейти к содержанию')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<App />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('main content is focusable for skip link', () => {
    render(<App />)

    const mainContent = screen.getByRole('main')
    expect(mainContent).toHaveAttribute('tabIndex', '-1')
    expect(mainContent).toHaveAttribute('id', 'main-content')
  })
})
