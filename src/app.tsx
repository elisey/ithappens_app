// ABOUTME: Main application component
// ABOUTME: Главный компонент приложения с Layout и тремя зонами
import styles from './app.module.css'
import { Layout } from './components/Layout'

export function App() {
  return (
    <Layout
      header={
        <div className={styles.headerContent}>
          <h1 className={styles.title}>ithappens</h1>
        </div>
      }
      footer={
        <div className={styles.footerContent}>
          <p className={styles.placeholder}>Navigation will be here</p>
        </div>
      }
    >
      <div className={styles.mainContent}>
        <p className={styles.loading}>Загрузка приложения...</p>
      </div>
    </Layout>
  )
}
