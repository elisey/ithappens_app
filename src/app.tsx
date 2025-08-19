// ABOUTME: Main application component
// ABOUTME: Главный компонент приложения с Layout и тремя зонами
import { useState } from 'preact/hooks'
import styles from './app.module.css'
import { Layout } from './components/Layout'
import { Navigation } from './components/Navigation'
import { StoryContent } from './components/StoryContent'

export function App() {
  const [currentId] = useState(1)
  const storyText = `Это пример истории для демонстрации типографики и компонента StoryContent.

В этой истории несколько параграфов, чтобы показать, как текст отображается с правильными отступами и оптимальной шириной строки для удобного чтения.

Типографические настройки оптимизированы для мобильных устройств, обеспечивая комфортное чтение на экранах разных размеров.

CSS переменные позволяют легко менять цветовую схему и отступы во всем приложении.`

  const handlePrevious = () => console.log('Previous')
  const handleNext = () => console.log('Next')
  const handleJump = () => console.log('Jump to ID')

  return (
    <Layout
      header={
        <div className={styles.headerContent}>
          <h1 className={styles.title}>ithappens</h1>
        </div>
      }
      footer={
        <Navigation
          onPrevious={handlePrevious}
          onNext={handleNext}
          onJump={handleJump}
          currentId={currentId}
          canGoPrevious={true}
          canGoNext={true}
        />
      }
    >
      <StoryContent text={storyText} />
    </Layout>
  )
}
