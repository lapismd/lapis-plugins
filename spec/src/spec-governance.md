# Specification Governance

LP-SPEC-053 defaults local portable validation to isolated Docker workers;
hosted CI explicitly uses its provisioned native runtime. The repository-owned
composition plugin enforces LP-SPEC-054 and LP-SPEC-055 beside existing Docs,
App-ownership, public-boundary, accessibility and release checks.

The isolated catalog qualification records the user's 2026-10-25 acceptance of
the released API's existing Zod 3 advisory for this infrastructure change only.
Normal audit-first commands and release qualification remain blocked. The
approved Transcripts Markdown peer/development correction preserves LP-SPEC-011;
temporary source-archive acceptance and the released Design Core teardown
blocker remain explicit in the [qualification record](../records/2026-10-25-catalog-validation.md).

The isolated Desktop shared-screen intake accepts portable Mira compatibility
ranges. Existing audit findings are recorded separately with the user
acceptance in `spec/records/2026-10-23-desktop-mira-compatibility.md`; no release
or audit exemption is granted.

The Search query-settlement repair maps to the Search chapter and verification
record. Source, shared catalog and consumer acceptance remain separate gates;
its pending-query scenario does not waive lifecycle failures or authorize visual
baseline changes.

Shared disposable panel fixtures seed app, types, workspace and bookmark state
under the API's `.lapis` directory. Their explicit configuration path and default
workspace loader must select the same state; expected panel counts, placement
assertions, timeouts and accessibility gates remain unchanged (LP-SPEC-006).

Source Editor, Markdown and Graph also accept Design Core 0.5.1 through portable
semver ranges. The 0.4 registry graph remains valid; current-source Desktop
acceptance uses verified 0.5.1 public archives without changing release gates.

Search accepts Design Core 0.4 and 0.5 through portable semver ranges; its
locked 0.4 graph and source/package ownership remain unchanged. Local 0.5
consumer acceptance is recorded in `spec/records/2026-10-19-search-empty-results.md`.

The standalone Bases accessibility patch preserves all normal CI and release
gates. Its workflow story verifies the named property search and visible
controlled list; source IDs remain unique across component instances and typed
view options. Notes acceptance must consume the released package fix rather
than a source alias, patched dependency or suppressed accessibility check.

The Design Core 0.4.0 consumer refresh updates declared npm ranges and both
registry lockfiles. Package and cold catalog checks qualify public exports,
prepared CSS and bundled fonts; existing visual baselines and private Sync
activation remain separate review gates.

The consumer repair retains all visibility, geometry, pointer-hit and axe
assertions. Cold focused stories qualify overlay readiness, tool-summary
selectors and Bases picker accessibility; full suites remain required in CI
under the user's local memory-pressure constraint.

Private Sync sign-in acceptance records its isolated host's real Deno journey
separately from Storybook fixtures. A host dependency compatibility repair keeps
the frozen registry graph and startup evidence explicit; it does not waive
normal CI, packaging or publication gates.

Bases query-controls acceptance keeps the results menu visible for axe, covering
its limit label and input. A reproduced contrast failure is fixed in the owning
component; the accessibility threshold and visual baselines are unchanged.

Clean CI catalog acceptance includes the parked Sync package's frozen registry
install, with local hooks bypassed. Its dependency lock does not activate the
package for installation or publication. The parked-plugin workflow regression
covers this setup and its separate dependency audit.

Dependency-graph repair consumes the upstream UI 0.1.3 release before
reconciling compatible API, CodeMirror and Lezer resolutions. Qualification
retains the exact Graph/AI type checks and Bases Editable Cells highlighting
assertion; casts, aliases and relaxed assertions do not qualify the graph.
AI, Bases and History mobile shell stories qualify the published count-bearing
dock label by opening and closing the actual workspace tab chooser.

Registry dependency acceptance bypasses pre-existing local pnpm hooks with
`--ignore-pnpmfile`; local hook files remain outside the verified diff. The
private Sync review record includes its separate registry install command and
the released Design Core floor before controlled header integration.

The registry metadata audit enforces the manifest-owned SHA-256 Gravatar for
`dev@lapis.md` under LP-SPEC-041, including image size and initials fallback.

Lapis Sync maps `packages/sync` to `plugins/sync/index.md`. Its direct package
checks and explicit shared-catalog stories remain separate from installation
and release selection. The retained source inventory records the Apache-2.0
correction in the owning Nostr Sync repository before extraction.

Dependency-image automation follows LP-SPEC-051: terminal PR states never
absorb a new digest update. The executable workflow regressions cover merged,
closed and open reviews without changing the normal required CI gates.

The verified shared CI image refresh maps its base pin, dependency-only build
context and generated dependency digest to this chapter and Distribution.
GitHub CLI is supplied by the upstream image; no consumer installs or patches
the tool at job runtime. Publication remains independently approved.

Shared Storybook diagnostics now cover formatted Svelte warnings, diagnostic URLs
and Error objects, and retain caught teardown failures for after-story and final
cleanup checks. Dependency-originated diagnostics remain fatal under LP-SPEC-034.

Release version preparation updates each active plugin's mapped chapter and
the shared framework floor catalog. Generated manifests and documentation must
agree with the selected independent Changesets versions; parked packages must
remain excluded.

The final version batch records AI 0.1.5, History 0.1.4 and Markdown 0.1.6 in
their manifests, generated documentation and authentic Changesets changelogs.
The committed lockfile retains the qualified dependency graph and advances AI's
local Markdown development edge with its public peer. CI owns the complete
verification lanes for this candidate; publication remains separately approved.

Checkpoint repairs require owning API regressions and plugin regressions for
both invalidation and warm reuse. Release intent must name the affected plugin
and retain prerequisite API version qualification. Static publication and the
deferred relay route keep independent activation and approval gates.

Dependency acceptance now uses published Design Core `0.3.1` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.
Shared specification tooling resolves `@lapismd/spec-validator@0.1.4` from npm.

Shared UI dependency refreshes advance portable package ranges and the committed
lockfile together without adding checkout-specific package paths.
The Sync Settings layout regression is qualified against released Design Core
0.3.4 rather than a consumer CSS override or local source remap.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LP-SPEC-001 | `spec/src` MUST remain the canonical specification for this repository and MUST build with mdBook.                                                                                                                              |
| LP-SPEC-002 | Protected package, Storybook, release, validation, and CI changes MUST update an owning canonical chapter and exactly its verification row in the same Jujutsu change, including scheduled Registry-head renewal tooling.       |
| LP-SPEC-003 | Every normative requirement ID MUST be unique and MUST have exactly one verification row with concrete evidence.                                                                                                                |
| LP-SPEC-004 | Plugin behavior and plugin-owned Storybook verification MUST live in this repository. Framework profiles, installation UI, host persistence, Safe Mode, Workspace Trust, and signature policy MUST remain owned by Lapis Notes. |
| LP-SPEC-005 | File Explorer MUST remain framework-owned in `lapis-notes`; this repository MUST NOT publish or specify it as one of the extracted plugins.                                                                                     |
| LP-SPEC-006 | The repository MUST use one root Storybook that discovers package-owned stories and applies one addon, theme, accessibility, visual-validation, and dependency-optimization policy. It MUST NOT create a Storybook per package. |
| LP-SPEC-007 | Tracked agent guidance MUST require explicit or context-owned App access, reject `globalThis.app`, preserve unrelated work, and commit verified slices with Jujutsu.                                                            |

The specification-first map assigns each `packages/<name>` tree to its matching
`spec/src/plugins/<name>` chapter. Markdown panel and story changes additionally
map to the owning Markdown panel chapter. Shared build, release, Storybook,
workflow, and repository files map to [Distribution and releases](distribution.md)
and this chapter. Release-security tests cover the tokenless npm workflow,
approved-release environment, and immutable-version patch rollback policy.
Package-boundary verification also rejects bundled Lapis host packages and
requires every externalized Lapis or approved singleton editor runtime module to resolve through a declared
peer supplied by the consuming application.
CSV's markup editor and search modules are declared peers on that same list.
Shared release tooling MUST scan all emitted JavaScript runtime chunks for
browser bare imports. Only declared Lapis, approved CodeMirror/Lezer and versioned Svelte renderer host modules may remain external;
Compiler-emitted Svelte imports bind the locked renderer ABI through host-owned
import maps. Other non-host imports stay bundled or relative.
Release compiler reproducibility is protected by LP-SPEC-047. The builder reads
the root frozen lockfile and MUST reject installed Svelte drift before writing
plugin output.
Package registry metadata is protected by the same mapped spec-first rule. Each
source file maps to its owning plugin chapter, while shared schema, audit, and
dispatch tooling map to Distribution and this governance chapter.
Shared registry showcase and capture tooling MUST use the root Storybook, fixed
viewports, package-owned source stories, and deterministic comparison without
creating or approving Visual Delta baselines.
Tracked registry-media guidance and the canonical registry-media chapter MUST
stay aligned on story naming, capture density, authored data, generation
commands, source-specific diagnostic isolation, production-compatible browser
shims, final-state assertions, and baseline policy.
They also stay aligned on required banner and selective distinct Overview
roles, two-theme capture, exact half-area diagonal composition, Word Count
full-shell framing, and the four-output media contract.
The shared Storybook host installs published Mira 0.1.0 so Design Core 0.6.0
and the 0.0.3 editor plugins resolve one Mira line. Deep Mira modules stay in
the Vite prebundle, which converts their CommonJS dependencies before the
preview loads them.
The Transcripts Reading preview is visual-pending under
`Plugins/Transcripts/Panels/Reading`. It MUST show the scrollable sample in
all six governed workspace placements, with slightly larger circular speaker avatars in
distinct colours, a compact theme-surface footer, and one source icon that opens the Markdown editor.
`Plugins/Transcripts/Registry Screenshots` is in the registry-media inventory.
Its shell presets the open note in the workspace seed, so the first frame is
that page.
The PDF viewing preview is visual-pending under `Plugins/PDF/Panels/Viewing`.
It MUST show the seeded PDF in all six governed placements, and Middle (Top
Tabs) MUST also show that PDF inside a note embed. Registry media selection
includes `Plugins/PDF/Registry Screenshots`. Stories stay `visual-pending` and MUST
NOT create Visual Delta baselines.
The CSV table preview is visual-pending under `Plugins/CSV/Panels/Table`.
It MUST show the seeded CSV in all six governed placements, and Middle (Top
Tabs) MUST also show that CSV inside a note embed. Registry media selection
omits CSV until its screenshot slice. Stories stay `visual-pending` and MUST
NOT create Visual Delta baselines.
Shared full-shell framing changes MUST preserve the complete 3:2 source capture
and prove both horizontal edges remain in the composed output. Every composed
frame MUST preserve the shared dark right-edge gutter; subject-focused presets
retain their explicitly bounded crop.
Registry platform generation and dedicated Overview-content auditing are
protected by LP-SPEC-032 and LP-SPEC-033. Shared manifest normalization,
release compatibility, package-file, and registry metadata checks map to
Distribution and this governance chapter; each package-owned Overview remains
mapped to its owning plugin chapter.
Worker packaging changes require focused package checks plus a packed consumer
development startup that exercises Vite dependency discovery.
Release builds MUST keep emitted worker and asset URLs relative so a consuming
host can mount each verified plugin beneath its own fingerprinted URL.
Cross-plugin public imports retain runtime peer ownership while a matching
semver development edge makes Turbo build the provider's package exports before
a clean consumer check.
Shared real-App Storybook helpers retain a bounded readiness wait so concurrent
catalog startup does not turn healthy plugin initialization into a timing-only
failure while real boot errors still fail closed.
The shared catalog entry for OpenCode harness selection maps to the owning AI
plugin requirement and its browser interaction evidence.
Shared Storybook test setup also fails closed on Svelte `derived_inert`
diagnostics. The classifier is deliberately narrow so unrelated warnings keep
their existing behavior while destroyed-effect reads cannot leave an
interaction run falsely green.
Until the affected Bits UI releases provide equivalent lifecycle cleanup, the
root dependency graph applies reviewed pnpm patches to every resolved version.
Release verification inventories the versions actually resolved in the frozen
lockfile and checks their patch mappings, hashes and Link Preview selection-timer
cleanup, so a dependency refresh cannot silently restore destroyed-effect reads.
Older versions also require Scroll Area resize-timer cancellation; 2.19.5 uses
the upstream synchronous resize path. The user approved the scoped 2.19.5
lifecycle-patch exception while an upstream fixed release remains unavailable.
Mira 0.0.4 supplies pending-overlay registration and focus teardown through its
published Bits UI 2.19.5 dependency. The consumer floor and frozen lockfile must
retain that provider; unused older patch declarations are retired without
altering the fatal diagnostic guard or the resolved-version patch inventory.
Shared catalog font readiness must request actual font faces within a fixed
timeout and retain download, missing-face and token failures. Focused tests
cover late face registration and fallback-only availability; a shared readiness
change requires the complete four-shard interaction/accessibility lane.
CI image and remote-cache changes are protected by LP-SPEC-036. The checked-in
image manifest, dependency-only context generator, Dockerfile, publication
workflow, manifest pin updater, workflow pin resolvers, remote-cache
configuration, and their focused tests map to Distribution and this governance
chapter. Local credentials remain in the ignored root `.env`; the tracked
`.env.example` documents names only.
Turbo orchestration, bounded artifact workers, already-built packing, and the
local container runner are protected by LP-SPEC-037. Their shared concurrency
and container helpers require focused scheduling, failure-cancellation,
ordering, cache-forwarding, and secretless-fallback tests before the complete
package and release lanes run.
The CI fan-out and stable aggregation gate are protected by LP-SPEC-038. The
workflow, pinned setup composite, Turbo cache summary reporter, and workflow
source tests map to Distribution and this chapter. The prerequisite checks every declared framework range and AI Controller on npm.
Pull requests changing only non-executable, regular Markdown files beneath
`spec/src/` or `spec/records/` use a specification-only lane. Classification
compares the complete PR diff from its single merge base, with renames disabled
so both sides of moves are checked. Empty, malformed, ambiguous or unavailable
comparisons, executable files, symlinks, other spec files and mixed changes
retain full validation. Pushes, manual runs and reusable release calls retain
full validation. The fast lane uses the pinned toolchain and frozen graph and
runs the existing `pnpm spec:check`, including validation, mdBook, spec-first
and App ownership, without package builds or publication prerequisites.
Validate requires successful classification and image resolution. It accepts
the fast route only when specification checks succeed and every full lane is
skipped; otherwise every full lane must succeed. Unexpected skips, cancellations
and failures remain blocking; publication variables cannot turn missing
acceptance into a successful aggregate. Executable regressions cover both routes
and their failure states. Community is not a CI prerequisite. Dependency auditing is
protected by LP-SPEC-048: root `check`, `ci:release`, and the quality job run
`pnpm audit` against the committed lockfile, and only recorded
`auditConfig.ignoreCves` entries may suppress an unpatched advisory. Functional Storybook and
axe failures remain blocking in their own lane; visual baselines do not become
a deployment gate through this infrastructure change. Container setup marks
the checked-out workspace as a trusted Git directory before specification
tools inspect tracked files; this trust is scoped to the exact workspace path.
The reusable validation, production-candidate handoff, and downloaded-artifact
reverification boundary are protected by LP-SPEC-039. Publication workflow
tests must prove the protected job consumes the validated candidate without
rebuilding payloads and retains the explicit plugin and replacement inputs.
Release dependency resolution is protected by LP-SPEC-024: the tracked root
lockfile and frozen workflow installs are part of the reviewed release source,
not runner-local state. A plugin-specific runtime dependency must map to the package behavior it
enables and to the bundling rule that keeps it out of the host import allowlist.
Manual publication controls, bounded GitHub-asset replacement, and workflow
runtime and mdBook provisioning are protected by LP-SPEC-025 through
LP-SPEC-027. Their tests
must cover all thirteen boolean inputs, explicit-selection parsing, registry
replacement refusal, npm immutability, and Node 24 action/build configuration.
Both ordinary CI and approved publication provision the pinned mdBook release
before invoking their canonical specification gates.
The approved publication workflow mints its narrowly scoped registry token from
the GitHub App client ID and private key, avoiding the deprecated numeric App ID
input while keeping missing credentials fail closed before publication.
Generated-output cleanup is protected by LP-SPEC-028 and focused filesystem
tests that distinguish full preparation from a single-plugin rebuild.
Changesets owns package changelogs under LP-SPEC-029; documentation sync tests
must prove candidate preparation preserves existing release history.
Applying and deleting a consumed Changeset maps the resulting version metadata
to Distribution, this governance chapter, and every selected plugin chapter so
release-only changes cannot bypass the same specification review as behavior.
When a consumer Storybook scenario exposes an extracted-plugin defect, the
behavioral correction and its canonical requirement remain plugin-owned while
the consumer interaction remains valid cross-repository acceptance evidence.
The repository-local Storybook Docs audit enforces the shared full-workspace
framing required by LP-SPEC-044 across every governed plugin family.
The canonical Storybook catalog validator enforces the public Show Code
boundary required by LP-SPEC-045. The repository-local Docs audit additionally
enforces the component identity, explanatory copy, and public Properties
contract required by LP-SPEC-046 because those semantics are repository-owned.

The AI Controller migration covers AI's execution facade, domain tool endpoints and
deferred context preparation. Shared Storybook preview publishes a controller
connection bridge only when an explicit URL and token are configured; default
stories stay Fake. The shared Storybook build uses Community's public
Turso helper in both client and worker graphs; full static-build and interaction
acceptance accompanies that configuration change.

The complete interaction lane runs four serial shards with a fresh browser for
each shard. Files run sequentially within a shard to bound retained browser state
and resource use; all stories and accessibility assertions remain selected.

Deferred publication retains the release and renewal workflows in source.
The workflow regression test MUST verify explicit activation on every job,
including selection, validation and image resolution. The operator state and
resumption requirements are recorded in `RELEASING.md`; disabling publication
does not change package versions, relax release checks, or block independently
published canonical specification sites.

The browser archive producer fixes the production environment constant at build
time. Emitted dependencies must not require a host-installed Node process shim.

Static release qualification consumes API-owned schema/build exports and excludes
the retained deferred Nostr test lane under LP-SPEC-049.

AI model discovery and readiness changes map to LN-AI-201 through LN-AI-203. The associated patch
changeset retains focused catalog and mounted-composer regressions, followed by
the shared interaction/accessibility, packaging and signature gates.

History toolbar acceptance checks the actual Desktop shell geometry and a
narrow pane produced through the workspace renderer's sidebar sizing contract.
It verifies centered actions between timestamps and stats, then centered wrapping
below them, and restores the layout after testing. Changed visuals remain
`visual-pending` until human review.

The registry-acceptance fixture maps to Distribution and the static candidate
security gates. Exact frozen source candidates supply signed runtime artifacts
for Web acceptance without replacing committed npm ranges.

Production release retention maps the explicit public candidate file globs and empty-upload gate to Distribution and its verification evidence. Private signing keys remain temporary CI inputs outside the retained release directory.

The private `pnpm dev:sync` review host uses built plugin entrypoints and
released host packages with persistent browser storage. Its loopback-only
control-plane proxy supports connection acceptance without activating Sync
publication, enrollment or content transfer (LN-SYNC-042).

The static catalog build has a bounded 6144 MiB Node heap. The default 4 GiB
heap exhausts while compiling the complete catalog with private Sync enabled;
the build budget does not alter interaction, accessibility or artifact gates.

The catalog validates shared repository-history public exports with recorded
source and consumer evidence. Optional migration peers are provided explicitly
through ignored local archive overlays; committed package ranges and registry
lockfiles retain portable dependency coordinates. Audit remediation changes
patched tool versions without adding advisory suppressions.

The optional History replacement observer remains governed by LN-HIST-015
and its single verification row. Source, archive and consuming-host evidence
remain distinct; it grants no exception to qualification, source ownership or
visual-baseline approval.

The plugin interaction runner owns IPv4 loopback port 63422 with strict port
selection. Notes uses 63421 and Desktop retains its separate catalog port.
Concurrent browser APIs cannot share IPv4/IPv6 listeners behind `localhost`
because module and RPC requests may otherwise reach another repository.

Native first-party algorithms are mapped to the dedicated native-services
chapter and native-verification table. Cargo source, retained renderer fixture
and consuming Notes lifetime evidence remain distinct. Native-only intake does
not qualify npm publication, host adoption, or unrelated pending plugin work.
The ordinary verification generator leaves the `LN-NATIVE` namespace with its
dedicated table, preserving evidence and avoiding duplicate requirement rows.

The current CSV metadata synchronization follows LP-SPEC-002 and keeps the
separate native-services and distribution gates alongside its plugin chapter.
