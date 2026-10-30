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
- Release tooling: 95 passes; metadata and package-boundary checks cover 12
  active packages. Packing produces exactly 12 npm candidates.
- All 12 active packages build and pass their unit suites (772 tests). Four
  TypeScript-only packages use TypeScript's checker rather than invoking
  Svelte diagnostics on configurations without Svelte input.
- Notes build/check/test: 30 of 30 tasks pass. App-profile exclusion: 1 failure
  before the change, 1 pass afterward; its complete suite has 3 passes.
- Both specification checks pass, as do App-ownership and no-Tailwind audits.

## Remaining release gates

These are unresolved gates, not accepted nonblocking failures:

Plugins' test blockers are resolved in the separate
[qualification record](2026-10-11-plugin-test-unblock.md): all 13 check tasks,
772 unit tests, 95 release tests and 175 Storybook stories pass. The audit exits
zero with recorded unpatched CVE exceptions. The scoped Bits UI patch exception
was explicitly approved; font readiness retains fail-closed checks.

The remaining broader release gates are:

- Web Bases acceptance still assumes a bundled plugin. Replace that assumption
  with a real signed registry install and prove query, editing, and restart.
- Packaged desktop builds using the explicitly approved ignored Deno
  dependency-age override. Its acceptance retry reaches the instance endpoint
  but times out on workspace readiness; diagnose the host startup boundary.
- App installation and defining behavior remain unverified for the signed
  12-plugin fixture. Complete the Web and desktop installation matrix.
- Portable npm consumers still need the shared registry schema library and
  framework prerequisites to be published through the release approval gate.

Notes AI qualification is now complete: the cold target and all 212
interaction/accessibility stories pass. Community application, registry-editor,
timeline, and browser repair work is explicitly descoped by the user. Its
historical UI failures are not gates for the other plugins. Community must remain
absent from the registry, active tests, release selection, and the desktop default
profile. Retaining the shared registry schema dependency does not reactivate the
Community application or its feature qualification.

No production signing, publication, registry deployment, relay event, analytics
activation or visual-baseline update occurred. Verified repairs and qualification records are committed. The broader release
candidates remain unpublished while active-host qualification is unresolved.
