/**
 * `@nuxt/module-builder` wraps `unbuild` with a hard-coded `entries`
 * list of `src/module` plus the `src/runtime/` mkdist tree, and offers
 * no surface to add further entries. We need the package's declared
 * `./adapters` sub-export to actually produce `dist/adapter.d.ts`
 * (otherwise `package.json` advertises a path that doesn't exist and
 * module-builder fails the build with `failOnWarn: true`).
 *
 * unbuild loads this file alongside the hard-coded config and merges
 * the two with `defu`, which concatenates arrays. So listing
 * `src/adapter` here adds it to module-builder's defaults rather than
 * replacing them — the module + runtime build is preserved, and the
 * adapter entry produces its declaration file.
 */
import { defineBuildConfig } from 'unbuild';

// noinspection JSUnusedGlobalSymbols
export default defineBuildConfig({
  entries: ['src/adapter'],
});
