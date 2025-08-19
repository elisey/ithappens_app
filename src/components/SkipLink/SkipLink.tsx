// ABOUTME: Skip-to-content link for accessibility
// ABOUTME: Ссылка "перейти к содержанию" для доступности
import styles from './SkipLink.module.css'

interface SkipLinkProps {
  targetId: string
  children: string
}

export function SkipLink({ targetId, children }: SkipLinkProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (e: any) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      // Check if scrollIntoView exists (not available in JSDOM)
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView()
      }
    }
  }

  return (
    <a href={`#${targetId}`} className={styles.skipLink} onClick={handleClick}>
      {children}
    </a>
  )
}
