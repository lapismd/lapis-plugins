# Plugin checks and dependency qualification

## Reproduced boundaries

- `pnpm --filter @lapis-notes/ai check`: three Svelte type errors.
- `pnpm --filter @lapis-notes/graph check`: two Svelte type errors.
- `vitest run --project storybook --no-file-parallelism stories/plugins/markdown/panels/Backlinks.stories.ts`:
  seven passing stories and 18 fatal `derived_inert` teardown errors.
- `pnpm audit`: 27 findings (one critical, 11 high, 11 moderate, four low).

The type failures cross the public Markdown embed boundary. Locked CodeMirror
peer versions produced separate nominal API class declarations. Dependency
deduplication must make those plugin peer contexts coherent; casts and aliases
do not repair the package graph.

Bits UI 2.19.5 retains a Link Preview document listener when content is absent
and does not cancel its delayed selection read during teardown. The current
upstream source also retains these paths. A local, unpacked dependency candidate
reuses the existing selection-timeout fix. The user explicitly approved the
scoped exception to extend the retained lifecycle patch to 2.19.5. Its cold
Backlinks candidate run passes seven stories with zero fatal errors. The
lifecycle regression inventories every resolved Bits UI version and requires
its tracked patch and locked hash, rather than hardcoding obsolete versions.

## Audit decisions under LP-SPEC-048

Fixable findings use bounded workspace overrides and registry versions. The
audit remains mandatory. Two additional unpatched advisories use recorded CVE
exceptions, alongside the existing adm-zip exception:

| CVE            | Dependency path and exposure                                                                                                                                                                                                                                                                                                                                                               | Removal condition                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CVE-2026-93687 | Changesets config → micromatch → braces 3.0.3. The attack requires deeply nested brace patterns; this repository's checked-in Changesets `fixed`, `linked`, and `ignore` arrays are empty. These are repository configuration inputs, not registry plugin metadata or application user input. No patched release exists.                                                                   | Remove the exception when Changesets/micromatch can resolve a patched braces release; reassess before adding Changesets glob patterns.                      |
| CVE-2026-97058 | Changesets package discovery → read-yaml-file → js-yaml → argparse and API → Transformers → ONNX Node runtime → global-agent → roarr → sprintf-js. The attack requires attacker-controlled precision in a format string. The argparse templates and global-agent logging format strings are dependency-owned; external values are formatting arguments/context. No patched release exists. | Remove the exception when both transitive paths resolve a patched release; reassess if application code exposes logging format strings or calls sprintf-js. |

These exceptions retain residual dependency risk. They do not claim that the
underlying vulnerabilities are fixed. Registry metadata is not evaluated as
Changesets configuration or a logging format string.

## Temporary Community acceptance

The Community schema library remains unpublished and behind the framework
publication gate. An ignored pnpm hook installs its verified candidate tarball.
The portable lockfile records its registry coordinates and the candidate's
integrity, without a local path or hook checksum. The approved framework
publication must publish those exact bytes before the frozen CI install can
succeed from the registry.

## Results

- AI and Graph checks: five type errors before deduplication, zero afterward.
- TypeScript-only packages retain the TypeScript checker correction; all 12
  active package builds, checks and unit suites pass (36 tasks, 772 unit tests).
- Root `pnpm check`: 13 tasks pass, including the Markdown provider build;
  metadata, App ownership and native-CSS audits pass.
- Lifecycle wiring: one failing regression after dependency refresh, one pass
  after inventorying and patching the actual resolved versions.
- Backlinks cold acceptance: seven passes and 18 fatal errors before the fix;
  seven passes and zero errors with the tracked 2.19.5 patch.
- Font readiness: two deterministic failures before the repair, three passing
  tests afterward; the cold Markdown Lint Overview target passes.
- Release tooling: 95 tests pass. Both specification checks and formatting pass.
- `pnpm audit` exits zero with no actionable advisories. Three vulnerable
  dependency findings remain covered by the recorded unpatched CVE exceptions.
- Frozen lockfile-only validation passes without a checkout hook. A complete
  registry install still requires the approved Community library publication.
- The static Storybook build passes. Packing produces 12 npm tarballs; all 12
  deterministic runtime payloads build, reproduce byte-for-byte and verify.
- Complete `pnpm test:storybook`: 175 stories pass across four fresh shards
  (49, 60, 37 and 29), with zero functional, accessibility or fatal runtime errors.

These are local qualification artifacts. Production signing, publication,
registry deployment and visual-baseline changes remain gated. The broader
static-registry and framework candidates retain their separate qualification
work; this test-repair slice does not waive those gates.

The first complete Storybook rerun passed shard 1 (49 stories) and exposed one
shared font-readiness failure in shard 2 (59 passes, one failure). Its cold
Markdown Lint Overview target passed in isolation. Deterministic font-loading
regressions reproduced two failures before the readiness repair: a face added
during loading and fallback availability without a registered catalog face.
The shared host now waits within five seconds for actual loaded faces and
preserves download and token failures. The complete lane was rerun because this
setup is shared by all stories; its final four shards pass all 175 stories.
