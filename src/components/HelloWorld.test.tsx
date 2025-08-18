// ABOUTME: Comprehensive tests for HelloWorld component
// ABOUTME: Полные тесты компонента HelloWorld с проверкой всех возможных сценариев
import { render, screen } from '@testing-library/preact'
import { HelloWorld } from './HelloWorld'

describe('HelloWorld', () => {
  it('renders without crashing', () => {
    render(<HelloWorld name="Test" />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('displays greeting with provided name', () => {
    const testName = 'Alice'
    render(<HelloWorld name={testName} />)
    expect(screen.getByText(`Hello, ${testName}!`)).toBeInTheDocument()
  })

  it('applies correct CSS module classes', () => {
    render(<HelloWorld name="Test" />)
    const container = screen.getByText('Hello, Test!').closest('div')
    const heading = screen.getByRole('heading', { level: 2 })
    // CSS modules generate hashed class names, so we check they exist
    expect(container).toHaveAttribute('class')
    expect(heading).toHaveAttribute('class')
    expect(container?.className).toContain('container')
    expect(heading.className).toContain('greeting')
  })

  it('displays greeting as h2 element', () => {
    render(<HelloWorld name="Test" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Hello, Test!')
  })

  it('handles special characters in name', () => {
    const specialName = 'José & María'
    render(<HelloWorld name={specialName} />)
    expect(screen.getByText(`Hello, ${specialName}!`)).toBeInTheDocument()
  })

  it('handles empty name prop', () => {
    render(<HelloWorld name="" />)
    expect(screen.getByText('Hello, !')).toBeInTheDocument()
  })
})
