# Design Core 0.4.0 consumer refresh

This review starts after merged Sync PR #25 and consumes published Design Core
`0.4.0` from PR #26. Root, direct plugin and private Sync ranges use `^0.4.0`;
the root and parked Sync lockfiles are registry-backed with local pnpm hooks
disabled. Active public consumers carry independent patch Changesets. Sync
remains private and excluded from recursive release selection.

## Evidence and release order

- Frozen registry installs, the normal dependency audit, specification and
  App-ownership checks pass under the existing audit policy.
- Root build passes all 12 tasks, and root check passes all 13 tasks.
- The exact Sync Settings file passes all 19 interaction/accessibility stories
  before the refresh and all 19 in a cold run after the refresh.
- The user requested minimal local testing because of memory pressure. Other
  aggregate tests and host builds were stopped; full interaction and package
  qualification remain with the normal required CI gates. No assertions,
  timeouts, diagnostics, selection or visual baselines are weakened.
- Published Notes API 0.1.4 and UI 0.1.3 still advertise Design Core `^0.3.2`.
  Their companion Notes refresh must land and publish compatible peer ranges;
  downstream host ranges and lockfiles can then follow those released versions.
  Until then, the install's peer-range warnings remain a release prerequisite.

This prepares the next Sync slice; it does not complete installed desktop
sign-in qualification, endpoint enrollment or content synchronization.

## PR #26 interaction repair

The first CI run (`38795959802`) passed build-cache, quality, unit, static
Storybook and release artifacts. Storybook shard 1 passed 61 cases; shard 2
passed 61 and failed seven, so later shards did not run and validate failed.

The repair addresses all seven reported targets:

- Open Code Harness Choices and Agent Trace wait for opening composer menus.
  Agent Trace and the registry tool-activity story select the public tool-call
  name part rather than ambiguously matching its expanded details too.
- Editable Cells and Query Controls retain every original suggestion, menu,
  width and alignment assertion, waiting for the expected visible geometry.
- Schema And View Settings exposes the property picker's accessible name and
  input/list relation. All Bases Command pickers explicitly bind their unique
  list IDs, and property-action icon buttons expose accessible names.
- Graph Middle Top Tabs measures the current remove-button location after
  focus can scroll its settings panel, retaining the real pointer-hit check.

Cold focused browser commands, one process at a time:

```sh
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/bases/BasesWorkflows.stories.ts -t 'Query Controls|Schema And View Settings'
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/ai/AiChat.stories.ts stories/plugins/ai/RegistryScreenshots.stories.ts stories/plugins/bases/BasesViews.stories.ts stories/plugins/graph/panels/Graph.stories.ts -t 'Open.*Harness Choices|Agent Trace|Chat with tool activity|Editable Cells|Middle Top Tabs'
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/ai/AiChat.stories.ts stories/plugins/bases/BasesViews.stories.ts -t 'Agent Trace|Editable Cells'
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/bases/BasesViews.stories.ts stories/plugins/bases/BasesWorkflows.stories.ts -t 'Editable Cells|Query Controls|Schema And View Settings'
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/bases/BasesViews.stories.ts -t 'Editable Cells'
```

The exact two-workflow reproduction went from two failures to two passes.
Remaining focused runs progressed from three of five passing, to Agent Trace
passing, to both workflows still passing, and finally Editable Cells passing.
All seven original failures now pass with zero interaction or axe failures in
those targets. Specification validation passes (601 requirements); the audit
retains only existing recorded ignores. Full catalog/package qualification
remains delegated to required CI under the user's memory-pressure instruction.
No assertions, timing limits, geometry tolerances, axe rules or baselines were
weakened. The existing Bases patch Changeset includes the accessibility repair.

## Final-shard AI shell repair

Run `38809583072` passes the first three shards (61 + 68 + 45 stories), including
all seven earlier failures. The final shard passes 56 and fails four in
`stories/plugins/ai/shell/Shell.stories.ts`: Desktop, Community Tool Opt In,
Local Conversations and Follow Scope. A cold four-target reproduction fails
all four at the same menu visibility or blocked-pointer boundaries.

The story repair waits for visible menus, scopes the Desktop tool summary to
its public call-name part, and waits for computed pointer handling after menu
closure before opening Settings or folder selection. It preserves the original
menu-content, layout, font and persistence assertions, native animation, normal
userEvent pointer checks, axe and timeouts. Three targets pass after the first
repair; Follow Scope then exposes the same early-visibility check on its folder
search, which receives the same readiness wait.

```sh
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/ai/shell/Shell.stories.ts -t 'Desktop|Community Tool Opt In|Local Conversations|Follow Scope'
```

All four exact targets pass in the final cold rerun with axe enabled. Required
CI owns the remaining full-catalog and package qualification.

The separately versioned Bases repair is isolated in PR #27 on existing main;
its publication precedes Notes consumer qualification. This feature PR remains
draft pending the compatible Notes framework releases.
