// ABOUTME: HelloWorld component for testing integration of all M0 infrastructure
// ABOUTME: Тестовый компонент для проверки работы всей настроенной инфраструктуры
import styles from './HelloWorld.module.css'

interface HelloWorldProps {
  name: string
}

export function HelloWorld({ name }: HelloWorldProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.greeting}>Hello, {name}!</h2>
    </div>
  )
}
