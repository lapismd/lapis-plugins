# CSV runtime shared-module metadata repair

Date: 2026-10-27

## Finding

`node scripts/build-plugin-release.mjs --plugin lapis-csv` failed the host
module externalization guard with three findings:

- `@lapis-notes/api/workspace-host` imported in `main.mjs` without being
  declared as a shared dependency
- `svelte/renderer/5.56.10/events` likewise undeclared
- `svelte/renderer/5.56.10/reactivity` likewise undeclared

The `workspace-host` import is committed CSV source
(`packages/csv/src/lib/csv-view-settings.ts`, byte-identical at the
pre-integration main tip `4808e315`), so the guard failure predates this
integration and reproduces on unmodified main: the canonical shared-module
lists in `scripts/sync-package-metadata.mjs` were never updated when the
CSV canvas/workspace-host work landed. Every other Svelte component
package (graph, markdown, history, search, bases) already declares the
events/reactivity renderer modules.

## Repair

- `scripts/sync-package-metadata.mjs`: the csv host-module list gains
  `@lapis-notes/api/workspace-host`; the csv renderer list gains
  `svelte/events` and `svelte/reactivity`.
- `packages/csv/manifest.json` regenerated with
  `node scripts/sync-package-metadata.mjs --write` (only the csv runtime
  `sharedDependencies` block changes; the docx serialization wobble from
  the same run was restored, not committed).
- `.changeset/csv-runtime-shared-modules.md` records the consumer-facing
  patch intent.

## Validation

- `node scripts/sync-package-metadata.mjs --check`: 17 manifests verified.
- `node scripts/sync-package-docs.mjs --check`: 17 packages verified.
- `node scripts/check-package-boundaries.mjs`: 17 boundaries verified.
- `node scripts/check-registry-metadata.mjs`: 18 registry metadata sources
  verified.
- `node scripts/build-plugin-release.mjs --plugin lapis-csv` builds the
  payload archive and the guard passes (result recorded in the integration
  report archive table).
- CSV package suite and the release-tool suite rerun after the change;
  counts recorded in the integration report.
