// ABOUTME: Main layout component providing three-zone structure
// ABOUTME: Компонент макета с тремя зонами: header, content, footer
import { ComponentChildren } from 'preact'
import styles from './Layout.module.css'

interface LayoutProps {
  header: ComponentChildren
  children: ComponentChildren
  footer: ComponentChildren
}

export function Layout({ header, children, footer }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header} role="banner">
        {header}
      </header>
      <main className={styles.content} role="main">
        {children}
      </main>
      <footer className={styles.footer} role="contentinfo">
        {footer}
      </footer>
    </div>
  )
}
