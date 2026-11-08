# Bases Activity sticky borders

Design Core PR #65 gives each Activity lane heading its own themed top border
while stuck, overlapping the day edge at rest. The source repair and regression
live in Design Core; Bases consumes its public Kanban family without a CSS
override.

## Candidate acceptance

The new Bases Activity play checks the solid 1px top border and its themed
colour while the headings stay at the owned Shadcn viewport's top after
scrolling. File-backed detail activation still passes after returning to the
top.

- Exact Activity target: one passed, five filtered out; remote Docker receipt
  `lapis-plugins-validation-e4bc1f74-407a-4379-9f33-c8c17e462cd8`.
- Complete Bases family: 25 passed across seven files, zero failures; receipt
  `lapis-plugins-validation-9cfabda1-d972-41ac-a563-6de1c23ecd5c`, source
  `25851ba44cf90169451993b042fe9f9b3f8158f4`.

These runs use the prepared Core candidate with SHA-256
`0766a5db3922a9aaa2af4d8722d61baa8ad017830c317a075d049f4be9f84c0c`.
Storybook 6006 was cold-restarted with that archive installed through pnpm for
review; source manifests and the lockfile remain registry-based. This temporary
candidate setup is distinct from released dependency qualification.

The owning Core source passes complete checks: 1,128 unit cases, 1,055
Storybook cases, all workspace/shell/AI browser cases and 196 Shadcn browser
cases, with the existing single Shadcn skip unchanged. No visual baselines
changed.

## Registry integration

Core 0.12.1 is released from `dffa9aeade1f34f647502135edd6704d01076a4e`.
Source PR #65 and version PR #66 passed their hosted checks before merging;
exact-main CI `42476797416` and release workflow `42476797659` pass, including
the fresh installed-package and provenance checks. The release is available at
<https://github.com/lapismd/design-core/releases/tag/design-core%400.12.1>.

Bases and the catalog require registry `^0.12.1`; History retains its full
supported range and its lockfile resolves the same 0.12.1 provider. No unrelated
package versions changed. The frozen local install passes, and Storybook 6006
was cold-restarted on the registry graph with the candidate audit projection
set aside.

Exact registry-only Activity acceptance passes: one case, five filtered out;
receipt `lapis-plugins-validation-f9eb5d20-3a8c-4598-980d-33c2cfaeacbd`, with
an empty candidate-archive inventory. Full consumer checks are pending.

The first registry package lane passed all 51 package tasks, 190 tooling cases,
17 npm packs, 17 payload verifications, audits and static Storybook; receipt
`lapis-plugins-validation-b54c3182-9b79-4a66-8aaa-d6ecdc99ecfb`, source
`6a487e5715aeea7a5aa6301f638edcbf38fbcb50`, with no candidate archives.

## Combined dependency cohort

Dependency PR #61 merged into main as
`f6c6f810a4954435d463cab2d43e151850ff6cec` while final acceptance was running.
The superseded Storybook run
`lapis-plugins-validation-c7bc47ad-0bd0-4984-96ed-8f566c1aa69f` was stopped
after four complete shards (171 passing cases and zero assertion failures)
so the combined source could be qualified instead.

The integration preserves main's dependency changes and pending Changeset,
keeps the catalog/Bases minimum at `^0.12.1`, retains History's supported
compatibility ranges and regenerates the lockfile. Every updated public plugin
resolves Core 0.12.1; the separate Sync cohort is unchanged. Frozen installation
passes and no plugin package versions change. Storybook 6006 was cold-restarted
on the combined registry graph. The resolved feature tree was preserved with a recovery bookmark, then
restacked as a single-parent change on that merged-main revision. Tree equality
was verified before regenerating the lockfile from main with pinned pnpm. This
removes incidental formatting churn and keeps already-merged dependency changes
out of the feature comparison. The original eight spec-first findings are now
zero; validation, mdbook and spec-first all pass without exemptions or chapter
filler. Spec-validator 0.2.0 doctor passes with the existing script-wrapper
warning, and QMD semantic search returns the Bases and registry-media chapters.

Plugin package versions remain unchanged; the existing Changeset is retained
for a later release. Plugin publication is outside this merge.

## Restacked final qualification

The first combined package run found one History type failure: the lockfile
retained Core 0.12.0 for History while the host used 0.12.1. Refreshing compatible
Core resolutions within the existing manifest ranges repairs that mismatch;
History's exact Svelte check now reports zero errors and warnings.

- Final registry-only `pnpm ci:release`: passed all 51 package tasks, 190 release
  tool cases, audit/spec/App-ownership gates, 17 npm packs, 17 payload
  verifications and the static Storybook build. Receipt:
  `lapis-plugins-validation-5272a5aa-da7e-4951-95d2-4b243a6601a0`.
- Final `pnpm test:storybook`: all eight shards passed, 271 cases passing, zero
  failures, 57 existing skips across 64 files. Receipt:
  `lapis-plugins-validation-a2693047-4653-497e-82f2-102aed641651`.
- Both full runs qualify source `40f5d3e8b6bc86a08b0f55c5dcae5db0c18dd629`,
  based directly on main `f6c6f810a4954435d463cab2d43e151850ff6cec`, using
  remote Docker on omarchy with four CPUs and 12 GiB. Candidate archives: `[]`.
- The preceding exact Kanban family passed all six cases; receipt
  `lapis-plugins-validation-6d8871ad-3ec3-4f78-8979-4bbc355979f8`. The final
  full run repeats all six against the refreshed dependency cohort.

This receipt-only update follows qualification. Hosted CI must pass on the
resulting pushed head before merge. No tests, audit policy or visual baselines
were weakened; plugin versions remain unchanged.

## Released embedded-board landmark prerequisite

Design Core PR #67 repairs the board's nested main landmark and is released as
0.12.2 from `7208808e556ac6c5a4330f3e77d862c1a9343fa6`; release run
`42525186187` passes publication, clean install, integrity and provenance. Its
source, version and fresh main checks are green. Root and Bases declare
`^0.12.2`; other compatible plugin ranges, including History's union, remain
unchanged. Pinned pnpm 10.34.5 regenerates the registry lockfile and frozen
installation passes. The resolver refreshes compatible transitive packages and
the retained 0.9 Core cohort to 0.9.1; the independent Sync graph is unchanged.
Registry-only qualification follows before the new exact PR head is merged.
No plugin version, publication or registry dispatch is authorized here.

Registry-only `pnpm ci:release` passes on omarchy (4 CPUs/12 GiB), source
`f2e6f1c20ca82153b32993f7f9c9157784f2a51c`, receipt
`lapis-plugins-validation-0d4af5a5-6b00-4c24-b69b-5739b9843482`. All 51 package
tasks, 190 tooling tests, audit/specification/App-ownership checks, 17 npm packs,
17 verified payloads and the static Storybook build pass with no candidate
archives. The focused Bases browser family and new exact hosted head follow.

The complete Bases browser family passes 25 cases with zero failures against
registry Core 0.12.2; receipt
`lapis-plugins-validation-df4d08d4-6146-464c-93cb-57c6d6704188`. This qualifies
the released renderer integration independently of the earlier archive target.
The receipt-only commit update follows these runs; hosted required checks must
pass on the resulting new exact feature head before merging PR #62.
