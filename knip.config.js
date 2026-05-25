module.exports = {
  ignore: ['commitlint.config.js', 'build.config.ts', 'playground/**'],
  ignoreDependencies: [
    '@commitlint/config-conventional',
    '@semantic-release/.*?',
    'vitest-environment-nuxt',
    'ofetch',
  ],
  entry: ['src/module.ts', 'src/adapter.ts', 'src/runtime/**/*.ts'],
};
