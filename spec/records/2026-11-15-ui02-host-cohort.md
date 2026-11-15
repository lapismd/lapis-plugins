# API 0.6 / UI 0.2 plugin cohort

## Release boundary

Published API 0.6.2 requires UI 0.2.0. AI, CSV and Markdown still excluded that
UI cohort while admitting API 0.6. The package-catalog normalizer is the owning
source of those ranges. It now admits UI 0.1 and UI 0.2, and the shared catalog
uses registry API 0.6.2, UI 0.2.0, Workspace 0.4.4 and History 0.3.1.
Publishable manifests retain ordinary npm ranges. Patch Changesets cover the
three affected plugin packages; no already-published version is replaced.

The preceding release workflow 43692854488 was cancelled before signed
candidate preparation and publication. Both steps are recorded as skipped;
AI 0.1.14 and Markdown 0.3.0 remained absent from npm. The authenticated publisher
preflight had passed all 17 packages, but that does not prove this corrected
candidate has been published. Public signed releases and registry intake remain
separate gates. Notes' public App Profile follows this corrected plugin cohort.

## Focused regression

`node --test scripts/api-host-compatibility.test.mjs` initially fails the two
new AI/Markdown UI 0.2 cases while its 17 existing API cases pass. Updating only
the manifests is rejected by package synchronization, so the correction lives
in `scripts/package-catalog.mjs` and is propagated by `pnpm packages:sync`.
CSV consumes the same policy and is included in the expanded regression.

The final exact peer/publication target passes 24 tests, zero failures. It
retains UI 0.1 admission and the existing API 0.2/0.4 checks. No assertion is
removed to admit the new cohort.

## Qualification

The final Docker `pnpm ci:release` passes audit, package policy, specification,
ownership, all 51 package check/test/build tasks, 231 release/tooling tests,
1,478 package tests, npm packing, archive construction/verification and the
static Storybook build. Audit has zero unignored findings and retains its two
existing ignored low findings. Receipt:
`.local/validation/runs/lapis-plugins-validation-ece7a804-729e-40ad-910d-7570e48b8e7e`.

The source was rebased onto main `af41cbcb` after that aggregate. The intervening
main changes are the already-qualified parked Sync Rust/TypeScript slice and
History publication evidence. Active package source, scripts, manifests and
lockfile are unchanged between the two base revisions. The exact peer target
passes again; the cold full browser suite runs on the combined main source.

Spec-validator 0.2.0 is the latest registry release. Doctor passes its checks
with the existing script-alias warning; QMD semantic discovery works.
No visual baseline is changed or approved.

The complete cold browser interaction/accessibility lane on rebased source
passes all 449 cases across eight batches, zero failures. Receipt:
`.local/validation/runs/lapis-plugins-validation-40662cb7-e99e-4b77-8f33-5b8ba02cbb3a`.
The final specification aggregate passes all three lanes. Local qualification
is complete; the submitted source still requires PR CI, versioning and the
protected public release workflow.
