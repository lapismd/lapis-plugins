# Sync CI repair checkpoint

15 October 2026. In progress; authentication implementation has not started.

## Review stack

- [Plugins #16](https://github.com/lapismd/lapis-plugins/pull/16) owns the shared
  CI repairs. [Plugins #17](https://github.com/lapismd/lapis-plugins/pull/17)
  retains the connection/vault UI and the next-slice plan, rebased onto #16.
- CI now installs the private Sync catalog from its separate frozen registry
  lockfile and audits it. Sync remains private and excluded from release
  selection and recursive workspace tasks.
- The static catalog exhausted Node's default 4 GiB heap after dependency
  resolution was repaired. A bounded 6144 MiB build succeeds locally and in
  both PRs' CI. Functional and accessibility assertions are unchanged.
- The first interaction shard now passes all 61 stories, including Sync History
  and File History. The original five suite-import failures are resolved.

## Required UI prerequisite

The compatible host/editor lockfile deduplication removes the five Graph/AI
type errors, but exposed undeclared runtime dependencies in published UI 0.1.2.
[Notes #32](https://github.com/lapismd/lapis-notes/pull/32) merged with every
required check passing and corrects all retained UI runtime imports.

[Notes #35](https://github.com/lapismd/lapis-notes/pull/35) merged with every
required check passing and released UI 0.1.3. It supersedes generated version
PR #33. Its private codec test uses exact byte comparison with strict
prototype, length and own-key shape checks, retaining native/fallback frames
and the five-second deadline. The pinned Node 24.15.0 target passes 16 tests in
97 ms; the desktop package passes 296 tests with its existing single skip.
Codec implementation is unchanged.

[Release 38729796842](https://github.com/lapismd/lapis-notes/actions/runs/38729796842)
completed all 16 jobs, including npm publication, registry verification and
GitHub release creation. The initial registry verification observed npm
propagation delay; only that failed job was retried. Plugins now consumes the
released registry package in its shared and isolated private development graphs.

## Consumer acceptance

The shared host and isolated private Sync manifests consume UI `^0.1.3` from
npm. `pnpm dedupe --ignore-pnpmfile` reconciles compatible registry API/editor
contexts; public runtime peer ranges remain unchanged. The only added package
versions are UI 0.1.3 and its declared Lucide runtime dependency. Other changes
remove redundant contexts and select compatible versions already in the graph.

- `pnpm --dir packages/graph check:svelte`: 2 errors before, 0 after.
- `pnpm --dir packages/ai check:svelte`: 3 errors before, 0 after.
- Bases `Editable Cells`: 1 highlighting failure before, 0 after in a cold
  `vitest --project storybook` process, with the original assertion retained.
- Connection-stack isolated Sync: audit, package check, all 198 unit tests, build and publint pass.
- Workflow/release regressions: 112 tests pass. Canonical specification checks
  pass (6 validators, 27 chapters, 598 requirements).

- Shared package check, unit tasks and build pass. The cold static Storybook
  build, npm packing and plugin archive build/verification pass.
- A complete catalog run passed 129 stories in its first two shards and then
  exposed History Mobile's stale `/Open tabs/` selector. The published dock
  advertises `Open 5 tabs`. Exact cold reproduction found the same defect in
  AI, Bases and History: 3 failing mobile stories before repair, 0 after.
  Each repaired play opens the actual tab chooser and uses Done to return,
  retaining its plugin, panel and collapsed-sidebar assertions. No product
  component, accessibility label or visual baseline changes.

The remaining complete catalog run and exact-head PR CI are pending. This
record does not yet declare the PRs green or merged.

The next feature is **1B. Remote sign-in and session lifecycle**, before endpoint
enrollment, as recorded in the incremental delivery plan. Stop for review after
the CI repair; do not append authentication implementation to this work.
