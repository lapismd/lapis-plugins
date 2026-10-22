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
