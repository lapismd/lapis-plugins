# Static registry release readiness

Community remains parked as an application and plugin. Its editor, timeline,
tests and release workflow are outside this release. The shared registry schema
library is still a prerequisite. Nostr and relay acceptance remain deferred.

## Verified source

The qualified Plugins source is signed commit
`be4966c4c8d41eaa1810b30b8177f514d9b0cd39`, pushed to `main`.
The Notes host source is commit
`4f324ff4` in the static-registry workspace. Its inherited Deno lockfile edit is
preserved outside the commit.

All 12 active plugin npm packs and reproducible archives were rebuilt. The local
fixture is rebound to the signed Plugins commit. The real Notes registry client
verifies its signed catalog, all 12 details and every archive signature, hash
and exact file list. Community is absent.

Cold Web acceptance passes eight scenarios. All nine optional Plugins packages
pass install, defining behavior, disable, re-enable, persisted reload, uninstall
and another reload. Source Editor, Markdown and Search pass defining behavior
and both disabled and enabled persistence across reload. File Explorer remains
the fourth, Notes-owned default. Full source qualification and the separate
native matrix limitation are recorded in
`2026-10-11-editor-runtime-host-sharing.md` and the Notes host record.

The local registry review site remains at `http://127.0.0.1:4323/`. These fixture
signatures and versions are review data, not a production publication candidate.

## Remaining release work

- Qualify the broader native installed-plugin matrix. Canonical packaged desktop
  smoke passes; the separate CEF development attempt did not reach a usable host.
- Prepare unpublished framework versions for the new API/renderer contract and
  the changed UI, Workspace and File Explorer peers. Publish the unchanged
  shared registry schema prerequisite when approved. Published language-service
  0.1.1 already provides the stable emitted worker and is now the minimum range.
- Set plugin dependency floors for the new API contract, including diagnostics
  invalidation, after the prerequisite version is established. Refresh portable
  registry-only lockfiles and rerun their frozen-install acceptance.
- Apply the queued package-scoped version changes and check every candidate
  against npm. Current Bases, Bookmarks, Graph, History, Markdown Lint, Search,
  Source Editor and Word Count versions already exist publicly and cannot be
  overwritten. Slides has no npm release yet; AI, Markdown and Spellcheck have
  unpublished current versions but still need consistent release-intent review.
- Rebuild final packs, archives and site metadata from those committed release
  versions. Complete production signing/configuration checks, then obtain the
  user's explicit approval for publication and registry deployment.

No npm package, plugin GitHub release asset or production registry was published
by this qualification. Source push remains distinct from the guarded release
workflow. Visual baselines remain unchanged.
