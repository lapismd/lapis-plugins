# Shared repository History

The public `@lapis-notes/history/repository` entrypoint provides the existing
Desktop `RepositoryPlugin`, `bindRepository`, service types and writer guard
bindings for both desktop and hosted Notes. Public `repository/controllers/*`
entrypoints carry host-independent controllers and contracts;
`repository/components/*.svelte` carries production presentation. Shared column
and identifier chrome is available through `repository/styles/*.css` so host
review compositions use the same package-owned styles.

The host binds an explicit App and supplies its admitted reader, optional service
ports and close/drain policy before registering the plugin. Native paths,
credentials, authorization and saved-file coordination remain host-owned. Browser
teardown closes its reads without stopping server-owned automatic checkpoints.
The legacy `HistoryPlugin` and its `history` runtime ID remain compatible.

Repository clients also supply the optional `@lapismd/jj-history` peer. The
unpublished client uses a recorded ignored archive overlay during migration;
publication and final dependency-floor qualification are separate gates.
Provenance and brand-path licenses are retained in `dist/repository/NOTICE.md`
and the repository's `docs/repository-history-provenance.json`.

Hosts coordinating multiple Apps can use the public
`repository/controllers/transcript-writers` acquired-guard observer. Entry occurs
inside existing editor and transcript protection, and its disposer follows the
action. It permits observing already-held protection without reacquiring it;
it neither replaces that protection nor authorizes saved writes. Dispose the
App-owned observer during host teardown.

Selected native indexed History uses the public API `NativeHistoryIndex` port.
`nativeIndexedHistory` adapts start/status/query/context to the existing
Repository Search provider, retaining Desktop's response validators and immutable
saved identities. `HistoryIndexController` starts that owner once and polls its
cached progress; queries and capture notifications never schedule batches.
Closing the observer drains its accepted read and leaves native work running.
Repeated failures are reported once and recover through status observation.

The Repository plugin prefers an explicit `app.nativeHistoryIndex` port over
legacy injected indexed Search services. The host still binds its admitted
Repository reader and lifetime through `bindRepository`; a transport port alone
does not mount a screen or grant history navigation. Hosts retaining their own
Repository composition can consume the public adapter/controller directly.
During migration these contracts require the recorded Notes API candidate that
exports `native-history-index` and the optional App field. Source qualification,
host adoption, final dependency floors and publication remain separate gates.

Pure Node transport and controller code imports the public leaf entries:
`@lapis-notes/history/repository/controllers/history-index-controller` and
`@lapis-notes/history/repository/controllers/native-indexed-search`. The aggregate
`repository` entry also exports Svelte presentation and therefore uses the
normal application bundler. DTO aliases and validators remain available through
the documented public controller wildcard; no source alias is needed.
