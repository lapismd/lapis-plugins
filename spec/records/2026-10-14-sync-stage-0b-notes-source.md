# Sync stage 0B: Notes source qualification

Status: source PR #28 merged and all required CI passed, updated 15 October 2026. Version PR #30 is also merged. The separate
[Notes release checkpoint](2026-10-15-sync-stage-0b-notes-release.md) records
completed API 0.1.4 publication and registry verification; consumer refresh and stage 0C landing
remain subsequent work. Earlier candidate findings below are historical.

## Source checkpoint history

Lapis Notes was fetched from both remotes and reconciled onto current main
`9fed4f1577a6beb27168d0b83b9ea42408d4f1b1`, including Homebrew PR #26. A final
fetch confirms the same main. Work uses the default Notes workspace; no
replacement implementation workspace was created.

The preserved two-commit audit fix and 15 qualified host/API commits form
[draft PR #28](https://github.com/lapismd/lapis-notes/pull/28). The source candidate
is `8e581ad204627812fe5ca8a997a94cbb452e1abc`; its codec follow-up makes the
current head `fd707b386d52ecdb6f53c33816d94c3610085c4d`.

Runtime implementation is reused. Reconciliation retains current registry and
Homebrew behavior, merges both release-test registrations, and preserves
published Homebrew requirement IDs. Nine unpublished Sync requirements become
LN-DENO-086 through LN-DENO-094. The initial generated metadata edit's 34 API
version values survive normal generation. Original references, unqualified
navigation, other workspaces and ordinary development data remain preserved.

## Evidence and remaining gates

- Exact API family: 24 existing cases before, 69 after; the new session file is
  initially absent. Desktop/security conflict family: 17 pass.
- Root check/test/build pass 18/18/10 tasks. This includes 964 API, 98 native,
  296 desktop with its existing integration skip, 28 server, 55 Web and 25
  Workspace cases. Svelte checks report zero errors and warnings.
- All 18 editor-demo and all 249 complete catalog interaction/accessibility
  cases pass. Static Storybook renders all 172 specification chapters.
- Specification validates 1,439 requirements; ownership, release intent,
  package policy and release-tooling checks pass. Normal audit retains only the
  user-approved temporary QMD exception; production audit has zero findings.
- [Initial source CI](https://github.com/lapismd/lapis-notes/actions/runs/38640300007)
  passes ten required jobs, including Web and both packaged desktop lanes.
  Unit and its aggregate fail because the 20 MiB native JSON bridge exceeds
  its unchanged five-second budget on Node 24.15.0. Linux x64 desktop-release
  acceptance fails the same target.
- A focused Node codec optimization preserves canonical/native/portable frames
  and gives decoded byte arrays isolated backing storage. The unchanged exact
  Node 24 target improves from 2.47 seconds to 512 ms locally. All 36 codec/
  bridge and 296 desktop cases pass on Node 24; frozen Deno, desktop check/build
  and root check/test/build pass again. No timeout, size, assertion or baseline
  is weakened.
- Final source [Lapis CI](https://github.com/lapismd/lapis-notes/actions/runs/38650480704)
  passes all required jobs. Final
  [desktop CI](https://github.com/lapismd/lapis-notes/actions/runs/38650480732)
  passes all three native targets, confirming the codec repair and clearing
  the earlier Linux ARM integration failure without a controller workaround.
- The complete Catalog still logs caught line-range diagnostics while all
  249 interaction/accessibility cases pass. The user explicitly directed moving
  on because no CI test fails. The unmerged diagnostic prototype is retained
  at `local/parked-catalog-diagnostics-20261015` (change `wvkppryo`, commit
  `2b97e925`) and is excluded from the released candidate. Diagnostic-free
  operation is not claimed.

Source-stage package planning selected no tarballs because its package versions
were already on npm; that was not packed-artifact acceptance. The nine API patch
Changesets are now consumed by version PR #30, changing only API 0.1.3 to 0.1.4.
Actual artifact, provenance and registry-only consumer evidence belongs to the
separate release record. No Sync plugin or registry update is authorized here.

## Review and next piece

Source [PR #28](https://github.com/lapismd/lapis-notes/pull/28) merged at
`967a92fb123c9cb66fca976c689fafdd00aa65b6`. Version
[PR #30](https://github.com/lapismd/lapis-notes/pull/30) passed all 12 required
checks and merged at `ecb193a9493d5749f063ffe430d8eed30d153bf4`. The default
Notes workspace is clean on that updated main. Original temporary workspaces,
unqualified navigation and development data remain preserved.

The separate Notes publication checkpoint is now complete. Stop for review
before stage 0C; live Sync activation and temporary-workspace cleanup remain
later work. The historical Notes source record retains the initial CI findings;
the current disposition and completed publication gate are recorded here and
in the release record.
