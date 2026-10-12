# Desktop AI readiness and harness model refresh

The review desktop had two separate startup defects. Its managed controller
could outlive the supervising desktop and retain the review SQLite writer.
Controller commit `cda1317c` closes its service on parent-channel loss and is
installed as an immutable local executable snapshot. A cold review desktop
start reached the new managed controller; quitting the desktop also removed
that child without resetting vault or controller data.

After that repair, the AI plugin's bootstrap still checked runtime support
without its owning workspace. The desktop requires an absolute vault path for
controller connections, so bootstrap must pass `host.workspace`, matching model
discovery and submitted requests.

The composer previously filtered a catalog captured during startup instead of
loading the newly selected harness. Native and ACP variants also shared model
provider identity. Catalog discovery now takes the runtime, maps native models
back to the canonical agent identity, clears old options while loading and
ignores stale completions or disposed views. A successful refresh preserves a
valid saved model or selects the returned default; failure retains that
harness's saved value and error. Fake selection cancels live discovery.

Mounted chat subscribes to plugin Settings changes. External harness changes
refresh its catalog, while composer-owned Settings notifications avoid duplicate
loads. Bootstrap restores durable binding defaults before discovering only the
selected catalog. Existing conversations retain their recorded binding.

## Focused regression evidence

- Controller parent disconnect: one failing regression before, one passing
  after; six managed-boundary tests, 193 controller Vitest tests and seven Deno
  installer tests pass. Staged Deno acceptance authenticates provider discovery,
  closes stdin, requires exit zero and reopens the same database.
- `pnpm --filter @lapis-notes/ai exec vitest run src/lib/providers/model-provider.test.ts`:
  native-vs-ACP discovery fails once before, passes afterward; Fake skips live
  discovery.
- `pnpm exec vitest run --project storybook stories/plugins/ai/AiChat.stories.ts -t 'Harness Model Refresh'`:
  composer and Settings scenarios each fail once before, both pass afterward.
  Each checks replacement options and checked default model through real menus.
- `pnpm --filter @lapis-notes/ai exec vitest run src/lib/chat/ai-view-bootstrap.test.ts -t 'owning vault'`:
  one failing regression before, one passing after.
- Final focused provider, catalog lifecycle and bootstrap files: 14 tests pass.
- Unrelated Settings notification regression: one failing test before, one
  passing after; merging the sparse notification preserves durable composer
  defaults while explicit agent changes restore that agent's saved model.

## Qualification

Final `pnpm spec:check`, root `pnpm check` (including audit and App ownership),
root `pnpm test` and root `pnpm build` pass. Plugin tests total 784, including
376 AI tests. A cold four-shard `pnpm test:storybook` run passes all 177
interaction/accessibility checks with no fatal lifecycle errors. The two exact
harness refresh browser regressions also pass in a fresh focused run.
`pnpm test:release` passes 95 release-tooling tests. Rendered Storybook Show Code
was checked for the new public `loadModels` example.

Static Storybook build, all active npm packs and publint pass. AI runtime
packaging passes bare-import boundaries and byte-for-byte payload reproduction;
payload verification passes. The fixture-signed `.lapis-plugin` also reproduces
byte for byte and verifies against its existing local Ed25519 key. Both npm
and runtime artifacts retain matching source/version coordinates. Archives are
rebuilt from the finalized source commit before consumer installation.

The plugin worktree inherits an earlier unnamed release-version preparation
change (`23927d53`). Advancing remote main would include that unrelated change;
this repair does not rewrite it or bypass Jujutsu's description guard.
The local review uses fixture signing keys, preserves plugin settings and
existing enablement, and refreshes only the installed AI archive. Community
remains parked. No npm publication, production signing, public release assets
or registry dispatch is performed by this repair.
