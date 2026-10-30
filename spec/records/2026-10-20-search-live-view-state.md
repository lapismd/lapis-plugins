# Search live view state

Enclosing Jujutsu change; LN-SRCH-006/052.

Desktop E-REPO-052 reproduces a real cold-reopen defect: a history query finds
an exact saved version but workspace.json retains the empty query used by
Open Search. SearchView inherits static initial state and never reads the live
panel query/scope. No consumer override is permitted. The source fix must
return the current component model during synchronous layout reads and request
a layout save after actual query/scope edits. Existing unknown state fields,
programmatic query/scope changes and unmounted snapshots must remain intact.

Original Desktop M14.6 remains Partial until its exact native target passes
against a verified public archive. Release/publication and visual baselines
remain deferred. Source regression/check/package/consumer commands follow.

The source regression initially fails 3/5 cases: live state is stale, no layout
save callback exists, and unload drops the last typed query/scope. The two
programmatic/pre-mount cases pass. After the source fix all five pass, and the
complete Search package lane passes 49 tests across 11 files. SearchView now
reads the live model synchronously, preserves unknown saved fields, requests
layout saves on edits and retains the final unmounted snapshot. SearchPanel
initializes the query before mount and cannot overwrite a later command with
its original initial value.

- `pnpm --filter @lapis-notes/search exec vitest run src/lib/search-view.test.ts`:
  before 3 fail/2 pass; after 5/5 pass (`search-live-view-{before,after}.log`).
- `pnpm --filter @lapis-notes/search test`: 49/49 pass (`search-live-view-units.log`).
- `pnpm --filter @lapis-notes/search check`: zero errors/warnings
  (`search-live-view-check.log`).
- `pnpm --filter @lapis-notes/search build`: public dist and publint pass, also
  after final formatting (`search-live-view-{build,final-build}.log`).
- `pnpm audit`: exit 0 with the same two already ignored advisories; no ignores
  added (`search-live-view-audit.log`).
- `node --test scripts/plugin-release.test.mjs`: 12/12 pass, including exact
  deterministic payloads and test-key signature verification. No production
  credential or signing operation (`search-live-view-release-fixtures.log`).
- `pnpm spec:check`: all three source specification/book lanes and explicit
  App ownership pass (`search-live-view-spec.log`).

The first relevant two-file catalog run passes eight existing cases but the new
state test reads `.lapis/workspace.json`. The governed placement fixture owns
`search-placement.json`, selected through its public layout loader. Reading
that same fixture file preserves the exact persisted-query assertion; the new
case then passes in a cold exact run (`search-live-view-catalog-exact.log`).
It checks the current query/scope, actual persisted layout bytes and a fresh
view remount. Failed run: `search-live-view-catalog.log`.

The first npm archive packs successfully. The subsequent actual plugin payload
preparation refuses the uncommitted source tree as designed
(`search-live-view-release-build.log`). Do not bypass this provenance guard:
freeze the verified source commit, then build/reproduce/verify the local
payload and record the final public archive and Desktop receipt separately.
This is local migration validation; publication and production signing remain
deferred. Logs above are under `.local/`.

The final fresh two-file Search catalog run passes all 9 interaction/axe cases,
including all six placements, both federation cases and the new live-state
case (`search-live-view-catalog-final.log`). Final source validation passes
6 validators, 27 chapters and 604 requirements
(`search-live-view-final-spec.log`). Source formatting uses Desktop's installed
Prettier/Svelte formatter only; manifests, lockfiles and package internals are
unchanged. This source slice is verified. Final archive provenance and the
original cold Desktop consumer still require the clean committed source.
