# Signed plugin editor runtime qualification

Community remains parked. This slice changes the active plugin release bundler,
peer declarations and signed runtime metadata; no Community application source,
editor, timeline, browser scenario or release coordinate is changed.

## Reproduction and repair

The real Web installed-Bases scenario initially failed during `EditorState.create`
with the multiple-CodeMirror-instance error. The producer regression
`node --test --test-name-pattern='CodeMirror extension identity' scripts/build-plugin-release.test.mjs`
reproduced exactly that error: one failure before, one pass after. Its emitted ESM
now accepts a host-owned StateField and exports the same EditorState identity.

The explicit release allowlist admits seven CodeMirror editor modules plus
Lezer common, highlight and LR. Grammar packages stay bundled. Scanning all 12
payloads identifies editor host imports in AI, Bases, Bookmarks, Graph, Markdown,
Search, Source Editor and Word Count, including their transitive dependencies.
Each affected manifest declares the actual imports and each package declares
portable npm peers. The builder rejects unapproved contracts and missing peers.
Unrelated lockfile bytes and the existing dependency resolution graph are retained.

Notes' shared renderer helper provides the corresponding Web and desktop import
maps. Their focused tests pass nine scenarios. The API's synthetic
release-runtime validation covers all 36 shared imports and rejects unavailable
renderer versions while retaining its private-import rejection scenarios.

The installed Bases component then reproduced a separate Svelte renderer graph:
`Cannot read properties of null (reading 'nodes')` when its component invoked the
host API Icon. The archive producer now externalizes 16 explicitly approved
Svelte modules through the versioned `svelte/renderer/5.56.10` contract. Both
hosts share that exact renderer graph, and the API catalogue generator rejects
compiler/peer drift. A separate host/plugin browser build reproduces the null
nodes before the repair and passes after it. Original private Svelte specifiers
remain rejected.

The next real install exposed TanStack's unresolved `process.env.NODE_ENV` in
the browser. The producer supplies its production constant at build time; a
regression loads the actual dependency in a browser without a process global.
No process shim is installed.

Finally, a first-page install completed before the new service worker controlled
the page. The Web asset server now mirrors verified bytes and waits for control
before returning an executable URL. Its exact delayed-controller target changes
from one failure to one pass, and four asset-server tests verify readiness,
bounded failure and listener/timer cleanup. The cold installed-Bases scenario
now passes without changing query, frontmatter-edit or restart assertions.

## Worker transport and readiness

Spellcheck warmup now invalidates matching open-document diagnostics when Harper
becomes ready, and its regression proves listener disposal. The Notes editor
refreshes through the public API manager without a text edit; cold installed
Spellcheck acceptance verifies the same document and Problems row.

The first installed Markdown Lint probe exposed the old released
Language Service 0.1.0 inline worker. The published npm 0.1.1 artifact already
contains the owning package's stable emitted module-worker URL. The producer
now requires `^0.1.1` in its portable root dependency and Markdown Lint peer,
with the official npm integrity in the lockfile. The packed-worker regression
changes from one failure on 0.1.0 to one pass on published 0.1.1. Its build-entry
helper extraction preserves the existing library options; no bundler behavior
was changed for this repair.

The actual Web install then reproduced Chromium's
`coep-frame-resource-needs-coep-header`: cached verified assets lacked the
host's worker isolation headers. The Notes-owned Web asset server now carries
COEP `require-corp` and CORP `same-origin`. A cached-response regression and
cold installed Markdown Lint browser regression each change from one failure
to one pass. The latter proves worker startup and a real MD018 Problems row.
No timeout, diagnostic assertion or provider behavior was weakened.

## Evidence and remaining gates

- All 12 active packages: 36 build/check/test tasks pass, with 774 unit tests.
- Root Plugins check: all 13 tasks pass, with ownership and metadata audits.
- Release tooling: all 102 tests pass. The published-worker dependency refresh
  additionally passes Markdown Lint's three complete build/check/test tasks.
- Audit: exit zero under the existing recorded advisory policy.
- Specifications: all configured lanes and explicit App ownership pass.
- Latest cold Plugins Storybook: all 175 interaction/accessibility scenarios pass
  across four shards (49, 60, 37, 29), without unexplained errors. Static
  Storybook also builds successfully.
- Exactly 12 npm packs and reproduced rootless payloads were verified against
  exploratory source snapshot `0b506bb2c004053cedb1952e8fa9a85a3858fea3`.
  The fixture's actual Notes client verifies its index, 12 details, signatures,
  hashes and exact archive file lists. Final source rebinding remains required.
- Community is absent from the fixture index, and private-key requests return 404. No key material enters tracked or publicly served paths.
- Notes package qualification: 30 build/check/test tasks and all 18 root check
  tasks pass. Its full Storybook passes 212 interaction/accessibility scenarios.
- Cold Web acceptance: all eight scenarios pass, including installed Bases,
  Spellcheck, Markdown Lint, OPFS reload and two-tab ownership/Search.
- Web optional-plugin lifecycle matrix: all nine packages pass installation,
  defining behavior, disable, re-enable, persisted reload, uninstall and another
  reload. The three bundled Plugins packages pass defining behavior and both
  disabled and enabled persistence across reload. File Explorer is Notes-owned.
- Fresh server-image acceptance and the canonical cold packaged desktop smoke
  each pass. Desktop's 202 package tests pass with one existing skip.

The broader native installed-plugin matrix remains unqualified. The isolated
CEF development runner reproduced a Deno HMR import-map failure for
`@lapismd/ai-controller/managed`. A non-HMR build passed the import-map boundary
but its development renderer did not reach workspace readiness. These are
separate host-runner qualification issues; no plugin failure or native matrix
pass is inferred. The canonical packaged WebKit lane above remains passing.

Final unpublished plugin versions, released framework/schema prerequisites,
portable registry-only acceptance and production rollout remain open.
Exploratory fixture signatures do not authorize publication. Community
application work and Nostr publication remain deferred.
