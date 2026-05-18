module.exports = {
  ignore: [
    'commitlint.config.js',
    'dist/**',
    'build/**',
    'typedoc.config.mjs',
    'playground/**',
  ],
  ignoreDependencies: [
    '@commitlint/config-conventional',
    '@semantic-release/.*?',
    'vitest-environment-nuxt',
    'ofetch',
  ],
  ignoreBinaries: ['playwright'],
  entry: ['src/module.ts', 'src/adapter.ts', 'src/runtime/**/*.ts'],
};
