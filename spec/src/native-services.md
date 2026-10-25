# Native first-party plugin services

The private `crates/lapis-plugin-services` crate owns transport-independent
first-party algorithms for the shared Rust migration. It has no Tauri, HTTP,
database, application scheduler or renderer dependency. Published npm plugin
contracts and the standalone browser implementation remain unchanged.

## Requirements

| ID            | Requirement                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-NATIVE-001 | The native Markdown extractor MUST retain the existing renderer extractor's frontmatter, heading, link, tag, heading-context and UTF-16 position results. Shared fixtures MUST qualify both implementations, including serialized YAML 1.2 scalar, Unicode, alias and invalid-input outcomes. |
| LN-NATIVE-002 | Native Markdown cache identity MUST use the retained MD5 of the UTF-8 source bytes. Application policy MUST own index publication and unattended lifetime.                                                                                                                                    |
| LN-NATIVE-003 | The native Markdown parser version MUST change when metadata interpretation changes so unchanged source bytes cannot reuse stale derived metadata.                                                                                                                                            |

This intake covers the existing lightweight metadata extractor. Task, custom
projection and extension processors remain separate migration work. It neither
loads JavaScript into the Rust service nor qualifies either host's owner cutover.

## Catalog validation integration

Native hosts consume the same Bases presentation package as the browser
catalog. Purpose names for its filter, grouping, sort, summary and settings
controls remain plugin-owned presentation; runtime bundles and host intake must
qualify the same source revision as the npm package. The native service interface
and metadata outputs retain their existing contracts.

Docker catalog qualification supplies checksum-verified prerequisites before
resolving its temporary install graph. This changes no native Markdown parser
contract or output; native service acceptance and registry-only release
qualification remain separate. The native migration source stays pinned by
Notes rather than being inferred from a mutable checkout.

CSV externalizes `@lapis-notes/api/editor/core` and `@codemirror/search` as
host peers. That metadata synchronization changes no native Markdown parser
behavior. Its native migration contract remains the independently owned pure
service boundary, with source and renderer qualification recorded separately.
Including `Plugins/CSV/Registry Screenshots` in registry media selection
changes no native Markdown parser behavior. Including
`Plugins/Canvas/Registry Screenshots` in registry media selection,
`Plugins/Canvas/Features` as application stories, and bundling `@xyflow/svelte`
inside the canvas package, changes no native Markdown parser behavior. Leasing ordinary Markdown image
URLs through the owning vault uses the public Mira asset hooks and changes no
native Markdown parser behavior. The shared panel fixture's complete
`Assets/map.png` and its fetchable resource URL change no native Markdown
parser behavior. Merging caller configuration into the shared panel demo seed
changes no native Markdown parser behavior. Bundling the vendored DOCX editor changes no
native Markdown parser behavior. Polyfilling Node builtins for the DOCX PDF
export worker changes no native Markdown parser behavior.

Archive-backed source qualification audits the actual installed dependency
graph under LP-SPEC-057. Source manifests/lockfiles remain portable, and native
service ownership and publication gates retain their existing contracts.

## Release-test isolation

The active/private manifest inventory used by release-tooling tests does not
select a native plugin algorithm or change its recorded prerequisite revision.
Temporary Jujutsu snapshot fixtures retain their own exact base and source
ancestry without importing an outer application-validation revision. Native
Markdown/Search contracts, public archives and application lifetime remain under
their existing independent qualification gates.

Restoring registry-only npm dependency resolution and existing lifecycle-patch
hashes does not select another native Markdown/Search implementation. Native
crate prerequisites and application/consumer qualification remain separately
pinned while the normal source graph is repaired and validated.

## Frontmatter source parity

The shared retained corpus compares complete metadata through the existing JSON
persistence boundary. Literal U+0085, U+2028 and U+2029 MUST remain source text;
a reader MUST NOT substitute code points before parsing. YAML core scalar
types, alias values, duplicate rejection and single-document admission retain
the TypeScript extractor. Nonfinite scalar values use the retained serialized
JSON null representation. Public extraction and source UTF-8 hashing stay
independent of application scheduling and both host selections.

CSV registry screenshot application classification changes only the existing
catalog guard inventory. It does not alter native Markdown metadata or grant
a native/host adoption exception.
