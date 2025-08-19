// ABOUTME: Component for displaying story text with proper typography
// ABOUTME: Компонент для отображения текста истории с правильной типографикой
import styles from './StoryContent.module.css'

interface StoryContentProps {
  text: string
  isLoading?: boolean
}

export function StoryContent({ text, isLoading = false }: StoryContentProps) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка истории...</div>
      </div>
    )
  }

  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0)

  return (
    <div className={styles.container}>
      <article className={styles.story}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph.trim()}
          </p>
        ))}
      </article>
    </div>
  )
}
