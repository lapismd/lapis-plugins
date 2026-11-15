# Repository remotes preview: existing status controls

Requirement: LN-HIST-020; existing LN-HIST-012/013/014 and LP-SPEC-054 remain.
This revision follows the user's UI feedback on the review-only slice at
`fc06f3189a5f6367596a545c0f911b05067c8ac4`. Source change: `zokzmkyr`.

## Behavior and scope

The catalog renders the full WorkspaceShell with repository footer widgets.
The History remote toolbar and the fixture-description banner were removed.
The public `catalogLayout: full-viewport` option keeps the shell footer inside
the viewport. Narrow examples retain desktop shell status overflow menus.

The existing RepositoryWorkingCopyStatus, RepositoryBackupStatus and
RepositoryUpstreamActions components provide the original fetch/pull/push icons.
An optional explicit remote binding adds target labels, counts and a Manage
remotes entry to the footer, while the previous SyncController path remains
supported. Original pull is unavailable; backup pull remains available. Settings
retains target-specific fetch/push controls. The catalog uses real status-bar
registration and real controllers with memory services, and drains them during
teardown. No application adopts the remote binding in this slice.

A fresh in-app-browser reload verified the full shell, original footer icons,
no extra remote header/banner, and Manage remotes opening Repository History
settings. Screenshot: ignored `.local/remotes-preview/footer-revision.jpg`.
The [review inventory](../../docs/repository-remotes-preview.md) has 33 previews.
Stories remain `visual-pending`; visual baselines were not updated.

## Regression evidence

All commands deliberately use native macOS validation with Node 24.10.0 and
pnpm 10.34.5; these are not Docker/hosted or native application receipts.
Spec-validator remains the current Deno-free 0.2.0 release. The earlier slice
already proved QMD search and doctor under Node 24.

- Before editing, the exact `History Entry|History Needs Connection` story
  filter passed **2/2**. New footer-scoped assertions then failed **2/2**,
  proving the requested behavior was missing.
- First footer regression run: **4 passed / 1 failed**, plus three unhandled
  Svelte event-handler errors. Tooltip trigger props previously moved between
  wrapper and button when busy state changed. Keeping them on a stable wrapper
  removed the errors. Waiting for the real narrow overflow menu animation
  preserved the visibility assertion and fixed the remaining test.
- Final focused command: `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm
test:storybook -- stories/plugins/history/remotes/Remotes.stories.ts -t
'History Entry|History Needs Connection|Footer|Existing Status Controls'`:
  **6 passed / 27 skipped**, no unhandled errors.
- Complete affected command: `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm
test:storybook -- stories/plugins/history/remotes/Remotes.stories.ts
stories/plugins/history/repository/Repository.stories.ts`: **44/44 passed**
  (33 preview, 11 existing), including interaction/accessibility, both themes,
  narrow overflow, explicit reviewed push, backup pull, target isolation and
  the existing controller fetch/pull/push controls.
- History check briefly exposed one `aria-describedby` type error; narrowing
  the tooltip prop to a string fixed it. Final `pnpm --dir packages/history
check`: **zero errors/warnings**.
- `pnpm --dir packages/history test`: **49 unit + 96 repository cases passed**.
- Root `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm check`: **18 tasks passed**,
  including App-ownership, story parity, package boundaries and no-Tailwind.
- Root `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm build`: **17 tasks passed**,
  including publint.
- `pnpm audit`: pass; two low findings covered by unchanged tracked exceptions.

## Wider gates

The first root test rerun hit temporary compiler-write `ENOSPC` errors and
aborted after five successful tasks; this was not reported as a functional
pass. A retry with a CLI concurrency flag was rejected because the wrapper
already supplies that option. The supported `TURBO_CONCURRENCY=2` environment
setting still encountered compiler-write `ENOSPC` (nine Markdown import suites
and one Bases import suite). Final retry additionally bounds package Vitest
workers with `VITEST_MAX_WORKERS=2`; no assertions or source were changed.
The static catalog build also failed writing output with `ENOSPC`; it is retried
separately once the unit run drains, to limit concurrent resource use.

- `pnpm spec:check` and `pnpm spec:first`: pass (validation, mdBook and mapped
  spec-first checks). `pnpm exec spec-validator doctor --json` and
  `pnpm spec:search 'LN-HIST-020'`: pass, including QMD.
- `pnpm --dir packages/history run pack`: pass; Svelte packaging and publint pass.
- `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test:release`: **227 passed**,
  including release reproduction and signing-tool regression coverage.

- Final root test with `TURBO_CONCURRENCY=2 VITEST_MAX_WORKERS=2
LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test`: **18 tasks passed**,
  **1,372 Vitest tests + 96 repository cases passed**, no failed summaries.
- `node scripts/build-plugin-release.mjs --plugin history --commit
f21a68a8483e00926019ce128fc673a4059058ea`: private deterministic payload
  reproduction passed. `node scripts/verify-plugin-release.mjs`: pass.
  This is the actual source snapshot before final evidence updates.
- npm tarball SHA-256:
  `185e8cf097a61ac820c5533e7821e06479dbf5ed79bcf1d9cd4c266c0fdb7aba`.
- Private payload SHA-256:
  `7bb3d0a71fddfdd480f960acb3ee6c873b41fc964a412db6dda5296da9cfe805`.
  Default plugin runtime remains unadopted and its payload is unchanged.

`LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm build-storybook`: final separate
retry passed; full static catalog built successfully. No visual baseline changed.
Raw revision logs are retained under ignored `.local/remotes-preview/evidence/`.

The complete catalog blockers documented in the
[original receipt](2026-11-14-repository-remotes-preview.md) remain: three Bases
Kanban failures reproduced at unchanged main, and two suite import failures.
They are not waived. No push, publication, host adoption, real credentials or
network transfer occurs. The existing conflicted main bookmark is preserved.
