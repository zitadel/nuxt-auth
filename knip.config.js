module.exports = {
  ignoreDependencies: ['@semantic-release/.*?', 'vitest-environment-nuxt', 'ofetch'],
  ignoreBinaries: ['playwright'],
  entry: ['src/module.ts', 'src/runtime/**/*.ts'],
  ignore: ['playground-authjs/**', 'examples/**'],
}
