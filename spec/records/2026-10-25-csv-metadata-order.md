# CSV generated metadata order

Last updated: 2026-10-25 20:35:56 UTC.

The exact source boundary is `node scripts/sync-package-metadata.mjs --check`.
It fails once on immutable parent `aefc4048` with
`packages/csv/package.json is not synchronized`. The same failure stops the
normal `packages:check` gate after all 140 release-tooling tests pass in the
separate Bases qualification run `a24a0a40`.

The isolated correction moves `@types/papaparse` after `@tsconfig/svelte` in
`devDependencies`, matching the existing generator. A complete deep comparison
of parsed JSON before/after proves all values are identical. Package version,
runtime code, dependency versions, public contracts and lockfile bytes are
unchanged. This is generated metadata ordering, with no release-version intent.

The default checkout's dirty lockfile and unrelated source work are preserved.
Final canonical, package and shared source gates run with the Bases descendant.
The inherited Zod advisory remains recorded separately; no existing waiver is
reused. The user explicitly accepted the one high Zod advisory, four existing
CSV style findings and two existing specification findings for this ordering
prerequisite and the Bases labels commit on 2026-10-25. The checks retain those
failures; this limited acceptance does not waive future findings or release gates.

The exact checker passes all 15 package manifests after this ordering repair.
Combined descendant run `c87573e6` passes all 45 package tasks, 140 release-tooling
tests, package/docs/boundary/registry checks, App ownership, normal CSV prepack/
publint, both slices' spec-first checks and static Storybook. Runtime source and
all dependency versions remain unchanged. Separate unchanged CSV style and
canonical baseline findings are recorded with the Bases source receipt; neither
those findings nor the audit advisory is silently waived.
