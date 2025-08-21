# Development Guide

This document provides comprehensive guidelines for developing the ithappens application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- [Task](https://taskfile.dev/) (recommended but optional)

### Setup

```bash
# Clone and install
git clone <repository-url>
cd ithappens_app
npm install

# Start development server
npm run dev
# or
task dev
```

## 📁 Project Structure

```
src/
├── components/          # Preact components
│   ├── ErrorBoundary/   # Error handling UI
│   ├── LoadingSpinner/  # Loading indicators
│   ├── Navigation/      # Story navigation
│   ├── StoryContent/    # Story display
│   └── Layout/         # App layout structure
├── services/           # Business logic
│   └── storyService.ts # Story data management
├── types/              # TypeScript types
│   ├── errors.ts       # Error handling types
│   ├── story.ts        # Story-related types
│   └── globals.d.ts    # Global type declarations
├── utils/              # Utility functions
│   └── navigation.ts   # Navigation helpers
└── tests/              # Test configuration
    └── setup.ts        # Global test setup

tests/
├── utils/              # Test utilities
│   └── testHelpers.ts  # Standardized test helpers
├── components/         # Component tests
├── services/           # Service tests
└── smoke/              # End-to-end smoke tests
```

## 🧪 Testing

### Running Tests

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Using Task
task test
task test:watch
task test:coverage
```

### Test Patterns

#### Using Test Helpers

Always use standardized test helpers from `tests/utils/testHelpers.ts`:

```typescript
import { createMockStoryService, renderAppWithMocks, waitForStoryLoad } from '../utils/testHelpers'

test('should load story', async () => {
  const mockService = createMockStoryService({
    '1': 'Test story content',
  })

  renderAppWithMocks({ storyService: mockService })
  await waitForStoryLoad('Test story content')
})
```

#### Mocking Services

```typescript
// For unit tests
const mockService = createMockStoryService(customData)

// For fetch mocking
setupMockFetch(customData)
```

#### Test Isolation

```typescript
import { withIsolatedTest } from '../utils/testHelpers'

test(
  'isolated test',
  withIsolatedTest(async () => {
    // Test code - mocks are automatically cleaned up
  })
)
```

### Test Organization

- **Unit tests**: `src/components/**/*.test.tsx`
- **Integration tests**: `tests/components/`
- **Service tests**: `tests/services/`
- **Smoke tests**: `tests/smoke/`

## 💻 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Export types from their respective modules
- Use proper generic constraints

### Component Patterns

```typescript
// ABOUTME: Component description
// ABOUTME: Описание компонента на русском

interface ComponentProps {
  required: string
  optional?: boolean
}

export function Component({ required, optional = false }: ComponentProps) {
  // Implementation
}
```

### Error Handling

Use the standardized error system:

```typescript
import { createAppError, NetworkError } from '../types/errors'

try {
  await someOperation()
} catch (error) {
  throw createAppError(error) // Auto-converts to appropriate error type
}
```

### State Management

- Use `useState` for local component state
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Use `useRef` for stable references (like service instances)

## 🏗️ Architecture

### Service Layer

Services handle business logic and data management:

```typescript
// Services are injected via props for testability
interface AppProps {
  storyService?: StoryService // Optional for dependency injection
}

export function App({ storyService: injected }: AppProps = {}) {
  const storyServiceRef = useRef<StoryService | null>(null)

  // Initialize service once
  if (!storyServiceRef.current) {
    storyServiceRef.current = injected || new StoryService()
  }
}
```

### Error Handling Flow

1. Services throw typed errors (`NetworkError`, `ParseError`, etc.)
2. Components catch and convert with `createAppError()`
3. UI displays user-friendly messages via `ErrorBoundary`
4. Retry functionality where appropriate

### Component Communication

- Props for parent → child data
- Callbacks for child → parent events
- Service injection for shared business logic

## 🛠️ Available Scripts

### Quality Checks

```bash
npm run lint              # ESLint check
npm run lint:fix          # ESLint fix
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript compilation check
npm run quality-check    # Full quality check suite
npm run pre-commit       # Pre-commit checks
```

### Development

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
```

### Task Alternative

All npm scripts have Task equivalents:

```bash
task dev
task test
task check               # Equivalent to quality-check
task build
```

## 🔧 Adding New Features

### 1. Plan Architecture

- Identify data flow requirements
- Design component hierarchy
- Plan error scenarios
- Consider testing strategy

### 2. Create Types

```typescript
// src/types/feature.ts
export interface FeatureData {
  id: string
  name: string
}
```

### 3. Implement Service

```typescript
// src/services/featureService.ts
export class FeatureService {
  // Business logic with proper error handling
}
```

### 4. Create Components

```typescript
// src/components/Feature/Feature.tsx
// Follow established patterns
```

### 5. Write Tests

```typescript
// Use testHelpers for consistency
import { createMockService } from '../../utils/testHelpers'
```

### 6. Update Documentation

- Add to this guide if architecture changes
- Update README.md for user-facing changes

## 🐛 Troubleshooting

### Common Issues

#### Tests Failing

```bash
# Clear all caches
npm run test -- --clearCache

# Check specific test file
npm run test:watch ComponentName
```

#### TypeScript Errors

```bash
# Check types without building
npm run type-check

# Restart TypeScript language server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### ESLint Errors

```bash
# Auto-fix fixable issues
npm run lint:fix

# Check specific file
npx eslint src/path/to/file.ts
```

#### Build Errors

```bash
# Clean build
rm -rf dist && npm run build

# Check bundle analysis
npx vite build --analyze
```

### Git Hooks Failing

```bash
# Run pre-commit checks manually
npm run pre-commit

# Skip hooks (emergency only)
git commit --no-verify
```

### Performance Issues

- Use browser DevTools Performance tab
- Check bundle size with `npx vite build --analyze`
- Profile React components with React DevTools

## 📚 Resources

### Documentation

- [Preact Documentation](https://preactjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

### Code Quality

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Specific

- `README.md` - User documentation
- `docs/1. Technical specification.md` - Full technical specification
- `docs/4.*.md` - Implementation milestones

## 🤝 Contributing

1. Follow the established patterns in existing code
2. Write tests for new functionality
3. Update documentation for architectural changes
4. Ensure all quality checks pass before committing
5. Use conventional commit messages

---

For questions or clarifications, refer to the technical specification or create an issue.
