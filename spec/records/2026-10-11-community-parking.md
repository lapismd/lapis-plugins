# Community parking and static registry qualification

Community (`@lapis-notes/community`, runtime ID `community`) is parked for this
release. Its source and prior evidence remain retained. The shared
`@lapismd/lapis-community` registry schema library remains an active dependency.

The package's `private: true` flag excludes it from the active catalog. The
pnpm workspace, Storybook directory selection, metadata dispatch, npm packing
and both release workflows exclude it. Direct selection and stale release plans
containing its coordinates are rejected. Notes removes its constructor, styles
and dependency from the shared default profile. Re-enabling steps are in
[RELEASING.md](../../RELEASING.md#parked-community-plugin).

The cold local registry shows 12 entries, with Slides pending and Community
absent; `/plugins/community/` returns 404. Registry parking is committed as
`c5df963d`. The Lucide X filter-chip follow-up has keyboard and SVG-click
regressions, 17 passing browser tests, 77 passing script tests and clean Astro
diagnostics. The review server remains on port 4323.

## Qualification evidence

- Plugin selection regressions: 3 failures before parking, 3 passes afterward.
- Release tooling: 92 passes; metadata and package-boundary checks cover 12
  active packages. Packing produces exactly 12 npm candidates.
- All 12 active packages build and pass their unit suites (772 tests). Four
  TypeScript-only packages use TypeScript's checker rather than invoking
  Svelte diagnostics on configurations without Svelte input.
- Notes build/check/test: 30 of 30 tasks pass. App-profile exclusion: 1 failure
  before the change, 1 pass afterward; its complete suite has 3 passes.
- Both specification checks pass, as do App-ownership and no-Tailwind audits.

## Remaining release gates

These are unresolved gates, not accepted nonblocking failures:

- Plugins' audit retains 27 findings: 1 critical, 11 high, 11 moderate, 4 low.
- AI and Graph checks resolve two API peer contexts and report nominal type
  incompatibilities. Final checks pass 11 of 13 tasks after correcting the
  TypeScript-only check commands; those two package checks remain failed.
- Plugins Storybook shard 1 has 49 passing stories and 18 fatal
  `derived_inert` errors from Bits UI Link Preview. Later shards did not run.
- Notes Storybook has 211 passes and 1 failure: AI Shell / Local Conversations
  clicks a temporarily noninteractive conversation-options trigger. A fresh
  focused run reproduces that failure.
- Web acceptance has 5 passes and 1 timeout in the retained bundled-Bases
  scenario. The successful vault and reload scenarios verify the four-plugin
  profile.
- Packaged desktop acceptance cannot run yet. Building the local ad-hoc-signed
  app stops at Deno's 24-hour dependency-age policy for the newly published
  AI Controller package. The policy was not weakened, and the inherited
  `deno.lock` was preserved.
- The shared Community library's previously reproduced 38 baseline browser
  failures remain separate from parking the Community plugin.

No production signing, publication, registry deployment, relay event, analytics
activation or visual-baseline update occurred. The broader Plugins and Notes
candidates remain uncommitted while their required qualification is unresolved.
