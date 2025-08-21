// ABOUTME: ESLint configuration using flat config format for ESLint v9+
// ABOUTME: Настройка ESLint с поддержкой TypeScript, React hooks и сортировки импортов
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        window: 'readonly',
        __dirname: 'readonly',
        fetch: 'readonly',
        globalThis: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Response: 'readonly',
        MouseEvent: 'readonly',
        global: 'writable',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
          },
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  prettier,
  {
    ignores: ['dist/', 'node_modules/', '*.min.js'],
  },
]
