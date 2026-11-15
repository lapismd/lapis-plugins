# Verified dependency-image migration

LP-SPEC-036 and LP-SPEC-051 move active CI, version preparation and static
publication from generated dependency digest pins to complete context identity
and verified signed receipts. The source-owned dependency Dockerfile/context
remain here. Lapis CI owns reusable identity, lookup, staging, attestation and
promotion helpers. Each selected image is immutable; every consuming job still
performs the exact candidate frozen root/private-catalog install.

The old pin data/updater helpers remain available for rollback and the excluded
deferred release route. This slice does not change native admission, package
publication/signing gates, parked packages or audit exceptions.

The resolver reads this public repository's attestations with ordinary
contents/package read authority. It does not require an added attestations-read
permission, preserving the deferred caller's existing permission ceiling.
Cryptographic verification and exact producer/source/input policy remain
required; warm hosted acceptance must prove this public-source read boundary.

Before implementation, `node --test scripts/dependency-image-adoption.test.mjs`
passed one frozen-install guard and failed two resolver adoption targets. The
repaired focused target passes 3/3. Publisher/receipt wiring and retained
rollback helpers pass 9/9. The first complete tooling run passed 225/230: three
existing tests still assumed inline digest lookup/native provisioning, and two
new pin guards rejected unpublished helper placeholders. Native provisioning
is retained, active lookup assertions now require the verified reusable
resolver, and all image actions are pinned. After the additional cohort and
required-check gate regressions, the final complete tooling run passed 232/232
with no failures. Superseded pin-PR proposal scenarios are
replaced by no-PR/publisher/receipt contracts; all five rollback helper tests
remain.

`pnpm spec:check` passes validation, book build and spec-first. Doctor passed ten
checks with the existing deliberate wrapper-alias warning. QMD semantic search
located the governing chapters. `pnpm audit` passed under the existing policy
with two LOW findings already ignored; no exception changed. Formatting passed
the workflows, specifications and authored contract tests; actionlint passed
every workflow.

All four shared actions use reviewed cohort
`617eb34fc337832401ef81feb9a2673033874e3b`. Complete source-context acceptance
passed with 29 files and identity
`sha256:9c0c69353a894334beadf69aa8bb8d69bbdba96ae8f8b05afbe2ba42b1572de3`.
It binds the exact Buildx 0.38.1/BuildKit 0.35.0 cohort as well as source inputs,
toolchain and platforms. The source-owned required `image-pin` check is retained
as an always-running gate after the reusable worker. Its exact regression
initially failed once, then passed, covering worker failure/cancellation/skip,
missing or mutable/wrong-scope references, unknown state and missing identity.
The active-consumer focused file passes 5/5. No branch policy was changed.

Cold local acceptance used a fresh tracked-source copy and a new container of
the reviewed base digest, without a project dependency store/image mounted:
`pnpm install --frozen-lockfile --prefer-offline` installed 1,164 packages across
18 workspace projects. The unchanged private-catalog command
`pnpm --dir packages/sync install --ignore-workspace --ignore-pnpmfile --frozen-lockfile --prefer-offline`
installed 576. Both passed. The first harness attempt lacked directory traversal
permission for the capability-dropped container; making only the disposable
public-source checkout writable repaired the same commands. Root and private
manifests/lockfiles retained exact hashes. The temporary checkout was removed;
logs remain outside the repository. Existing ignored dependency-build-script
policy was retained.

Hosted producer and cold/warm full-consumer acceptance remain pending until
actual signed receipts and runs are retained. The local install does not
qualify hosted signature lookup or the complete functional catalog.

## Historical pin qualification

These observations qualify the superseded pin architecture, not acceptance of
the current signed-cache migration:

LP-SPEC-036: The checked-in image manifest pins the shared multi-architecture base and last verified dependency image by digest. Focused release-tool tests prove a changed lockfile can generate the next dependency-only context while the verified pin stays active, and that the digest-pin update records the new lock hash, tag, and digest in that single manifest. Workflow source tests prove CI and release containers resolve the manifest output without duplicated digest edits. The publication workflow emits an SBOM, provenance, and an idempotent pin PR; `turbo.json` requires signed remote artifacts and bounded timeouts without an Actions `.turbo` cache. Live fork and unavailable-service fallback acceptance remains. Tool downloads preserve the pinned archive and use a bounded official asset-API fallback after transient failures; see [hosted CI repair](../records/2026-11-08-kanban-hosted-ci.md).

LP-SPEC-051: Nine executable workflow regressions cover stable rolling reviews across lockfile changes, open/terminal states, bounded legacy bot cleanup, unchanged pins, failed-publication preservation and main-only dispatch. See spec/records/2026-11-09-embed-heading-and-rolling-ci.md.
