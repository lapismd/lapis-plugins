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

Cold Web acceptance passes nine scenarios. All nine optional Plugins packages
pass install, defining behavior, disable, re-enable, persisted reload, uninstall
and another reload. Source Editor, Markdown and Search pass defining behavior
and both disabled and enabled persistence across reload. File Explorer remains
the fourth, Notes-owned default. Full source qualification and the separate
native matrix limitation are recorded in
`2026-10-11-editor-runtime-host-sharing.md` and the Notes host record.

The local registry review site remains at `http://127.0.0.1:4323/`. These fixture
signatures and versions are review data, not a production publication candidate.

## Native qualification

Native qualification is complete for all 12 active Plugins. The three bundled
plugins pass behavior and disabled/enabled reload persistence; all nine optional
plugins pass their individual lifecycle and a fresh combined install, behavior,
reload, uninstall and reload scenario. All native probes report zero page
errors. The freshly rebuilt packaged WebKit smoke also passes. Earlier failed
CEF and packaged attempts remain recorded diagnostics.

## Search checkpoint repair

Native acceptance exposed a matching Search checkpoint over an empty derived
index. Search now includes the metadata fingerprint filtered to its registered
document providers. Metadata parser/input changes invalidate it; unrelated
metadata inputs retain warm reuse. Both exact regressions pass, the Search
family passes 40 tests, and native Search disable/re-enable and reload pass.

Current source lanes pass: 36 package build/check/test tasks, 13 root check
tasks including audit, 102 release-tooling tests, 175 cold Storybook interaction
and accessibility scenarios, and the static Storybook build. All 12 npm packs
and runtime payloads were regenerated and verified. The real Notes client
verifies every locally signed detail and archive. The temporary API tarball
provides the new optional fingerprint predicate; portable publication requires
the API 0.1.1 prerequisite and an updated plugin API floor.

## Versioned candidates

Changesets prepares AI 0.1.4; Bases, Bookmarks, Graph, History and Search 0.1.3;
Markdown 0.1.5; Markdown Lint, Source Editor and Word Count 0.1.2; Spellcheck
0.1.3; and Slides initial 0.1.0. The shared package catalog raises API, UI,
Workspace and File Explorer floors to 0.1.1. All 17 selected plugin, framework
and schema coordinates return npm 404; no existing version will be overwritten.

Notes prepares four framework 0.1.1 tarballs with 30 passing package tasks and
18 passing root check tasks. The shared schema is isolated from pending
Community application changes: seven focused schema tests, all 56 registry tests,
strict schema types, build and publint pass. Its complete check/spec lanes still
report the same two parked application architecture failures reproduced on its
exact parent. Those failures are retained and require explicit release-scope
acceptance; this work does not repair or suppress them.

The versioned Plugin candidates pass all 36 package tasks, 13 root check
tasks, 102 release-tooling tests, 175 cold interaction/accessibility scenarios
and the static Storybook build. Their 12 npm packs and reproduced test-signed
archives pass the real Notes verifier. A generated registry preview contains
eleven version additions and one initial Slides entry. The refreshed 0.1.1
framework app passes all nine Web scenarios, the three native bundled
lifecycles, the combined nine-plugin native scenario and the rebuilt packaged
WebKit smoke. The release-version slice awaits registry-only lock refresh and
qualification after prerequisite publication.

Local npm authentication returns E401. Initial shared-schema and Slides npm
publication needs an authenticated bootstrap session; production publication
is not authorized by these local fixture signatures. The static workflow
remains manually disabled, both static activation variables are unset, and
Nostr remains false. The GitHub release environments currently have no reviewer
protection rules; activation remains subject to the explicit operator gate.

## Remaining release work

- Rebuild final packs, archives and site metadata from the committed candidate
  versions and complete production signing/configuration evidence.
- Obtain approval for the unpublished framework and shared schema prerequisites.
  Published language-service 0.1.1 already supplies the stable emitted worker.
- Once prerequisites exist on npm, refresh portable registry lockfiles and
  complete frozen-install Web and Deno consumer qualification.
- Obtain approval for plugin publication and the first static registry cutover,
  publish the verified artifacts, deploy the registry and prove production
  installation. Nostr publication remains deferred.

No npm package, plugin GitHub release asset or production registry was published
by this qualification. Source push remains distinct from the guarded release
workflow. Visual baselines remain unchanged.
