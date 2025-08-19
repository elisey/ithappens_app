// ABOUTME: Tests for Layout component
// ABOUTME: Тесты для компонента Layout
import { render } from '@testing-library/preact'
import { Layout } from './Layout'

describe('Layout', () => {
  it('renders three zones with correct semantic tags', () => {
    const { container } = render(
      <Layout header={<div>Header content</div>} footer={<div>Footer content</div>}>
        <div>Main content</div>
      </Layout>
    )

    const header = container.querySelector('header')
    const main = container.querySelector('main')
    const footer = container.querySelector('footer')

    expect(header).toBeInTheDocument()
    expect(main).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
  })

  it('passes children to corresponding zones', () => {
    const { getByText } = render(
      <Layout header={<div>Test Header</div>} footer={<div>Test Footer</div>}>
        <div>Test Content</div>
      </Layout>
    )

    expect(getByText('Test Header')).toBeInTheDocument()
    expect(getByText('Test Content')).toBeInTheDocument()
    expect(getByText('Test Footer')).toBeInTheDocument()
  })

  it('has correct ARIA roles', () => {
    const { container } = render(
      <Layout header={<div>Header</div>} footer={<div>Footer</div>}>
        <div>Content</div>
      </Layout>
    )

    expect(container.querySelector('[role="banner"]')).toBeInTheDocument()
    expect(container.querySelector('[role="main"]')).toBeInTheDocument()
    expect(container.querySelector('[role="contentinfo"]')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(
      <Layout header={<div>Header</div>} footer={<div>Footer</div>}>
        <div>Content</div>
      </Layout>
    )

    const layoutDiv = container.firstChild
    expect(layoutDiv?.className).toMatch(/layout/)

    const header = container.querySelector('header')
    const main = container.querySelector('main')
    const footer = container.querySelector('footer')

    expect(header?.className).toMatch(/header/)
    expect(main?.className).toMatch(/content/)
    expect(footer?.className).toMatch(/footer/)
  })
})
