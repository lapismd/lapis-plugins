# Lapis Sync current-main rebase qualification — 2026-11-15

The isolated Stage 1 and Stage 2 stack was rebased from documentation merge
`6b499b36` onto current Plugins main `e3d169fc`, after repository-remotes PR
#121 and the 0.3.0 release PR #122 merged. This receipt preserves the original
source receipts and records only the changed-base qualification.

## Rebase resolution

The rebase initially conflicted in three unrelated Bases/Canvas story-fix
commits that had been discovered while widening the original Stage 1 work.
Current main contains the canonically specified and more completely qualified
versions from PR #121: public clipboard entry for Bases and the shared
platform-primary Canvas keyboard helper. The three superseded task commits were
abandoned; no Sync implementation or assertion was discarded. The resulting
Stage 1 and Stage 2 bookmarks are conflict-free.

## Exact-head results

Stage 1 at `1ec7fbf5`:

- Sync unit suite: **18 files, 205 passed, 0 failed, 0 skipped**.
- Sync interaction/accessibility suite: **8 files, 57 passed, 0 failed**.
- Sync TypeScript/Svelte checks: zero errors and warnings; package build and
  publint passed.

Stage 2 at `0248b105`:

- Sync unit suite: **19 files, 326 passed, 0 failed, 0 skipped**.
- Rust Sync algorithms: **88 passed, 0 failed**; the complete private native
  crate passed **93 tests**. Rust format and strict all-target Clippy passed.
- Sync TypeScript/Svelte checks, package build and publint passed.
- Sync interaction/accessibility suite: **8 files, 57 passed, 0 failed**.

The post-rebase repository qualification used Node 24.10.0 and pnpm 10.34.5:

- root check: **18/18 tasks**; root test: **18/18 tasks**; root build:
  **17/17 tasks**;
- root audit passed with the two existing governed low findings ignored;
- the production Storybook build completed with its retained browser-external
  and chunk-size warnings;
- specification validation, mdBook and spec-first checks passed;
- `spec-validator doctor --json` was OK apart from the repository-owned script
  aliases reported by the tool.

The default local validation runtime again stopped in `docker info` before
collection. It was interrupted and rerun only through the explicit
`LAPIS_PLUGINS_VALIDATION_RUNTIME=native` policy. The native and hosted evidence
does not qualify local Docker. Visual review remains pending and no baseline was
changed.

## Remaining gates

This rebase changes no activation, publication or native-host claim. Stage 2
still qualifies pure algorithms only. Native storage, custody, guarded
filesystem effects, application scheduling and real-device/server journeys
remain owned by later stages. A signed branch push and fresh hosted CI are still
required for the rebased exact heads.
