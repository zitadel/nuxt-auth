module.exports = {
  ignoreDependencies: [
    '@commitlint/config-conventional',
    '@semantic-release/.*?',
    'vitest-environment-nuxt',
    'ofetch',
  ],
  entry: ['src/module.ts', 'src/runtime/**/*.ts'],
  ignore: ['commitlint.config.js', 'docs/**', 'playground/**'],
}
