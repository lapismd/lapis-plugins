# Preview lifecycle repair, Slider leak patch and API candidate refresh

Phase 2 verification of the merged native-search stack on main reproduced the
previously accepted 13 preview-lifecycle catalog failures (Markdown Backlinks
one placement, Markdown Outgoing Links six, Transcript Reading six) and the
single native Search drain-fence unit failure. All were environment- or
dependency-owned; no first-party behavior assertion was weakened and no shim,
source alias or private lock path was introduced.

## Documented temporary validation setup

The installed graph had drifted from main's declared state: `node_modules`
still held unpatched Bits UI 2.20.2 from the pre-draft lock, and the local
`@lapis-notes/api` candidate archive (`2eb4727521e5684df37489ea35db3fa11887871c69e424fe709cf2e7797e2fbf`,
built 2026-10-24) predated both required Notes contracts. The candidate was
rebuilt from current Notes main through the owning repository's ordinary
package build and repacked to the same documented path; its SHA-256 is
`daf6da88331c2a8686d4ddb1c9bb4f997f3d152d10f563d3ed6fad8837c931c1`. The prior
archive is preserved beside it as `lapis-notes-api-0.1.4.tgz.bak-2eb47275-20261027`.
The rebuild contains `EmbedRegistry.renderMarkdownEmbed` (Notes `fa73a08e`) and
the `Plugin.disable` native drain `MetadataCache.disableNativeContributions`
(Notes `56df650d`). Neither contract exists in any published `@lapis-notes/api`
(latest release 0.1.4, published 2026-10-14); the committed lockfile stays
registry-portable, the local install uses the tracked `.pnpmfile.cjs` sibling
remaps, and the hook-rewritten lockfile was restored, never committed.

## Exact before/after counts

| Boundary                                                    | Before                                    | After             |
| ----------------------------------------------------------- | ----------------------------------------- | ----------------- |
| `packages/search` exact `native-search-manager.test.ts`     | 21 pass / 1 fail                          | 22 pass / 0 fail  |
| `packages/search` complete suite                            | 108 pass / 1 fail (109)                   | 109 pass / 0 fail |
| Markdown Backlinks placements                               | 6 pass / 1 fail                           | 7 pass / 0 fail   |
| Markdown Outgoing Links + Transcript Reading                | 7 pass / 6 fail                           | 13 pass / 0 fail  |
| Bases Views/Workflows/RegistryScreenshots                   | 10 pass / 4 fail                          | 14 pass / 0 fail  |
| Complete cold catalog (four shards, 61 executable families) | 285 pass / 13 fail (2026-10-26 inventory) | 313 pass / 0 fail |
| Release tooling `pnpm test:release`                         | 150 pass / 0 fail                         | 150 pass / 0 fail |
| Validation controllers `pnpm validation:check`              | 51 pass / 0 fail                          | 51 pass / 0 fail  |

The drain-fence unit failure required the App-owned `Plugin.disable` drain
that only the refreshed candidate provides; a SearchPlugin-side call would
double-drain after the API release and is rejected as a shim.

## Mechanism 1: stale environment versus the declared lock

The Backlinks and Outgoing Links families failed through unpatched Bits UI
2.20.2 Link Preview: a deferred `afterSleep` selection probe read
`DOMContext.getDocument` after effect destruction. The committed draft lock
already pins Bits UI 2.19.5 with the qualified lifecycle patch that cancels
that probe; aligning the install with main repaired both families with no
source change.

## Mechanism 2: Slider document-listener leak (LP-SPEC-058)

Transcript Reading kept failing on the aligned graph with 26 unhandled
`derived_inert` diagnostics in one placement, all through
`bits-ui/dist/bits/slider/slider.svelte.js` `handlePointerDown` reading
`this.opts.disabled.current`. Svelte 5.56.10 `create_event` defers
pointer/touch/wheel `addEventListener` by one microtask (Chrome cloneNode
workaround) while the `on()` unsubscribe removes immediately, so a Slider
destroyed in the same tick it mounted — the shared placement demos re-home
views during workspace layout — leaks all four document listeners past effect
teardown. Every later pointerdown then read boxes of the destroyed effect and
the fatal diagnostic guard correctly failed the story.

The Svelte renderer ABI stays pinned at exactly 5.56.10 and upstream Bits UI
2.20.2 carries the same defect, so the declared workspace lifecycle patch
(`patches/bits-ui@2.19.5.patch`) was extended: `SliderBaseRootState` gains a
`destroyed` flag set through `onDestroyEffect`, and all six document pointer
handlers across both single and multi root states return early once destroyed.
The locked patch hash moved from
`bea104a59c6c54ddc78960341344344d787a51eb4d5bc64a32df6aa1e98e5beb` to
`4fbe511eb1c148b33aa474fa3bd7efd13d8401111b37dbbb7f9bd64c951ec894` through a
registry-only regeneration (`pnpm install --lockfile-only --ignore-pnpmfile`);
the diff is confined to the nine hash positions. The release-test guard now
inventories the destroyed-state guards (two occurrences each) and fails
against the pre-repair patch, which carries zero Slider guards.

## Mechanism 3: Bases select-trigger roles under the declared pin

Four Bases cases failed querying `role="combobox"` on Select triggers. That
role reflects Bits UI 2.20.2, against which the accessible-name prerequisite
was originally qualified; the declared pin 2.19.5 renders the same triggers as
`button` while preserving every explicit accessible name (LN-BASE-032/033).
Twelve role queries in the three Bases story files now select `button`; no
name, text-content, geometry or option-flow assertion changed, and genuine
autocomplete `input[role=combobox]` queries are untouched. The owning chapter
words both requirements as select controls so the contract no longer encodes
one provider version's role choice.

## Local check-lane environment completion

The portable lock regime removed the pre-draft lockfile's local paths, which
had been the only local channel for `@lapismd/jj-history`, the unpublished
optional peer of `@lapis-notes/history`. The canonical archives inventory
(`prerequisite-archives.json`) ships that prerequisite from
`.local/hosted-history/prerequisites/lapismd-jj-history-0.1.0.tgz`
(SHA-256 `d4ee8ecbb4daee19427a0be0489925d3f013ee2e5a12e73f8016d25e76a115e5`,
verified); the ignored local pnpm hook now mirrors that channel with an
existence-guarded peer promotion, repairing the History package check from 62
svelte-check errors to zero. The published manifest keeps the optional peer
and the committed lockfile stays registry-portable.

The same local hook maps `@lapismd/design-core` to its sibling source
checkout, which exports raw `.svelte` sources without generated type
declarations. Plain-`tsc` package checks (Markdown Lint, Source Editor,
Spellcheck, Word Count) therefore cannot resolve Design Core's Svelte type
exports locally; the canonical Docker lane resolves this through the packed
Design Core candidate in the archives inventory. Svelte-check-based packages
(Search, Bases, Markdown, Transcripts, History and nine others) typecheck
clean against the refreshed API candidate: 14 of 18 check tasks pass locally.

## Retained accepted findings and blockers

`pnpm audit` on the registry lockgraph retains two accepted advisories (Zod
high through `@lapis-notes/api`, elliptic low through the development polyfill
chain); `pnpm packages:check` retains the unsynchronized `packages/csv`
devDependency order (the store-only `aa71d8fc2b71` normalizes it); and
`pnpm check:no-tailwind` retains the four CSV styling findings under their
recorded owner and disposition. The registry matrix for draft `467f22313f6d`
remains blocked until a published `@lapis-notes/api` ships both
`EmbedRegistry.renderMarkdownEmbed` and the `Plugin.disable` native drain;
nothing outside main's lineage depends on the draft. The cold unsharded
catalog run crashed the browser page inside Search Registry Screenshots; the
family passes isolated (3/3) and inside the sharded lane. The `main` bookmark
still points at the store-only lane head `bd305e58f25a` and was deliberately
left untouched for orchestrator disposition.
