# ithappens

PWA application for reading stories with offline access.

## Development

Development automation is handled by [Task](https://taskfile.dev/).

### Installing Task

If Task is not installed, install it:

```bash
# macOS
brew install go-task

# Linux/Windows - see https://taskfile.dev/installation/
```

### Available Commands

```bash
# Start dev server
task dev

# Code quality check (lint + format + test)
task check

# Production build (with preliminary checks)
task build

# Preview production build
task preview

# Testing
task test                # Run tests once
task test:watch          # Run tests in watch mode
task test:coverage       # Run tests with coverage report

# Code checking
task lint                # ESLint check
task format              # Prettier formatting
task format:check        # Check formatting

# Clean generated files
task clean
```

### Project Architecture

```
src/
├── components/          # React components
├── services/           # Business logic and API
├── utils/              # Utilities
├── types/              # TypeScript types
├── data/               # Static data
└── tests/              # Test setup
```

## Technology Stack

- **Frontend:** Preact + TypeScript
- **Build Tool:** Vite
- **Styles:** CSS Modules
- **Testing:** Vitest + Testing Library
- **Code Quality:** ESLint + Prettier
- **Automation:** Task

## Git Hooks

The project uses [lefthook](https://github.com/evilmartians/lefthook) for automatic code quality checks:

### Pre-commit hook

Runs automatically before each commit:

- **Lint**: ESLint check for staged files
- **Format**: Prettier formatting for staged files
- **Test**: Run all tests

### Commit-msg hook

Validates commit message format:

- `feat: new feature`
- `fix: bug fix`
- `docs: documentation changes`
- `style: code formatting`
- `refactor: refactoring`
- `test: adding tests`
- `chore: dependency and config updates`

## Development Commands

All main commands are available through Task. It's recommended to use `task check` before each commit to ensure code quality.
