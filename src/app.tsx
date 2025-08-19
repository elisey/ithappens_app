// ABOUTME: Main application component
// ABOUTME: Главный компонент приложения с Layout и тремя зонами
import { useState } from 'preact/hooks'
import styles from './app.module.css'
import { Layout } from './components/Layout'
import { Navigation } from './components/Navigation'

export function App() {
  const [currentId] = useState(1)

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
      <div className={styles.mainContent}>
        <p className={styles.loading}>Загрузка приложения...</p>
      </div>
    </Layout>
  )
}
