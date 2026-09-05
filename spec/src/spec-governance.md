# Specification Governance

## Requirements

| ID          | Requirement                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LP-SPEC-001 | `spec/src` MUST remain the canonical specification for this repository and MUST build with mdBook.                                                                                                                              |
| LP-SPEC-002 | Protected package, Storybook, release, validation, and CI changes MUST update an owning canonical chapter in the same Jujutsu change.                                                                                           |
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
requires every externalized Lapis runtime module to resolve through a declared
peer supplied by the consuming application.
Shared release tooling MAY treat only the three compiler-emitted Svelte
renderer specifiers named by LP-SPEC-014 as an implicit host ABI. Focused tests
MUST reject arbitrary Svelte subpaths and keep this ABI out of authored plugin
manifest dependencies.
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
Shared Storybook test setup also fails closed on Svelte `derived_inert`
diagnostics. The classifier is deliberately narrow so unrelated warnings keep
their existing behavior while destroyed-effect reads cannot leave an
interaction run falsely green.
Until the affected Bits UI releases provide equivalent lifecycle cleanup, the
root dependency graph applies reviewed pnpm patches to every resolved version.
Release verification checks both patch mappings and the Link Preview selection
timer and Scroll Area resize-timer cancellation, so a lockfile update cannot
silently restore the destroyed-effect reads.
CI image and remote-cache changes are protected by LP-SPEC-036. The checked-in
image manifest, dependency-only context generator, Dockerfile, publication
workflow, remote-cache configuration, and their focused tests map to
Distribution and this governance chapter. Local credentials remain in the
ignored root `.env`; the tracked `.env.example` documents names only.
Turbo orchestration, bounded artifact workers, already-built packing, and the
local container runner are protected by LP-SPEC-037. Their shared concurrency
and container helpers require focused scheduling, failure-cancellation,
ordering, cache-forwarding, and secretless-fallback tests before the complete
package and release lanes run.
The CI fan-out and stable aggregation gate are protected by LP-SPEC-038. The
workflow, pinned setup composite, Turbo cache summary reporter, and workflow
source tests map to Distribution and this chapter. Functional Storybook and
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
not runner-local state.
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
