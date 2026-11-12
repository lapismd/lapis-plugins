# Native first-party plugin services

The Design Core 0.12.4 dependency intake keeps History settings components and
their owning App registration on one compatible shared package identity.
Public settings, runtime ownership and native service contracts remain intact.

Canvas keyboard navigation is scoped to its owning rendered board. Camera state is presentation-only; its help dialog shares the existing App input fence and creates no native service or durable writer (LN-CANVAS-048).

Connector endpoint editors and empty-space connection drops use the existing protected parent board writer (LN-CANVAS-046/047). Navigation does not create a writer; reconnection does not bypass App guards.

Canvas background dialogs use the existing parent editing guard. Image reads and URL disposal belong to each mounted surface; background changes introduce no writer or native service (LN-CANVAS-044/045).

Canvas layout flushes existing virtual editors through the parent board controller before one document mutation (LN-CANVAS-042). App input protection and native producer admission remain unchanged; layout introduces no separate writer or service.

Read-only Canvas source listeners and nested rendering remain renderer-owned. Virtual text links delegate public vault reads while their edits retain the existing parent producer; native admission and installed-release qualification remain unchanged (LN-CANVAS-037).

Canvas creation dialogs share the App producer input fence, and clipboard snapshots do not acknowledge pending native/virtual text (LN-CANVAS-032/034). Authoring/history is renderer-owned; native service and installed release identities remain unchanged.

Canvas virtual editors now participate in synchronous producer holds, protected native saved-text refresh and reviewed recovery (LN-CANVAS-029/030/031). Native admission uses the public App contract; this source qualification does not claim installed native Desktop release acceptance.

Canvas registers its board writer through the public App editing-session registry and awaits native admission when present (LN-CANVAS-027). This qualifies producer admission and protection contracts, while installed native Desktop release acceptance remains separate.

Canvas queue qualification (LN-CANVAS-024/025/026) covers captured board writes. The separate App/native producer admission evidence is LN-CANVAS-027; pending embedded buffers are covered separately by LN-CANVAS-029/030/031. Producer qualification MUST NOT be presented as native release acceptance.

Canvas editable-document validation belongs to the Canvas plugin (LN-CANVAS-005). Native Search retains its separately tested tolerant canvas-text extractor; it MUST NOT become an editable-file repair or persistence authority.

Rolling dependency-image reviews update only the verified CI image pin. They
MUST NOT change native service revisions, runtime installation authority or
plugin archive identity; native admission continues to use the signed release
coordinates under LP-SPEC-002 and LP-SPEC-051.

The Bases embed catalog renders file and fenced Board/Activity instances with
an explicitly owned App. Read-only Search and Filter change only the embedded
query; no native writer, metadata parser revision, or installation authority
is introduced by this presentation slice (LN-BASE-008/011).

<!-- dependency-automation-policy -->

Bases consumes the released Core 0.12.3 repeated-embed accessibility repair through normal npm ranges. The root validation graph and Bases resolve the repaired Core package with their compatible UI peers; this browser renderer intake changes no native service revision or installation authority.

Dependency update PRs from the trusted LapisMD App, Dependabot or Renovate MAY skip specification checks using the PR author rather than the rerun actor. Functional checks remain required. The shared `lapismd/dependency-automation` coordinator proposes published first-party npm updates with Changeset release intent where required; it does not merge, publish, sign or deploy. This CI policy changes no runtime or public contract in this chapter.

Native hosts installing a retained static archive use its original signed
source identity. Registry dispatch verifies that identity against the immutable
release tag rather than assigning the rerun's source commit. This release-tool
boundary preserves the archive bytes, runtime descriptor, native service pins
and host-owned installation admission; it introduces no native service API.
LP-SPEC-016 recovery retains the signed source identity across partial npm
publication and failed-job retries. Native installation admission consumes the
verified published archive after the selected npm/GitHub publication completes;
an operator's successful publisher-configuration audit supplies no installation
or native-service authorization.
Release bundling inlines `@lapis-notes/markdown` instead of admitting it as a host module. Plugins declare the editor and renderer host modules that inlined Markdown leaves external. This does not change a native service.

Approving Bases and History version eligibility changes only npm release
selection. The private native service crate stays separately qualified and
Git-pinned; this intake adds no Rust publication or native algorithm change.

API 0.2.3 settles browser Sync initialization before its owned cleanup. The
root and independent Sync validation graphs take that published repair while
preserving qualified Rust revisions, native algorithms and host capabilities.
Final hosted/native acceptance remains with each consumer.
Core 0.7.4 is the verified registry renderer input for both graphs. Retain the
canonical root Bits patch when building runtime bundles; changing this npm
input does not advance or replace a qualified native Git revision.

The browser panel-story host starts and drains the API-owned vault-change
service so managed renames rebind existing file views after writer guards
release. This ordinary host projection adds no native writer, persistence
fallback or alternate admission path. Native service qualification remains
separate from the focused editor-chrome stories.

Markdown preview admission adapts the App-owned native editing-intent port;
it retains the public Mira input lease and existing conditional text writer.
This binding adds no Tasks/plugin transformation engine, Rust policy or
independent persistence owner to the renderer. Native algorithms and host
selection retain their existing owning-package gates.

The private `crates/lapis-plugin-services` crate owns transport-independent
first-party algorithms for the shared Rust migration. It has no Tauri, HTTP,
database, application scheduler or renderer dependency. Published npm plugin
contracts and the standalone browser implementation remain unchanged.
Specification search uses that published validator and the system QMD binary.
It adds no native service, writer, or renderer owner.

Search settings recovery refreshes its retained plugin and mounted panels through
the public owning-App configuration events. Changed embedding and chunking data
uses the existing admitted native controls; recovery neither writes the settings
again nor adds a renderer indexing owner. The pure native service algorithms,
source pins and host-specific owner cutover retain their separate gates.

## Requirements

| ID            | Requirement                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-NATIVE-001 | The native Markdown extractor MUST retain the existing renderer extractor's frontmatter, heading, link, tag, heading-context and UTF-16 position results. Shared fixtures MUST qualify both implementations, including serialized YAML 1.2 scalar, Unicode, alias and invalid-input outcomes.                                  |
| LN-NATIVE-002 | Native Markdown cache identity MUST use the retained MD5 of the UTF-8 source bytes. Application policy MUST own index publication and unattended lifetime.                                                                                                                                                                     |
| LN-NATIVE-003 | The native Markdown parser version MUST change when metadata interpretation changes so unchanged source bytes cannot reuse stale derived metadata.                                                                                                                                                                             |
| LN-NATIVE-004 | The native Canvas Search extractor MUST preserve the retained built-in provider’s ordered field extraction, blank-value filtering and original-source fallback. Shared complete outcomes MUST qualify both implementations. Application services MUST own provider selection, configuration, source admission and publication. |

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

Repository backup services may expose LN-HIST-018's optional persisted
selection contract. Plugin start/stop then observe passively, configuration
events reconcile presentation, and native services own saved selection and
capture lifetime. Legacy services retain their behavior.

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
graph under LP-SPEC-057. Recorded unpatched audit exceptions add no native
service. Local Storybook interaction uses eight browser shards. Pull-request CI runs four parallel shards. Each quarter is two sequential browser eighths with a 2 GiB shared-memory mount. The pull-request unit job and static publish install checksum-verified jj 0.45.1 before release checks. Story composition lists tracked files with git ls-files. An already published npm version whose tarball differs stays on the registry, later packages continue, an existing GitHub release whose .lapis-plugin asset differs stays in place, and a missing GitHub release is still created. A trusted-publisher rejection does not stop later packages. Sync tests are skipped. Source manifests and the root lockfile stay portable and omit the local pnpmfile checksum, and native
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

Regenerating the tracked Bits UI lifecycle-patch hash for the Slider
destroyed-state document-handler guards (LP-SPEC-058) keeps the same
registry-only resolution and selects no other native Markdown/Search
implementation; the native crate stages and their host selections stay
separately pinned.

The authorized composed Bits UI 2.20.2 browser patch retains Link Preview and
Slider teardown and the upstream same-container focus repair. Its explicit root
registration changes the renderer dependency input only; native algorithms,
crate pins, admitted host capabilities and independent native gates remain.

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

## Built-in Canvas Search source

The pure native extractor stages the retained Search provider under
LN-SRCH-034 without changing that TypeScript implementation. It extracts node
type, text, label, file and URL, followed by edge labels, retaining order,
duplicates and original nonblank strings. Blankness follows ECMAScript trim,
including its distinction between U+0085 and U+FEFF. Failed JSON parsing or
invalid collection/field operations return the original source. This stage
introduces no application writer, callback runtime or npm API; both host
selections and full provider/configuration scheduling remain separate. A main push opens a Changesets version pull request only when a changeset can bump a published package, and does not publish. A release
rerun skips an npm version already on the registry, verifies that tarball, and
creates any missing GitHub release without publishing again. Markdown dependents
declare `^0.2.0` and the workspace install links the local package until that
release exists. Package checks wait for its build so the embed export exists.

The Notebook canvas cohort dependency intake retains native-service contracts; compatibility evidence and remaining full qualification are tracked in spec/records/2026-10-31-notebook-canvas-compat.md.

The final Core 0.9 registry refresh changes no native service, plugin algorithm
or CSV behavior. Native source and host adoption remain separately qualified;
renderer dependency compatibility MUST NOT be reported as native acceptance.

History's Core 0.9 dependency compatibility repair preserves every repository
service and callback. Its native provider qualification remains distinct from
the renderer settings-page type check.

The document release recovery prepares DOCX 0.2.1, PDF 0.2.1 and Slides 0.1.2 through Changesets and the existing LP-SPEC-016 qualification gates. Their earlier npm versions and signed GitHub assets remain immutable; native service revisions and host-profile adoption retain their separate owning-consumer gates.

DOCX npm qualification bundles its browser-only WordCanvas graph and assets into the tarball. LP-SPEC-011 now checks the packed inventory for every literal relative JavaScript import, so checkout-only vendor files cannot qualify a portable package. Native service source pins and installation admission retain their existing ownership.

The Bases kanban view is a renderer-only addition: no native service, callback
or plugin algorithm changes. Its bundled archive payload remains rebuilt from
the same source commit and package version as the npm package.

Bases Markdown board reference scenarios exercise the renderer and in-memory App query boundary. Their fixture loading and grouping require no native-service transport or application-specific status model.

Configurable Bases boards use Design Core `^0.12.1` for shared presentation,
while embedded Markdown editing uses the App-owned query and file-editing services. Renderer verification may use checksum-verified
candidate archives on remote Docker while preserving all workspace dependency
security overrides and audit policy. Those renderer and packaging receipts do
not replace native-service qualification or authorize a native dependency change.
History's Core 0.12 compatibility admission binds its settings renderer to the
host's shared provider under the existing renderer qualification gates.

The validation tool installer may recover transient upstream release redirects
through GitHub's official asset API, preserving the same pinned archive bytes,
root executable and version checks. This changes no native service protocol,
parser ownership, runtime selection or host acceptance requirement.

Bases registry and record-view acceptance use explicit story-owned Apps and the
existing remote Docker transport. List activation reuses the owning plugin's
frontmatter writer; it introduces no native service, compatibility singleton
or additional application routing.

History feedback recovery preserves LN-HIST-016/019 passive observation: healthy status reads dismiss transient workspace notices without writing notification history. This changes no service admission, native owner, transport, mutation port or teardown authority.

## Bases audit boundary

The LN-BASE-045 offline query fixture starts at normalized metadata records.
It MUST NOT claim acceptance of native indexing, AppDatabase candidate pushdown,
or application lifecycle behavior. Those service boundaries retain their owning
native and application acceptance requirements.

Bases candidate limits under LN-BASE-004 are safe only when every predicate is lowered. Final PEaQL-only restrictions require complete paginated candidates before the view limit applies; no native service contract is changed.

LN-BASE-046 performs final expression/formula evaluation in Bases. It adds no native state, global App binding or database syntax contract.

LN-BASE-047 leaves host-specific this binding, typed file/link wrappers and real map-provider integration deferred under LN-BASE-012. Scalar helper fixes add no ambient App or native service state.

LN-BASE-048 collection callbacks are evaluated in Bases with lexical query variables and explicit note context; they add no ambient App state or host service contract.

LN-BASE-049 date and editor helpers remain source-owned query behavior. This change adds no host this binding, native service state or implicit App lookup.

Canvas touch gestures and explicit selection remain plugin-owned under LN-CANVAS-051/052; native acceptance must drive real touch input.

Canvas web cards own HTTP(S) admission and explicit sandboxed previews under LN-CANVAS-054/055; remote frame loading must not mutate vault content.
