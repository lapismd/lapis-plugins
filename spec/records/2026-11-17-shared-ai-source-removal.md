# Shared AI package and catalog removal

Owner: Plugins. Requirements: LP-SPEC-060, LP-SPEC-061, LN-SRCH-041.
JJ change: `yttxpsptztrmplnymowutpzmrztnnvrm`, stacked on pushed checkpoint
`ukmnqynp` / `c9da95f4781d536ad037673240ad4e50eabbba83`.
This is the Plugins source/catalog substep, not completion of the entire
cross-repository shared-AI removal. Notes tracks remaining consumers and gates.

## Removed surface and retained contracts

Removed 246 files from `packages/ai` and its 15 owning story files, including
implementation, exports, styles, media, controller runtime and unit tests.
Removed shared panel AI constructors/seeds/settings and the preview connection
bridge/environment definitions. Active build, pack, media, story-parity and
release inventories no longer select shared AI. Only the explicit publication
retirement tombstone remains selectable for rejection; stale plans and metadata
requests still fail closed after source deletion.

The former current LN-AI requirements are preserved in a dated archive outside
current specification authority. A small retirement contract replaces the old
chapter; normal checks and canonical validation run the fail-closed audit.
The audit rejects retired folders and executable/config references, including
CSS, MDX and relative catalog imports, while allowing independently owned Mira
AI. The CI dependency-context helper inventories real package manifests rather
than interpreting the retirement tombstone as a live package path.

Search's public result component retains its own stories. They now mount
`SearchToolResult` with an explicitly owned real App and WorkspaceShell, verify
accessible filename/path naming, actual leaf opening, retained result visibility
and Design Core's empty state. The removed controller-chat wrapper no longer
owns Search acceptance. Native chat/transcript retention remains host acceptance.
Surviving story IDs, plays and visual-pending tags remain; no baseline changed.

The regenerated lock removes only the AI importer and 43 unreachable package
versions, adding no npm package versions. Normal peer closures are regenerated.
No dependency override, advisory exception or remaining package version changed.
Parked Community/Sync, portable API file-tools, native AI and excluded standalone
controller consumers are preserved. No user profile, vault, installed package,
immutable publication, signed registry file or application was altered.

## Qualification

| Target                                                                   | Before                                      | After                                                                                                                                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source absence regression                                                | 1 failed, 1 control passed                  | 3 source/audit-plugin tests pass, including structured synchronous validation                                                                                                    |
| History panel placements                                                 | 6 passed                                    | History plus retained Search result target: 8 passed                                                                                                                             |
| Focused source, manifest-context, prerequisites and parked-package tests | Existing retained boundaries                | 19 passed                                                                                                                                                                        |
| `pnpm ci:release` with registry-only Docker installs                     | Prior checkpoint retained 17 public plugins | Passed: 48 tasks, 1,022 remaining package tests, 241 release-tooling tests, 16 npm archives/runtime payloads, type/Svelte/build/publint, ownership/CSS/spec and static Storybook |
| Complete `pnpm test:storybook`                                           | Exact History baseline above                | 410 passed, 0 failed across all eight sequential interaction/accessibility shards                                                                                                |
| `pnpm audit --json`                                                      | Existing audit policy                       | Zero moderate/high/critical; one existing low finding, unchanged policy                                                                                                          |
| Desktop source audit and its exact governance tests                      | Current recorded Desktop base               | 12 passed; source boundaries pass; not native acceptance                                                                                                                         |

The 376 removed AI unit cases account for the package-test total changing from
1,398 to 1,022; they tested the retired implementation. Surviving package suites
remain complete. The initial release-tooling count stays 241 after replacing removed
AI-only bridge/compatibility cases with the new retirement audit coverage.
The final release-tooling rerun covers 243 cases after adding two renewal guards.
Independent packed acceptance verifies the SHA-256 of all 16 collected npm
archives, checks their package manifests and executable imports, and finds no
shared AI/controller dependency. The [packed inventory](2026-11-17-shared-ai-removal-packages.json)
and [full CI receipt](2026-11-17-shared-ai-removal-ci.json) retain exact identities.
The [interaction receipt](2026-11-17-shared-ai-removal-interactions.json) records
all eight passing invocations.

The full artifact snapshot precedes the audit's added CSS/MDX rejection,
fixture formatting, the deferred head-renewal fence and documentation. Focused source tests, final canonical
checks and the complete interaction run cover the resulting source separately.
These are Docker/Linux source and public-artifact results. They do not establish
macOS native behavior or a Deno-absent toolchain; the worker still has Deno for
other retained work. No publication, deployment or native installation ran.

## Failed attempts retained

The first new Search play used unsupported `expect.poll` (7/8 cases passed).
It now uses Storybook's existing `waitFor` with the same real-leaf assertion;
the exact eight-case target passes. The first custom validator returned an
async result to the synchronous validator extension boundary; it failed closed.
The audit and adapter are now synchronous and a dedicated regression verifies
the structured result. A subsequent specification invocation collided with the
previous run's workspace lease; validation runs are serial and no lease guard
was bypassed. QMD doctor/search still reports the host's Node ABI mismatch;
conceptual discovery uses the documented text fallback. Spec-validator remains
the latest Deno-free `0.2.1` release; no global/local loader config changed.

The final release-tooling rerun additionally covers deferred registry-head
renewal: a mixed batch containing `ai` fails before OIDC/signing and direct
renewed-template construction applies the same tombstone. Its new wiring
regression failed before those guards and passes after (2 focused cases). This
adds no Community dependency or relay activation. Actual deferred Nostr/relay
acceptance remains behind its existing prerequisite and activation gates.

## Remaining cross-repository work

Next remove Notes' duplicate AI stories, controller bridges/probes, root
consumer dependencies, optimizer and local-archive requirements. Preserve App
Profile native chat and API `ai-host/file-tools`. Reconcile Desktop's existing
coverage and qualify external-versus-bundled `ai` provenance/data, Safe Mode,
disablement and cold lifecycle. Update Website/organization guidance and perform
the separately governed signed-registry publication, deployed/direct-API and
stale-cache acceptance, and npm deprecation. No unpublish. Other runtime/API
removals remain pending; do not start terminal cleanup during this shared-AI work.
