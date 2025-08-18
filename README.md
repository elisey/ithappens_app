# ithappens

PWA приложение для чтения историй с офлайн-доступом.

## Разработка

Для автоматизации команд разработки используется [Task](https://taskfile.dev/).

### Установка Task

Если Task не установлен, установите его:

```bash
# macOS
brew install go-task

# Linux/Windows - см. https://taskfile.dev/installation/
```

### Доступные команды

```bash
# Запуск dev сервера
task dev

# Проверка качества кода (lint + format + test)
task check

# Сборка для продакшена (с предварительной проверкой)
task build

# Предпросмотр продакшен сборки
task preview

# Тестирование
task test                # Однократный запуск тестов
task test:watch          # Тесты в режиме наблюдения
task test:coverage       # Тесты с coverage отчетом

# Проверка кода
task lint                # ESLint проверка
task format              # Форматирование Prettier
task format:check        # Проверка форматирования

# Очистка сгенерированных файлов
task clean
```

### Архитектура проекта

```
src/
├── components/          # React компоненты
├── services/           # Бизнес-логика и API
├── utils/              # Утилиты
├── types/              # TypeScript типы
├── data/               # Статические данные
└── tests/              # Настройки тестирования
```

## Технологический стек

- **Frontend:** Preact + TypeScript
- **Build Tool:** Vite
- **Стили:** CSS Modules
- **Тестирование:** Vitest + Testing Library
- **Качество кода:** ESLint + Prettier
- **Автоматизация:** Task

## Git Hooks

Проект использует [lefthook](https://github.com/evilmartians/lefthook) для автоматической проверки качества кода:

### Pre-commit hook

Автоматически выполняется перед каждым коммитом:

- **Lint**: ESLint проверка для staged файлов
- **Format**: Prettier форматирование для staged файлов
- **Test**: Запуск всех тестов

### Commit-msg hook

Проверяет формат сообщения коммита:

- `feat: новая функциональность`
- `fix: исправление бага`
- `docs: изменения документации`
- `style: форматирование кода`
- `refactor: рефакторинг`
- `test: добавление тестов`
- `chore: обновление зависимостей и настроек`

### Обход hooks

При необходимости можно пропустить hooks:

```bash
git commit --no-verify -m "message"
```

## Команды разработки

Все основные команды доступны через Task. Рекомендуется использовать `task check` перед каждым коммитом для обеспечения качества кода.
