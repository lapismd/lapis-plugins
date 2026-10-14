# Sync stage 0B: Notes source qualification

Status: source PR prepared; Notes release incomplete, 14 October 2026.
Stop for review at this bounded checkpoint. Versioning, publication, consumer
refresh and stage 0C landing remain pending.

## Working now

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
- Fresh [Lapis CI](https://github.com/lapismd/lapis-notes/actions/runs/38642790140)
  and [desktop CI](https://github.com/lapismd/lapis-notes/actions/runs/38642790099)
  are running at the new head. Hosted timeout repair is not yet confirmed.
- The initial Linux ARM native lane separately fails its compiled AI-controller
  integration: no completed event within the existing 20-second poll. Root
  cause remains open; no controller workaround was added.
- The aggregate Catalog shard logs five caught line-range errors on the
  candidate while all 65 cases pass. Its exact six-story Catalog family is
  clean; refreshed main plus the audit commits runs the same 65-case shard
  without those diagnostics. This candidate-dependent lifecycle issue needs
  focused diagnosis before publication.

Current public framework versions are already on npm. Source-stage package
planning therefore selects no tarballs; this is not packed-artifact acceptance.
Nine API patch Changesets await the version PR. Actual new artifact, provenance
and registry-only consumer checks follow versioning. No Notes package, Sync
plugin or registry update was published in this checkpoint.

## Review and next piece

Review [PR #28](https://github.com/lapismd/lapis-notes/pull/28) and the owning
`lapis-notes/spec/records/2026-10-14-sync-host-release.md` record. The default
Notes checkout is clean on the source branch; remote main remains its ancestor.
The PR stays draft while CI and lifecycle findings are unresolved.

Next, verify hosted codec results and diagnose the aggregate Catalog lifecycle
issue as a focused piece. Resolve the Linux ARM controller gate separately if
it persists. After the source PR qualifies, merge it under the user's existing
authorization, then take the version/publication checkpoint. Stage 0B and 0C
remain incomplete; no live Sync activation or temporary-workspace cleanup occurs.
