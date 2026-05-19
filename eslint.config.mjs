import mridangPlugin from '@mridang/eslint-defaults';
import nuxtPlugin from '@nuxt/eslint-plugin';

export default [
  {
    ignores: [
      '**/.nuxt/**',
      'playground-authjs/**',
      '.output/**',
      '.out/**',
      'dist/**',
      'docs/**',
      'docs-src/**',
      'build/**',
      'playground/**',
      'build.config.ts',
      'vitest.config.ts',
      'vitest.nuxt.config.ts',
      '**/*.css',
    ],
  },
  ...mridangPlugin.configs.recommended,
  { plugins: { nuxt: nuxtPlugin } },
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
];
