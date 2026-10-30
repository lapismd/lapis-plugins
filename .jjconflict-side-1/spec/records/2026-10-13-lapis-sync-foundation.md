# Lapis Sync foundation milestone

Implementation started on 13 October 2026 in isolated Jujutsu workspaces:

- `lapis-plugins-sync-implementation`: protocol foundation and owning specifications.
- `lapis-notes-sync-implementation`: reserved host/server workspace; no host changes yet.
- `lapis-plugin-nostr-sync-license`: user-requested source licensing correction.

## Delivered

The private `@lapis-notes/lapis-plugin-sync` package exposes a bundled,
headless `./engine` subpath. It retains the current Nostr signed event fields,
version constants, encrypted revision/HEAD writers, ancestry/archive references,
device attestations and owner attestation envelopes. New helpers implement the
agreed filters and replaceable ordering. Signatures are verified from fresh
fields rather than trusting verification caches on mutable input.

The source Apache-2.0 correction was committed as `665cf7f4` before extraction.
`NOTICE.md` records the transferred source, and builds include complete licenses
for bundled third-party dependencies. The package stays private and outside
recursive tasks, installation, Storybook and release selection. Existing host
semver ranges and resolved dependencies remain unchanged, as requested.

## Evidence

- `pnpm test` in `packages/sync`: 58 tests passed across three files.
- `pnpm check`, `pnpm build`, `pnpm publint` in that package: passed.
- Test-source TypeScript checking: passed with the same package configuration.
- `pnpm spec:check`: validation, mdBook, spec-first and App ownership passed.
- `node --test scripts/parked-plugins.test.mjs`: four tests passed.
- Node and Deno imported the bundled engine and verified the frozen source
  event/envelope/filter fixtures without a UI or npm runtime dependency.
- Local npm pack includes declarations, bundled engine, Apache/attribution and
  third-party license texts; test fixtures and raw test keys are excluded.
- `pnpm audit --json`: exit 0, with existing recorded CVE exceptions unchanged.
- Existing lockfile importers and resolved entries were compared structurally
  against the parent revision and are unchanged; only Sync dependencies were added.

The complete release-tooling suite reports 100 passed and two failed after
adding the Sync parking regression. Both failures were reproduced in the
unchanged default checkout: packed Markdown language-service worker resolution
(`plugin-module-worker.test.mjs`, owned by plugin packaging/worker acceptance)
and missing API registry schema output (`static-release-candidate.test.mjs`,
owned by the API public registry contract and consumer artifact qualification).
The registry-metadata checker is blocked by that same missing API output.
These results do not qualify the broader release lane; no release or main push
is performed from this milestone.

A root registry-only install also remains blocked by existing `^0.1.1` host
ranges unavailable on npm. The user chose to retain those ranges. Focused
protocol qualification uses an isolated, ignored registry-dependency install
under `.release/sync-dependencies`, with the package manager pinned to the same
version as the owning workspace. Source Nostr Sync's additional dependency
audit reports pre-existing advisories; the licensing change altered no versions.

## Remaining implementation

This is the first protocol slice, not a working vault-sync installation.
The shared coordinator, encrypted local outbox and apply recovery still need
extraction. Next, implement Deno's durable event database and encrypted object
store, authenticated API/query/subscription operations, and enrolled server
participation. Host membership ingestion and epoch authority are not qualified
by transport-envelope fixtures. Retained UI and real desktop/Web/two-device
acceptance follow the saved delivery sequence. Visual baselines and public
publication remain behind their existing gates.
