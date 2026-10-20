# Shared catalog state directory

The full source catalog exposes six AI History placement failures. The exact
`Middle Top Tabs` case fails 1/1 with a missing expected panel leaf and an
unhandled boot rejection. The shared fixture seeds `.obsidian/workspace.json`,
while the current API's default workspace loader reads `.lapis/workspace.json`.
This fixture is unchanged between the preceding source revision 13a60681 and
the dependency-range repair 059f986f, which changes no runtime or story code.

Use `.lapis` consistently for the fixture's app, types, workspace, bookmarks and
explicit configuration path. Preserve all panel-count, layout, persistence and
accessibility assertions and timeouts. The full suite was stopped after its
first failing family to reproduce the exact boundary. No native or user vault
data is involved. LP-SPEC-006 and the existing package behavior remain unchanged.

Original logs: `.local/desktop-current-core-storybook.log` and
`.local/desktop-current-core-ai-history-exact.log`. Exact after and complete
source catalog qualification are recorded below.

- Exact `Middle Top Tabs`: 1 failure plus an unhandled boot rejection becomes
  1 pass with no unhandled rejection.
- Full AI History family: 6/6 interaction/accessibility cases pass in a fresh
  Vitest browser process; `.local/desktop-current-core-ai-history-family.log`.
- Wider `pnpm test:storybook` first shard: 47 pass, 16 fail across 13 files.
  Failures are Bases Registry (4), Markdown ReadingSurface (4), Sync History
  (6), and Sync Shell (2). The remaining shards are unqualified.
  `.local/desktop-current-core-storybook-after.log` retains the failed run.
- The user explicitly accepted deferring those 16 wider catalog failures to
  finish Desktop review. No assertion, timeout, axe rule or baseline was relaxed.
- A fresh root `pnpm check` stops at audit: two additional moderate Vite
  development-tool paths under GHSA-698v-4r3x-3vcv, alongside the existing two
  ignored advisories. The user explicitly accepted deferring the tooling
  advisories too. No new ignore was added; the aggregate check is not green.
  `.local/desktop-current-core-check-final.log` records this result.

The remaining aggregate lanes were run separately after the audit stopped:
package metadata/boundary checks, App ownership and native CSS audit pass;
all 13 package check tasks, all 13 unit-test tasks (793 tests) and all 12
build/publint tasks pass. Reused Turbo results remain identified in their logs.
This does not convert the audit failure or deferred interaction lane into a pass.

`pnpm build-storybook` passes against the same final source; existing bundle-size,
Harper browser externalization and mixed-import warnings remain. The static
catalog build does not qualify the deferred interaction failures or visual review.
