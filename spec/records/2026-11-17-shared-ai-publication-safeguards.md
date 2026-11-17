# Shared AI publication safeguards

Source owner: Plugins. Requirement: LP-SPEC-060. Base:
`313b4a41b8910e2f1db2cf07a64e73ca13f26fe3`. JJ change: `ukmnqynp`.
This is the first substep of Notes' legacy runtime retirement plan. The shared
implementation/catalog and Notes probes still exist; this receipt does not claim
package removal, deployed registry disablement or native/data qualification.

## Behavior

Both publication workflows omit shared AI. Static and deferred release planners
exclude it. Explicit metadata selection, raw metadata payload construction,
stale/mixed release plans, direct publication and static dispatch reject retired
coordinates before side effects. The tombstone remains independent of source
retention, so later package deletion cannot silently restore eligibility.
Generic positive release fixtures now use Bookmarks. Parked Community/Sync
remain excluded by their existing rules; active package identities are unchanged.
The version-runtime qualification hash tracks the changed catalog bytes.

## Qualification

| Boundary                                                 | Before                            | After                                                                                                                                                   |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:release` including new retirement regressions | 237 passed, 4 failed              | 241 passed, 0 failed                                                                                                                                    |
| Guard-specific behaviors                                 | 4 failed                          | Stale/mixed selectors, metadata no-network, direct publication/static dispatch and both workflow selectors pass                                         |
| `pnpm ci:release` on registry-only graph                 | Not a baseline product regression | Passed; 51 package tasks, 1,398 tests, type/Svelte/build/publint, npm packing, deterministic archives/signature verification, spec and static Storybook |

Exact full-run source/tool identities and outcome are retained in the
[JSON receipt](2026-11-17-shared-ai-publication-ci.json). That snapshot predates
only final selector preflight hardening, preserved formatting and documentation;
final release-tooling/spec checks cover the resulting source. The explicit
Docker specification command is `node scripts/validation.mjs run spec:check`;
the host `pnpm spec:check` attempt lacked the fresh workspace executable. No plugin runtime,
story or shared Storybook setup changed. The full package/static-catalog run is
source/artifact evidence, not application or native acceptance. No visual
baseline was updated.

Host doctor/search ran using declared spec-validator `^0.2.1`, matching the live
latest npm version. QMD reports a native ABI 147 mismatch and semantic discovery
degrades to its documented text fallback. Docker specification validation uses
the pinned worker toolchain. No persistent/global tooling was changed.

Failed attempts remain separate: the first local target lacked dependencies;
the first Docker transfer hit local ENOSPC. The baseline Docker run then
reproduced all four intended guard failures. The initial after-run passed 239/241:
the old public-workflow oracle still expected AI and the source-owned
version-runtime catalog digest needed refresh. Both were corrected without
relaxing rejection assertions. The final run passes 241/241.

An archive-backed `ci:release` attempt stopped at the audit gate on an old API
0.1.4 candidate's moderate Minimatch advisory. Registry-only `pnpm audit --json`
reported zero moderate/high/critical findings and one existing low finding under
the unchanged audit policy. The successful full run uses no candidate archives.
No advisory ignore, dependency manifest or lockfile changed.

## Remaining work

Notes owns the resumable cross-repository checklist. Next remove the shared
package, exports/media/catalog/release build selectors and Notes controller
probes/dependencies, preserving Tauri-owned AI, Rust execution, App Profile
native chat, API file-tools and excluded standalone controller consumers.
Qualify installed external-versus-bundled provenance, disablement/Safe Mode,
settings/conversation/memory retention and cold lifecycle before declaring shared
AI retirement complete. Registry signing/deployment, npm deprecation and releases
retain their separate governing gates. No npm publication or remote landing was
performed here; concurrent conflicted `main` remains untouched.
