# Bases compatibility audit — 2026-11-12

This slice implements LN-BASE-045 as private audit tooling. It changes no plugin
runtime, public API, stylesheet, story, published dependency or lockfile.

## Source and comparison authority

- Started from freshly fetched `main@codex-https`, commit
  `201d5e61` (Canvas save-queue merge). Bases is `0.3.0`.
- Preserved the previous working copy and its unrelated `debug-storybook.log`
  change by starting a new JJ change on the fetched head. The existing conflicted
  local `main` bookmark is outside this slice.
- Reviewed official Obsidian Bases syntax, functions and views documentation.
  `docs/bases-compatibility/upstream.json` retains exact document Git blob hashes,
  headings, review date and all 68 function identities by receiver type.
- `report.json` records exact probe inputs, expected/observed values, implementation
  SHA-256 fingerprints and installed API `0.2.4`, PEaQL `0.1.25`, Luxon `3.7.2`.

## Results and tracking

The inventory has 89 stable feature IDs and 143 executable probes: 86 match the
reviewed expectation and 57 expose compatibility gaps. Aggregation yields 32
supported areas, 22 partial, 25 gaps and 10 requiring manual acceptance. These
are documentation-derived examples, not a live Obsidian differential test or
an overall parity percentage. No conformance gap is repaired by this slice.

Highest-priority failures are discarded global string filters, ignored per-view
`filters`, and their effect on global AND view composition. Other tracked
differences include double-equals execution, numeric truthiness, bracket note
access, formula references/sorting, relative dates/durations, regex literals,
list overloads, case sensitivity, typed files/links and context ownership.
Manual entries preserve map-unavailable evidence, UI/host acceptance, grouped
summaries, named-view embeds and bounded cycle-detection work.

Normal CI runs the offline check independently of the package test cache and
uploads actual observations even when a baseline check fails. The explicit
network command detects upstream hash/function drift without silently updating
reviewed expectations. An independent advisory CI job runs that network check
on each CI invocation and uploads its drift report without blocking unrelated
work on moving upstream documentation. Stable IDs, owners, priorities and generated JSON provide
the tracking surface; no external issues or notifications are created.

## Validation

- Before editing, the exact narrow target was
  `pnpm --dir packages/bases exec vitest run src/lib/bases-view/filter-parser.spec.ts src/lib/bases-view/filter-parser.test.ts src/lib/bases-view/document-core.test.ts`:
  58 passed, 0 failures.
- Frozen registry install:
  `pnpm install --ignore-pnpmfile --frozen-lockfile --ignore-scripts` passed.
  The first install without `--ignore-pnpmfile` encountered a machine-local hook
  checksum mismatch. No hook, loader, dependency or lockfile was modified.
- `pnpm audit`: passed; two low vulnerabilities remain under existing ignores.
  No audit exception was added.
- `pnpm --dir packages/bases check`: 0 errors and 0 warnings.
- `pnpm --dir packages/bases test`: all 22 files / 182 tests passed, 0 failures.
  This includes the original narrow target after the change.
- `pnpm --dir packages/bases build`: passed Svelte packaging and publint.
  A fresh `pnpm --dir packages/bases pack --pack-destination ../../.release/bases-compatibility/npm`
  also passed; audit fixtures are absent from the package contents.
- `node --test scripts/bases-compatibility.test.mjs scripts/plugin-release.test.mjs scripts/build-plugin-release.test.mjs scripts/plugin-archive-contract.test.mjs scripts/static-release-workflow.test.mjs scripts/classify-ci-changes.test.mjs`:
  38 passed, including archive reproduction/signature and unchanged CI routing
  contracts. This is tooling regression evidence, not a signed release candidate.
- `pnpm audit:bases`: 80 checks pass against the explicit baseline; 57 known
  conformance mismatches remain visible in the report. Every run starts a fresh
  Vitest process and imports the real query implementation.
- An intentional self-check inverted one baseline outcome and made the tracked
  report stale. The audit rejected both changes and produced fresh failure
  artifacts. Both files were restored before the normal passing check.
- `pnpm audit:bases:upstream`: no upstream changes from the reviewed hashes.
- `pnpm spec:check`: validate, mdbook and spec-first pass. The first spec-first
  attempt required the existing root-tooling mappings to governance and native
  service chapters; both now document this audit's evidence boundaries.
- `node scripts/check-app-ownership.mjs`: explicit ownership audit passed.
- Prettier checks cover the new scripts, dedicated fixtures and audit workflow.

`spec-validator doctor` and semantic `pnpm spec:search` were attempted with the
current latest Deno-free validator `0.2.0`. QMD's native modules do not match Node
ABI 147, so discovery used the documented `rg` fallback. The machine-global
installation was left unchanged; this does not block the canonical spec checks.

The private audit fixture and configuration do not modify shared package/browser
test infrastructure. Existing UI, interaction, accessibility, visual and consumer
qualification remain separate lanes; this slice makes no new product-acceptance
or publication claim. No baselines were weakened and no release was performed.
