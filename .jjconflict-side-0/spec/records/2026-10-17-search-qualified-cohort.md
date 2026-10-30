# Retain Search fixes in the desktop dependency cohort

The desktop refresh to Search `ee20d366` preserved accessible result labels but
lost the separately qualified migration fixes in `c8db9717` and `ed85b836`.
Both exact native Search scenarios fail in desktop parent `33134c3a`: cold
restart restores an empty query, and disk recovery does not refresh controls.
The new AI user-command store is not the cause.

Apply only the accessible filename/path label and its governed interaction case
to the qualified migration source `147ba6e2`. Retain query-state publication,
App-owned notices and Configuration recovery. No consumer override, package
publication, source alias, assertion relaxation or baseline change is needed.

## Focused evidence

`pnpm exec vitest run --project storybook stories/plugins/search/SearchToolResult.stories.ts`
first fails one case: the accessible label omits the visible path. With the
source label retained, the verbose rerun passes one interaction/axe case.

`pnpm --filter @lapis-notes/search exec vitest run src/lib/search-notice-ownership.test.ts src/lib/search-view-state.test.ts src/lib/search-settings-recovery.test.ts`
passes all five retained regressions. Wider source checks, archive qualification
and native consumer revalidation remain pending. A first nonverbose browser
attempt ended without a test summary; it is not counted as evidence.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. This corrective cohort
does not qualify ordinary Notes AI or change M10.2's original gate.

The first full source catalog passes shard 1 (56 cases), then shard 2 reports
one AI SearchToolHits failure and 71 passes: its old exact name omits the newly
required path. The exact AI target reproduces one failure. Update only that
locator to the complete filename/path; navigation, content and retained-chat
assertions stay intact. Remaining shards were not reached.

## Wider source qualification

After the exact AI SearchToolHits locator fix, the complete source catalog passes
236 interaction/accessibility cases across all four normal shards (56, 72, 48,
60). The static Storybook build passes. All 807 package tests pass; root check
passes all 13 tasks and public builds all 12 tasks. Existing Turbo cache entries
are retained for unchanged packages. Strict Search checks/build rerun.

`pnpm audit` exits zero with the existing one moderate and one high ignored
finding; no ignore or dependency changes. `pnpm test:release` passes all 119
release/archive/signature tooling cases. `pnpm spec:check` passes validation,
mdBook, spec-first and App ownership.

An initial local payload-build attempt stops before building because its normal
source-commit guard requires an empty working-copy change. Commit the verified
source candidate first, then run payload reproduction/verification and pack its
public exports for native consumer revalidation. This is local qualification,
with no publication, signing-service installation or main-bookmark movement.
