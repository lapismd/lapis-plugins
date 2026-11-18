# Remove the portable Docker Deno prerequisite

Owner: Plugins. Requirement: LP-SPEC-053; supporting governance LP-SPEC-002.
Status: local smoke, source/archive/static, complete interactions, preserved
Sync and final canonical/metadata checks pass; hosted qualification and merge
remain pending. Base:
`8a90c1063dab11af5e5c211bc00a3ebbce79c0cd` (fresh GitHub main). Working change:
`kpusqwpv`, isolated `retirement-deno-validation` workspace.

## Contract and scope

Remove only the private portable Docker image's Deno stage/copy and worker's
unconditional Deno version probe. The image build rejects unexpected Deno, and
the real finished-image browser smoke independently verifies its absence.
Required Node, pnpm, Jujutsu, Git and mdBook probes still execute and fail
closed; the existing full-image Rust probes remain intact. Source/parent/archive
gates, frozen installs, independent caches, bounded resources, literal
arguments, reports, audit policy and Docker-only execution are unchanged.

The complete current tree and active selectors were inspected before editing.
Shared AI source/controller integration is already absent and guarded against
reactivation. Hosted setup/build/check/release selectors do not provision Deno.
The private Sync package's check/test/build use TypeScript, Vitest, Svelte and
esbuild; its engine and future Node/Deno support remain preserved. Its explicit
`dev/sync/native-sign-in.spec.ts` command still launches an operator-provided
Deno review process through its own Playwright configuration. That manual native
acceptance, parked release/activation policy, Sync services, public exports,
Rust/native AI, core APIs/functions, Language Service and all terminal tooling
are unchanged. No product or native gate is retired by this change.

## Exact Docker regression

All three completed runs use the same Deno-free image
`sha256:3078eab0ae796a0fbcabd8af91461d78ee3e1d50e46449a0332259a8ef6b42e7` and
exact command `node scripts/validation.mjs run validation:smoke` with 2 CPUs, 4
GiB memory, 2 GiB shared memory and the normal 2 GiB Node heap.

| Attempt                                            | Run                                    | Result                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Unchanged worker, Deno-free image                  | `70f7addb-edeb-4184-a196-6ef22055e22f` | One failure: `spawnSync deno ENOENT`; no registered lane invocation reached.                                                                 |
| Worker repaired; initial finished-image assertion  | `24af8ecb-259c-4678-957a-4abec993b328` | One failure: dash returned 127 for absent `command -v`, rather than the assertion's expected 1. All mandatory version probes already passed. |
| Explicit shell condition normalizes absence status | `726ed165-83f4-4e51-aafe-b6eff35d06b9` | One registered invocation passes; finished-image Deno absence, real Chromium and real WebKit launch/content/cleanup pass.                    |

The [exact smoke receipts](2026-11-18-deno-free-docker-smoke.json) retain all
three source revisions, tool identities, outcomes and image equality.

The shell repair preserves rejection when Deno is present; it does not accept
arbitrary shell failures. No actual Deno runtime is launched for the absence
check. The original failure and intermediate failed assertion remain retained.

Versions: Node 24.15.0, pnpm 10.34.5, jj 0.45.1, Git 2.39.5 and mdBook 0.5.4.
Registry-only frozen dependencies are used, without candidate package overlays.

## Existing advisory policy

Ordinary registry-only audit passes without changing the approved policy. Its
three reported paths are Elliptic 6.6.1 through
`vite-plugin-node-polyfills > node-stdlib-browser > crypto-browserify > browserify-sign`
(GHSA-848j-6mx2-7j84, low) and Picomatch 2.3.2 through
Changesets/config/Micromatch plus 4.0.7 through Storybook/addon-docs/Unplugin
(GHSA-fc5q-39xc-vjpf, high). Existing CVE-2025-14505 and CVE-2026-112366
allowances already cover them; no exception is added here. The
[audit identity](2026-11-18-deno-free-docker-audit.json) records exact paths,
versions and unchanged source policy/lock hashes. A separate, stricter Docker
copy omitted the ignore list only to expose those identities; its expected exit
1 is diagnostic evidence, not a passing gate or a source-policy change.

## Qualification and remaining work

Runner controls `fee9bc46-768f-4bfb-a123-de071e7eaea0` pass 64/64 with no
failures or skips, including all five new cases. Ordinary owning check
`cda4c086-e20c-474f-aede-81447d6a7056` passes all 17 package tasks, with zero
type/Svelte errors or warnings and intact metadata/ownership gates.

The new executable controls exercise real external version-probe processes under
an isolated PATH. They cover Deno-absent portable reporting, missing and failing
mandatory tools, retained Rust probes and the actual Docker admission shell with
both absent and present executable fixtures. They run through `validation:check`
and the existing complete release-test selector.

The [full source receipt](2026-11-18-deno-free-docker-ci.json) records
`997d4c51-ca36-478e-948d-9d32d61aa155`: `ci:release` passes all 48 tasks, 1,022
Vitest plus 97 repository cases (1,119 package tests), all 262 release controls,
16 npm packs and 16 verified runtime payloads. Canonical checks, App ownership,
CSS audit and the cold static Storybook build pass. Existing unused-import and
large-chunk warnings remain visible. Development signing does not authorize
production signature custody or publication.

The
[complete interaction receipt](2026-11-18-deno-free-docker-interactions.json)
records `f1f8dacb-e67e-4c2a-8bc9-d8a6ab6891dd`: all eight cold invocations pass
410 interaction/accessibility cases with zero failures or skips. Existing
ResizeObserver-loop console diagnostics remain visible without a new filter. The
[preserved Sync receipt](2026-11-18-deno-free-docker-sync.json) records
`88bc679b-074d-41fa-acc1-25340c93a4fa`: check, 326 tests across 19 files and
build pass without Deno. Its independent frozen audit also exits zero under the
unchanged policy. This is source qualification, not the manual Deno review, OS
keychain, native participant, full Sync product or publication acceptance.

The full source snapshot precedes only additional audit/evidence summaries.
Production/private validation bodies are unchanged after those executable
checks. Final canonical checks qualify the resulting documentation separately.

Final `spec:check` run `2ecf7339-8356-4037-a34d-7254738cf0f1` passes all four
canonical lanes and App ownership on the resulting source/evidence tree. Final
metadata-only sealing is formatted and revalidated separately. Current
production/private validation bodies match the full source snapshot unchanged.

Remaining after local qualification:

- Commit and push the reviewed source slice, then qualify its exact hosted
  head before merging. Package/artifact publication retains its separate user
  approval gate.

## Infrastructure attempts retained

The first owned SSH attempt stalled during authentication, then progressed into
image building while its local runner was interrupted. It produced no worker
acceptance. A second attempt using the existing Desktop socket failed at
`docker info`; both handles became terminal before the successful baseline. The
task now uses an explicitly authenticated owned SSH master and the helper's
existing private socket option. No global SSH configuration, credentials,
transport source, runner fallback or other workspace process was changed.

A root metadata attempt used host aliases without installed Prettier or
Spec Validator and stopped before validation. It is not product qualification;
final metadata is checked through the explicit Docker runner.

Latest published Deno-free Spec Validator 0.2.1 is already the manifest floor.
The host doctor retains the existing QMD Node ABI 147 error and alias warning;
semantic discovery reports the explicit text fallback. Global tooling was not
repaired, and pinned Docker owns implementation qualification.

No publication, registry dispatch, native/provider execution, installed-app
replacement, user-profile access or visual baseline update is included.
