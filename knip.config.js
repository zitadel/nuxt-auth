module.exports = {
  ignoreDependencies: [
    '@commitlint/config-conventional',
    '@semantic-release/.*?',
    'vitest-environment-nuxt',
    'ofetch',
  ],
  ignoreBinaries: ['playwright'],
  entry: ['src/module.ts', 'src/runtime/**/*.ts'],
  ignore: ['commitlint.config.js', 'playground-authjs/**'],
}
