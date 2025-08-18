// ABOUTME: Main application component
// ABOUTME: Главный компонент приложения, отображает заголовок и статус загрузки
import styles from './app.module.css'

export function App() {
  return (
    <div className={styles.app}>
      <h1 className={styles.title}>ithappens</h1>
      <p className={styles.loading}>Загрузка приложения...</p>
    </div>
  )
}
