# Vendored canvas-word browser editor

Source commit: `69dac7966e8932ec9b8bb8bde152d008d67a2cc3`
Upstream: https://github.com/Forevka/canvas-word
License: MIT, retained in `wordcanvas/LICENSE`. The Lapis package itself stays Apache-2.0.

The tree is the browser editor only. It keeps `frontend/src` files reachable from
`frontend/src/wordcanvas.ts`, including the import and export workers those files
reference, plus `shared/src` aliased as `@cw/shared`. Backend, desktop, dashboard,
landing, examples, and the Node export build are not included. `@forevka/wordcanvas`
is not an npm dependency.

Four host adaptations are recorded here:

- Each vendored TypeScript file starts with `// @ts-nocheck` so the Lapis checker
  does not adopt the upstream program.
- `editorApp.ts` does not load `@mcp-b/global`. Agent tools are outside this
  reading plugin, so that optional import is a warning instead of a dependency.
- The save-state refresh calls `onDirtyChange` when the unsaved flag flips, so
  a file view can write the vault file before it closes.
- The export worker loads pdfkit, which imports Node builtins. Storybook, its
  export worker, and the plugin release build polyfill `assert`, `buffer`,
  `events`, `stream`, `util`, and `zlib`. The worker and the release build also
  polyfill `process`. Storybook's own client imports `node:process`, so that
  module stays real there. Vitest stays on real Node and does not receive the
  shims.

`@chenglou/pretext@0.0.7` stays a bundled dependency. The upstream
`pretext-patch` is applied with pnpm `patchedDependencies` from
`patches/@chenglou__pretext@0.0.7.patch`. `fflate` and `txml` are bundled
because the DOCX import uses them. None of these modules are host externals.
