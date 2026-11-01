# Notebook compatibility qualification

## Authorized registry refresh — 1 November 2026

The user authorized merging and releasing this cohort, including version PRs
and eligible npm deployment approval. Core 0.9.0 completed its protected release
workflow `41258271966`, including installed-package integrity/provenance and tag
verification. The compatibility slice now admits Core 0.9 alongside existing
0.7.4/0.8 hosts and qualifies the private catalog against registry 0.9.0.
Original PR #49 CI `41254770785` passed; the refreshed exact head requires its
own complete CI before merge. CSV and other plugin runtime files stay untouched.

The initial registry projection still uses published API 0.2.3 and UI 0.1.5,
whose peers admit only older Core. This adds two temporary Core peer warnings;
hold final qualification/push until Notes' compatible patches are published,
then refresh API/UI/Workspace/Explorer development floors and the registry lock.
Do not suppress those peers or publish this intermediate graph.

- Latest Deno-free validator 0.2.0 rechecked; doctor and QMD search passed.
- `pnpm spec:first --base main@codex-https --head @`: passed 4 protected files,
  4 canonical chapters, 0 findings.
- First current-slice `pnpm spec:check`: 3 missing mapped chapter findings.
  Updated the owning distribution/native/governance notes; exact rerun passed
  validate/mdBook/spec-first, 0 findings. Changed-file formatting passed.
- Registry lock refresh targets Core 0.9 for the catalog and Markdown itself,
  retaining the Markdown public range's qualified 0.7.4 and 0.8 support.

### Registry cohort verified — 1 November, 02:06 UTC

Notes' release `41262301909` completed publication, clean registry verification
and all four GitHub releases. Verification initially failed once because npm
had not processed Workspace 0.3.2; after all versions became visible, the exact
failed jobs rerun passed. No republish, retry-policy change or assertion waiver.
The catalog now consumes API 0.2.4, UI 0.1.6, Workspace 0.3.2 and Explorer
0.2.1 with Core 0.9.0 through registry ranges. Both new Core peer warnings are
gone; only the pre-existing optional PDF Vue peer warnings remain.

- `pnpm install --lockfile-only --ignore-pnpmfile`: passed final registry graph.
- `pnpm check -- --filter=@lapis-notes/markdown`: passed in isolated Docker,
  including audit, 64 story-composition families, 17 package boundaries,
  App ownership/native CSS, Markdown build/publint and strict check (0 errors,
  0 warnings). Audit retained only the same two ignored low entries, no new
  moderate/high/critical findings. Receipt `lapis-plugins-validation-f1babc28-9cf9-46af-bd20-2a9542321c0a`.
- `pnpm test -- --filter=@lapis-notes/markdown`: 154 passed/0 failed in Docker;
  receipt `lapis-plugins-validation-b9b5e7d6-62a5-456c-b5b2-1d01ffdfdb2e`.
- `pnpm spec:first --base main@codex-https --head @`: 4 protected files,
  4 canonical chapters, 0 findings. Exact `pnpm spec:check` passed all three
  lanes; changed-file formatting passed. Latest validator remains 0.2.0.

The final hosted CI must qualify the pushed head before merge. Existing broad
candidate receipts above remain historical; no visual comparisons were run.

### Exact CI compatibility repair — 1 November 2026

Refreshed CI `41263868277` passed every applicable lane except quality (and its
aggregate): History's custom settings page resolved Core 0.7.4 while API 0.2.4
resolved Core 0.9.0. Its nominal `AppShellController` types failed assignment at
`repository-status.ts:59`. No runtime source defect or CSV change was involved.

- Before edit, exact `pnpm check -- --filter=@lapis-notes/history` reproduced
  1 strict error/0 warnings in Docker; receipt
  `lapis-plugins-validation-7ab1db18-6971-4b5d-ad46-7a4dce9be6fb`.
- History's portable Core range now also admits 0.9, and its lock resolves
  0.9 with the host API. No cast, alias, node_modules edit or test weakening.
- Exact rerun passed 0 errors/0 warnings plus audit, package boundaries and
  ownership/style policies; receipt
  `lapis-plugins-validation-ca472039-b4a0-47f1-93d1-899754c2fb1a`.
- `pnpm spec:first --base main@codex-https --head @`: passed 6 protected files,
  5 canonical chapters; `pnpm spec:check` passed all three lanes. Formatting passed.

History has a separate patch Changeset for honest public metadata versioning.
The authorized publication selection remains Markdown only; History publication
stays separate. History behavior, native services, CSV and other runtime sources
are unchanged. Its owning build/test lane and refreshed full CI remain required.

The owning `pnpm ci:packages -- --filter=@lapis-notes/history` then passed all
four tasks (build/publint, strict check, tests and required Markdown build),
including 23 Vitest plus 96 repository tests = 119 passed/0 failed. Receipt:
`lapis-plugins-validation-b92c9780-c84f-49ea-9cde-11b9ab1f68fe`.
The verification evidence is linked from History's canonical chapter. An
optional formatter probe also reproduces the unmodified central verification
table's existing formatting warning; that file has no retained change.

Notebook and Design Core UI was approved on 31 October 2026. Complete the
dependency-only Markdown compatibility checks and audit without changing CSV
or other plugin behavior. Full qualification is in progress. Pushing, merging
and publication require separate authorization. Keep visual baselines unchanged.

## Post-approval compatibility evidence

All commands used Node 24. Latest Deno-free validator remains 0.2.0; doctor
and working QMD search receipts are retained under `.local/qualification/`.

- `pnpm --filter @lapis-notes/markdown check`: 0 errors/0 warnings.
- `pnpm --filter @lapis-notes/markdown test`: 154 passed/0 failed.
- `pnpm --filter @lapis-notes/markdown build`: build and publint passed.
- `pnpm spec:check`: passed validation, mdBook and spec-first, 0 findings.
- `pnpm check:app-ownership`: passed in isolated Docker.
- `pnpm test:storybook -- stories/plugins/markdown`: 61 interaction/axe stories
  passed/0 failed across 11 files, fresh Docker browser. Receipt:
  lapis-plugins-validation-29dd091d-c0e1-4fa3-8988-f6272f00f308.
- `pnpm build-storybook`: full static catalog passed, no screenshot comparison.
- `node --test scripts/plugin-release.test.mjs scripts/plugin-archive-contract.test.mjs
scripts/npm-package-imports.test.mjs scripts/build-plugin-release.test.mjs`:
  26 passed/0 failed, including reproducibility/signature contracts.
- `pnpm --dir packages/markdown pack --pack-destination
../../.local/qualification/markdown-pack`: passed package and publint.
- `pnpm plugin:build -- --plugin markdown --out-dir ...` first stopped at
  the clean-working-copy release gate. Repeated with explicit immutable JJ
  source snapshot `ff4a0454e0c4f5dda3d1a11867da5fc7df57b818` and
  `--commit`: candidate payload passed. This is local qualification only.
- `pnpm plugin:verify -- <directory>` first failed on forwarded `--`; exact
  `node scripts/verify-plugin-release.mjs .local/qualification/markdown-payload`
  passed. A second build from the same snapshot matched SHA256
  `4e92ceadfb62b7821877f1ddf8a452af93b2f96c2d5a7ca1754b7c09d4056e10`.
- Initial audit had 1 new moderate minimatch finding. Remote main's matching
  baseline had none. Lock refresh exposed a stale root development History
  range (^0.1.4) that did not match the existing local 0.2.0 package. Aligning
  only the dev range to ^0.2.0 removed the obsolete registry dependency.
  Final audit has no advisories/moderate/high/critical findings and retains
  the same two pre-existing ignored low metadata entries. No new CVE ignore.

CSV and all other plugin runtime files remain unchanged. Published signing,
registry intake and final Notebook acceptance require the separately authorized
release cohort. This compatibility slice is not a publication receipt.
