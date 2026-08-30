# Specification Governance

## Requirements

| ID          | Requirement                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LP-SPEC-001 | `spec/src` MUST remain the canonical specification for this repository and MUST build with mdBook.                                                                                                                              |
| LP-SPEC-002 | Protected package, Storybook, release, validation, and CI changes MUST update an owning canonical chapter in the same Jujutsu change.                                                                                           |
| LP-SPEC-003 | Every normative requirement ID MUST be unique and MUST have exactly one verification row with concrete evidence.                                                                                                                |
| LP-SPEC-004 | Plugin behavior and plugin-owned Storybook verification MUST live in this repository. Framework profiles, installation UI, host persistence, Safe Mode, Workspace Trust, and signature policy MUST remain owned by Lapis Notes. |
| LP-SPEC-005 | File Explorer MUST remain framework-owned in `lapis-notes`; this repository MUST NOT publish or specify it as one of the extracted plugins.                                                                                     |
| LP-SPEC-006 | The repository MUST use one root Storybook that discovers package-owned stories and applies one addon, theme, accessibility, and visual-validation policy. It MUST NOT create a Storybook per package.                          |
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
Package registry metadata is protected by the same mapped spec-first rule. Each
source file maps to its owning plugin chapter, while shared schema, audit, and
dispatch tooling map to Distribution and this governance chapter.
Shared registry showcase and capture tooling MUST use the root Storybook, fixed
viewports, package-owned source stories, and deterministic comparison without
creating or approving Visual Delta baselines.
Registry platform generation and dedicated Overview-content auditing are
protected by LP-SPEC-032 and LP-SPEC-033. Shared manifest normalization,
release compatibility, package-file, and registry metadata checks map to
Distribution and this governance chapter; each package-owned Overview remains
mapped to its owning plugin chapter.
Worker packaging changes require focused package checks plus a packed consumer
development startup that exercises Vite dependency discovery.
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
Release dependency resolution is protected by LP-SPEC-024: the tracked root
lockfile and frozen workflow installs are part of the reviewed release source,
not runner-local state.
Manual publication controls, bounded GitHub-asset replacement, and workflow
runtime and mdBook provisioning are protected by LP-SPEC-025 through
LP-SPEC-027. Their tests
must cover all eleven boolean inputs, explicit-selection parsing, registry
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
