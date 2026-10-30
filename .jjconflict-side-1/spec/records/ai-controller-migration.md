# AI controller consumer migration

The AI plugin now connects to the shared controller SDK. The controller owns
turn submission, provider configuration, ordered activity, cancellation and
deferred context preparation. AppToolHost still authorizes App/Vault operations;
conversation notes and memory Markdown/database adapters remain application-owned.
The memory extraction preceded this execution slice. Context handoff and transcript
hashing now also use the shared package. Legacy exported runtime classes remain
for compatibility; the first-party runtime factory exclusively uses the controller.
Shared Storybook stays Fake by default. When URL and token are set, preview
registers the same thin controller connection bridge Notes uses so live stories
are not silently Fake.

## Development acceptance

The ignored `.release/controller/pnpmfile.cjs` and root `.pnpmfile.cjs` install
built sibling tarballs without changing registry-backed lockfile entries.
Registry publication and lockfile refresh remain a later approved release gate;
CI defers functional lanes until `@lapismd/ai-controller` and
`@lapismd/lapis-community` exist on the npm registry. Compatible local peer
versions are pinned only in that validation hook. No node_modules source is edited.

- AI: 364 tests across 74 files; type/Svelte checks, build, publint and npm pack pass.
- Repository: all 785 unit tests, 14 check tasks and 13 build tasks pass.
- Storybook: all 176 interaction/accessibility tests in 39 files pass in four
  serial shards. The static Storybook build passes.
- Signature/archive fixtures: 12 passed. App ownership and specification checks pass.

The initial concurrent Storybook run exposed menu teardown timing and browser
resource failures; it was interrupted and is not counted as passing. A serial
run then recorded 137 passing tests, one menu failure and a browser disconnect.
The affected story now waits for pointer ownership after closing its model menu.
The exact story passes, and all four fresh-browser shards subsequently pass.
No assertions, accessibility checks, story selections or visual baselines were
removed or relaxed. Full fresh-browser shards are the canonical test command.

Lapis Community owns the public Turso Vite helper used by the shared Storybook;
this consumer uses its public build export for both client and worker bundles.
No production package signing, publication, registry dispatch or deployment ran.
