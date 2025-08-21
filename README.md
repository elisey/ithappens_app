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
├── components/          # Preact components
│   ├── ErrorBoundary/   # Error handling UI with retry functionality
│   ├── LoadingSpinner/  # Animated loading indicators
│   ├── Navigation/      # Story navigation controls
│   ├── StoryContent/    # Story display and formatting
│   ├── Layout/         # App layout structure
│   └── JumpToIdModal/  # Jump-to-story modal
├── services/           # Business logic and API
│   └── storyService.ts # Story data management with error handling
├── utils/              # Utility functions
│   └── navigation.ts   # Navigation calculations
├── types/              # TypeScript types
│   ├── errors.ts       # Typed error classes
│   ├── story.ts        # Story-related types
│   └── globals.d.ts    # Global type declarations
└── tests/              # Test configuration
    └── setup.ts        # Global test setup

tests/
├── utils/              # Test utilities and helpers
├── components/         # Component-specific tests
├── services/           # Service layer tests
└── smoke/              # End-to-end smoke tests
```

## Technology Stack

- **Frontend:** Preact + TypeScript
- **Build Tool:** Vite
- **Styles:** CSS Modules
- **Testing:** Vitest + Testing Library + Custom Test Helpers
- **Code Quality:** ESLint + Prettier + TypeScript Strict Mode
- **Error Handling:** Typed error system with user-friendly UI
- **Automation:** Task + npm scripts

## Key Features

### 🎨 User Experience

- **Smooth Loading States:** Animated loading spinners with accessibility support
- **Comprehensive Error Handling:** User-friendly error messages with actionable solutions
- **Keyboard Navigation:** Full keyboard support (Arrow keys, Enter)
- **Responsive Design:** Works on mobile and desktop
- **Accessibility:** WCAG compliant with proper ARIA attributes

### 🛠️ Developer Experience

- **TypeScript Strict Mode:** Full type safety with zero `any` types
- **Standardized Testing:** Consistent test patterns with helper utilities
- **Error Recovery:** Automatic retry mechanisms for network errors
- **Hot Reload:** Fast development with Vite HMR
- **Code Quality:** Automated linting, formatting, and pre-commit hooks

### 🔧 Technical Capabilities

- **Circular Navigation:** Seamless story-to-story navigation with gap handling
- **Timeout Handling:** Request timeouts with automatic retry
- **Progressive Enhancement:** Graceful degradation for missing features
- **Bundle Optimization:** Tree-shaking and code splitting
- **Test Coverage:** Comprehensive unit, integration, and smoke tests

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

All main commands are available through npm scripts or Task:

```bash
# Quality checks
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix ESLint issues
npm run type-check        # TypeScript type checking
npm run quality-check     # Complete quality check suite

# Pre-commit verification
npm run pre-commit        # Same checks as git pre-commit hook
```

It's recommended to use `npm run quality-check` or `task check` before each commit to ensure code quality.

## Getting Started for New Developers

1. **Setup**: Follow installation steps above
2. **Read**: Check `docs/DEVELOPMENT.md` for detailed guidelines
3. **Test**: Run `npm run test:watch` to see tests in action
4. **Develop**: Use `npm run dev` and make changes
5. **Quality**: Run `npm run quality-check` before committing

The codebase uses modern patterns with full TypeScript support and comprehensive error handling.
