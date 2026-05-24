import mridangPlugin from '@mridang/eslint-defaults'
import nuxtPlugin from '@nuxt/eslint-plugin'

export default [
  {
    ignores: [
      '**/.nuxt/**',
      '**/.output/**',
      '.out/**',
      'dist/**',
      'docs/**',
      'build/**',
      '*.config.*',
      '**/*.css',
    ],
  },
  ...mridangPlugin.configs.recommended,
  { plugins: { nuxt: nuxtPlugin } },
  {
    files: ['**/*.{yml,yaml}'],
    rules: {
      // Defer YAML quote style to prettier — yml/quotes (from
      // @nuxt/eslint-plugin) wants double quotes, prettier wants
      // single, and the two cycle endlessly when both run.
      'yml/quotes': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      // This is a Vue/Nuxt project — disable React-specific rules that
      // false-positive on Nuxt composables like useState, useRouter, etc.
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/globals': 'off',
      // TypeScript function overloads are valid and handled by
      // @typescript-eslint/no-redeclare instead.
      'no-redeclare': 'off',
    },
  },
]
