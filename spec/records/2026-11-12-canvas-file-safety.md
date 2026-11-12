# Canvas file-safety qualification

This is the first Canvas alignment slice. Canonical status and remaining work
live in `spec/src/plugins/canvas/index.md` (LN-CANVAS-005 through LN-CANVAS-023).
Authoring, writer lifecycle, live embeds, contrast and the remaining parity
workflows are not implemented by this slice.

## Source scope

Base: `lapis-plugins` main `42376f79f1eae0ba9650a67e4b44c7a6aaf79256`.
The registry reports `@lapismd/spec-validator@0.2.0` as the latest release;
the existing range and frozen lock already resolve that Deno-free version.
`pnpm spec:search --semantic "Canvas file preservation parse save round trip"`
and `pnpm exec spec-validator doctor` passed discovery and wiring checks
(10 passes; the existing custom-script-alias warning remains).

Editable and embedded documents now reject unsupported/malformed structures
instead of allowing a later edit to discard them. Imported geometry, stacking
and extension fields survive serialization. Omitted target endpoints render
arrows without filling in persisted endpoint fields. Newly created group frames
stay below their content after imported stacking order is honoured.

## Regression and wider receipts

- Exact initial regression:
  `pnpm --filter @lapis-notes/canvas exec vitest run src/lib/json-canvas-safety.test.ts`:
  **15 failed / 3 passed before; 18 passed / 0 failed after**. Three additional
  deletion/explicit-endpoint cases bring the final target to **21 passed**.
- `pnpm --filter @lapis-notes/canvas check`: no errors or warnings.
- `pnpm --filter @lapis-notes/canvas test`: **31 passed / 0 failed**, three files.
- `pnpm exec vitest run --project storybook stories/plugins/canvas`:
  **18 passed / 0 failed**, three files, including imported geometry/default
  arrows, invalid-file protection, and grouping imported cards.
- The new grouping play initially used Shift selection and failed to find the
  group action. XYFlow's existing Linux multi-selection contract uses Control.
  Using that actual shortcut gives **1 passed / 0 failed** for the exact play;
  no product shortcut, assertion, or accessibility exclusion was weakened.
- Root native `pnpm check`, `pnpm test`, and `pnpm build` passed: **18/18 check
  tasks, 1,127 unit tests / 0 failures, 17/17 build tasks**. All 17 package test
  summaries are included; existing Turbo cache receipts remain visible.
- Canonical container `pnpm test:storybook`: all **64 files passed**, with
  **279 passed / 0 failed / 57 existing skipped** cases across eight shards.
  That snapshot predates only the additional grouping play; the complete current
  Canvas family, including that play, passes separately as recorded above.
- `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm spec:check`: validate, mdBook
  and spec-first passed. Root check also runs the explicit-App ownership audit.
- `pnpm audit`: passed with the two already governed low-severity ignores;
  no advisory ignore changed.
- `pnpm test:release`: **199 passed / 0 failed**.
- `pnpm build-storybook`: passed after installing Sync's separately locked
  dependencies with `pnpm --dir packages/sync install --frozen-lockfile
  --ignore-workspace`.
- Canvas package build and publint passed; `pnpm packages:pack -- --already-built`
  packed all 17 packages. Canvas runtime bundling and `pnpm plugin:verify` passed.
  Test signing, signed archive verification and deterministic reproduction
  passed through the existing static-release candidate helper.

Initial native broad browser runs encountered Vite dependency re-optimization
and iframe invalidation in unrelated families. A separately started full run
used the repository's container runner and passed every shard. AI Chat and
Search Tool Results also passed their exact focused native rerun (8 tests).
An initial overlapping local browser invocation encountered a port collision;
it ran no tests. Initial concurrent build-dependent invocations raced over
Markdown dist; the sequential canonical build/check/test runs above passed.
These local invocation failures are not reported as functional passes.

## Consumer evidence

Lapis Notes consumer main:
`6fbe662e` (`api@0.2.8` release merge). No consumer manifests, lockfiles, host
profiles, loader configuration or production code changed.

A temporary single-plugin registry used the owning release script's test keys,
normal registry schema, signed candidate helper and installer. The packaged
Canvas code was built from source snapshot
`22580bc02f0deddecada03516eca45a3349cd2e8`; subsequent changes added only
specification/evidence and the grouping play. This is a temporary acceptance
setup, not a registry release or production trust change.

Both the standard Web build and registry-acceptance build passed. An isolated
Playwright test in Notes' ignored `.local/canvas-acceptance` directory passed:
**1 passed / 0 failed**. It created an OPFS vault, installed Canvas through
`pluginDistribution`, edited a small imported card's colour, checked the saved
root/node/edge extensions and dimensions, opened a Markdown canvas embed,
checked the target arrow in both renderers, and verified an invalid canvas
remained unchanged on disk. The runner was
`node .local/canvas-acceptance/run.mjs`.

A packaged native Desktop executable is not present in this checkout, so native
Desktop release acceptance is not claimed. No application was deployed and no
npm package, registry entry, production signature or public asset was published.
Visual review stays pending; no baseline was created or updated.
