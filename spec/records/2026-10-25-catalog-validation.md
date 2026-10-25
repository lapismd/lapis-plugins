# Lapis Plugins catalog validation and Docker execution

Status: original implementation and qualification for this isolated change in the
`catalog-validation` Jujutsu workspace. Registry-only release qualification
remains blocked as described below.
Ongoing application edits in the default workspace were excluded from this
original qualification. See [the later landing record](2026-10-25-catalog-main-landing.md)
for the combined main workspace and its additional blockers.

The repository owns its WorkspaceShell policy through the spec-validator plugin
and explicit inventory. Component examples do not claim full application parity.
The public-package boundaries and existing App ownership, Show Code, interaction
and accessibility gates remain in force.

Before implementation, the runner target was absent. Docker source/tool/browser
smoke and runner regressions are recorded under ignored `.local/validation/`.
The composition inventory initially reported 4 findings;
fixture controls and explicit loading presentation resolve them without
replacing production components.

Qualified commands (Linux Docker on the remote `omarchy` daemon, 4 CPUs,
12 GiB RAM and 2 GiB shared memory):

| Command                 | Result                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm validation:check` | 47 runner/composition cases pass                                                                             |
| `pnpm ci:packages`      | All 39 build/check/test tasks pass for 13 packages; 831 Vitest cases pass                                    |
| `pnpm test:release`     | All 137 release/tooling cases pass                                                                           |
| `pnpm validation:sync`  | Private Sync check/build and 205 tests pass                                                                  |
| `pnpm spec:check`       | Canonical validation and App-ownership pass                                                                  |
| `pnpm test:storybook`   | 266 cases pass on the refreshed lock across all four cold shards: 58, 86, 53, 69                             |
| `pnpm build-storybook`  | Static catalog build passes with the refreshed graph                                                         |
| `pnpm packages:pack`    | All 13 npm archives pass publint and package containment; persisted manifest and SHA-256 identities verified |
| `pnpm packages:check`   | All 13 manifests, documentation and public boundaries plus 14 registry metadata sources pass                 |

Graph's exact package check initially found two incompatible physical API class
copies through distinct Mira peers. Refreshing released Mira resolutions within
the existing supported ranges (root and Markdown both 0.1.1) resolves them.
The exact Graph lane passes all 60 tests and checks, then the complete package
lane passes. No type casts, aliases or peer-contract changes conceal the defect.

The final registry audit retains one pre-existing high Zod 3 advisory,
GHSA-mrhx-c7xc-m3w5, through the released API. The audit-first normal/release gate
still fails. On 2026-10-25 the user accepted this reproduced advisory as
non-blocking for this isolated validation-infrastructure change only, with
release qualification explicitly blocked. No new ignore or major-version
override is added. A fresh `pnpm audit --json` still reports exactly one high
finding (vulnerable Zod `<4.6.6`; patched `>=4.6.6`). The upstream API migration
must be qualified separately before release.

The metadata audit also finds a pre-existing Transcripts packaging violation:
LP-SPEC-011 requires Markdown as a host peer plus development build edge. With
the user's explicit approval on 2026-10-25, Transcripts now declares
`@lapis-notes/markdown: ^0.1.6` in both peer and development dependencies and
removes the runtime dependency. The exact `packages:check` reproduction moves
from one unsynchronized manifest to zero findings across all 13 packages.
The normal registry lock refresh changes only the Transcripts importer for this
correction; the semver development edge retains Markdown's prerequisite build.

After this correction, `pnpm ci:packages -- --filter=@lapis-notes/transcripts`
passes four tasks, including the prerequisite Markdown build and all 31
Transcripts tests, in run `lapis-plugins-validation-fae522fa-d7f3-4f49-9f7d-9bd86f43430c`.
The complete `pnpm ci:packages` rerun passes all 39 tasks and 831 tests in run
`lapis-plugins-validation-959fb417-937c-4271-9674-b70ee88b82ef`, snapshot
`a296dd7f6c12bb8976d9c29dbf4d389413c6f205`. Per-run `result.json` retains the
exact source revision, parents, tool identities and prerequisite archive hashes.

The final `pnpm test:storybook` rerun passes 266 interaction/accessibility cases
across four cold shards (58, 86, 53, 69) in run
`lapis-plugins-validation-2745f0aa-f1ff-491a-ac58-22bf7d37bf17`, snapshot
`74cc946d425673a9b442da1349a73cce564c2614`. There are zero functional or
accessibility failures in this documented source-archive graph.

Final npm-pack run `lapis-plugins-validation-83daa796-db69-409c-b387-504d53a436d5`
persists all 13 archives and their manifest under `.release_npm/` in its local
report directory. All SHA-256 identities were verified after collection. The
actual Transcripts tarball contains `dist/index.js` and `dist/index.d.ts`,
declares Markdown `^0.1.6` in peer and development dependencies, and has no
runtime Markdown dependency. Its SHA-256 is
`289256221d9ff2c2177421c940c0a78678f47469c619e939a66f3cde7fbd1e9b`.

Final routing review found the separate deferred `test:release:nostr` entry
still invoked Node directly. The public-lane regression now discovers every
non-visual `test` script: the exact `node --test
--test-name-pattern='public validation lanes' scripts/validation.test.mjs`
reproduction fails once before the routing correction and passes with zero
failures afterward. The deferred tooling suite now uses the same Docker default;
this does not enable its publication workflow.

The first complete tooling rerun then passed 136 of 137 cases: the static-release
workflow test still asserted the old direct Node command. The exact
`node --test --test-name-pattern='static qualification has no Community dependency' scripts/static-release-workflow.test.mjs`
target reproduced one failure. Its updated assertions verify both the Docker
entrypoint and the unchanged deferred command, and additionally exclude the
deferred suite from normal release-tooling and release-qualification lanes.
The exact target passes with zero failures after this correction.
The complete normal `pnpm test:release` rerun passes all 137 cases in run
`lapis-plugins-validation-d8d1af7a-4221-4b14-8519-83326b4249f6`, including
deterministic archive reproduction and signature tests with fixture keys.

The opt-in deferred Nostr suite is not qualified: all four test files fail at
startup because its scripts still import the deliberately excluded
`@lapismd/lapis-community` package. The unchanged direct Node invocation
reproduces the same four missing-package failures as Docker run
`lapis-plugins-validation-f1609d7b-352b-4e6c-8cae-8aaec9396b90`. This is a
Plugins-owned deferred Nostr prerequisite, outside the normal static-release
and catalog qualification lanes. Docker routing preserves the original failure;
no dependency is restored, no test is skipped and no Nostr qualification or
publication is claimed.

The final Docker runner/composition run passes all 47 cases in
`lapis-plugins-validation-1d25a4ec-2fdc-448b-893b-6f34326d1d12`.
Package metadata and boundaries pass in
`lapis-plugins-validation-fec43957-7deb-4aad-b810-e9187a0d06e6`.
The final static catalog builds successfully in
`lapis-plugins-validation-cb18049a-5c78-49d2-a19a-1b10b57bca6b`.
A hook-free frozen registry lockfile check also passes after the approved peer
correction. No visual baseline was created or replaced.

Clean Docker browser startup reproduced missing private Sync dependencies and
the History repository public subpath before any tests. The worker now performs
the same separate frozen Sync install as hosted CI and resolves the source-owned
History repository export explicitly. Temporary qualification supplies the
unpublished `@lapismd/jj-history@0.1.0` archive from the existing History migration
prerequisites; its exact SHA-256 is included in each run report. It is not a
registry-only pass. Published manifests and lockfiles remain registry based.

The required audit found patched upstream advisories in DOMPurify, Zod,
body-parser and fast-uri. Targeted registry resolution refresh retains existing
semver policy and advisory assessment; no new ignores are added. Mira consumer
versions resolve released 0.1.1 / 0.0.3 packages within existing semver ranges.

The clean browser consumer initially failed 6 of 7 focused stories against
released API 0.1.4 (missing embed registration and search-provider state). Notes
source contains those public contracts. Temporary acceptance now consumes five
Notes host archives built from source `dcba70cd48ae705e778b2d52ad02c70f3260c9e6`,
with provenance and SHA-256 identities in the worker report. This qualifies the
source integration only; registry-only delivery remains a separate release gate.

The exact clean transcript package build failed with five missing public-entry
findings: svelte-package defaulted to src/lib although the package owns src.
The package now declares its input/output roots and has an independent patch
Changeset. Static catalog construction retains the canonical 6144 MiB Node heap
inside the bounded container; the first unbounded default exhausted 4 GiB.

Current Design Core source acceptance uses a clean consumer-validated archive
from committed source `67eb392b` (excluding its ongoing dependency-refresh
working copy), SHA-256 `4db7d4f621d66f5d40110ddb87d423f34063a0731a811618aa6abdae7abe7658`.
This temporary qualification graph is recorded separately from registry-only
installation; tracked manifests and locks do not reference the archive.

Released Design Core reproduced the existing AuthorCard teardown warning in
eight Repository stories. The user requested that this remain a recorded
upstream blocker rather than extending this task into Design Core. Against the
committed-source archive above, the exact Repository/Transcript selection passes
17 of 17 cases and the complete catalog passes all 266 cases. This task makes no
Design Core source changes. A released upstream fix and registry-only rerun
remain prerequisites for release qualification; the source-archive result does
not waive that gate. Visual baselines remain unchanged and visual approval is
separate.
