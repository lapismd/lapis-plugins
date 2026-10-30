# Bases filter combobox names

Last updated: 2026-10-25 20:35:56 UTC.

Status: verified source slice; the user accepted the explicitly recorded
unchanged baseline findings for this commit, with later host/release gates separate.

## Original regression

Notes full catalog run `0f1d4d8e-57fa-4513-9cb2-95c45d0784a4` reports
three Bases accessibility failures: Views/Editable Cells, Workflows/Query
Controls, and Shell/Desktop. The group-match and operator Select triggers have
visible option text but no explicit accessible name after Bits UI's trigger
adopts the combobox role. The separate API/Select story has one obsolete role
query; its repair belongs to Notes.

This is a source naming defect. Axe 4.13's button-name check calls subtreeText,
which returns no content name for combobox controls. Waiting for a closing
popover does not provide the missing purpose name.

## Source change

The production Bases group Select is named `Filter group match`; every operator
Select is named from the current property and `filter operator`. Existing
Editable Cells and Query Controls browser plays now find these controls by their
public combobox role and purpose names while retaining all interaction, geometry
and accessibility assertions. No public API or dependency range changes.

## Qualification

The isolated workspace starts from Plugins
`aefc404867fe9d5c3a54294539889b90a6db64ff`; the default checkout's independent
Markdown, PDF, lockfile and specification work is preserved.

The exact source command selects Editable Cells, Query Controls and Desktop
across the three owning families. Four cases execute; eight unrelated cases are
skipped by that explicit filter. Before run `e9ad3339` retains unchanged product
controls and the stronger plays: one pass and three failures. Final cold after
run `31330505` passes all four, with no interaction or accessibility failure.
Intermediate runs `b36e1f85` and `e3ec850c` each pass three cases and expose an
ambiguous new property-option or placeholder query. The final play follows the
actual trigger-to-popup and input-to-list `aria-controls` relationships before
choosing the exact property. It preserves the context-name update assertion.

The first source install `e27e6666` stops before tests because the retained
registry graph's Bits 2.19.5 patch is unused by the explicit repaired 2.20.2
archive. An approved ignored launcher reuses the source runner, lease, resource
and report path while adapting only the staged installation bootstrap. It
requires the exact repaired Bits archive SHA-256 `7b0fea71`, omits the superseded
mapping only during installation, then restores and SHA-256-checks the original
package manifest, lockfile and workspace YAML before validation. Every subsequent
result retains this restoration receipt. No source patch, ordinary registry
fallback, unused-patch guard or production runner policy is removed. This is
temporary source-archive qualification, not a frozen-registry claim.

Package run `3991222e` passes all 45 build/check/test tasks across 15 plugins:
969 unit cases including 164 Bases cases. Full catalog run `a6700698` then finds
one additional failure in Registry Screenshots/Grouped List: unnamed grouping
and property-sort directions. Its four shards total 283 passes and one failure.

The complete Bases source audit covers all nine Select triggers in seven
components, including data-driven view options. Filter, group/sort directions,
summaries, layout and dynamic option names now have explicit purpose labels;
property-specific names retain current context. The unreferenced standalone
group control receives the same grouping name. Existing runtime families cover
filter context updates, both grouped-list directions, Layout, Tone and both
summary controls without bypassing real selection actions. Cold exact run
`1656e7d5` passes all seven selected cases; nine others are explicitly filtered.
Final owner checks and complete catalog must rerun for these expanded inputs.

Fresh registry-graph audit reports one high and zero critical findings:
GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404, Zod 3.25.76 through root >
`@lapis-notes/api` > zod. It reproduces using immutable parent `aefc4048`'s
byte-identical package manifest, lockfile and workspace YAML, with the same 1,189
dependencies. Notes API owns its Zod 3 range; the patched version requires a
major upgrade to Zod 4.6.6 or newer. No dependency change or audit suppression
is included here. Fresh acceptance was pending at this stage; the final limited
acceptance below applies to this slice rather than an earlier unrelated waiver.

Canonical governance, final packed/runtime and downstream consumer acceptance
remain separate gates. Visual baselines and publication remain unchanged.

## Complete source and artifact result

Final catalog `743dd249-0d2e-4703-981b-688a30ee6c7f` passes all 284 cases in
56 families across four fresh shards: 60, 98, 55 and 71. The expanded seven-case
regression and every public Bases source input remain unchanged afterward.

The separate generated CSV metadata ordering prerequisite moves only one
development dependency key; all parsed JSON values are equal. Its exact source
checker improves from one failure to zero, preserving the dirty default lock.

Combined source/artifact run `c87573e6-65fe-45ec-a817-2825e4b4e3b5`, exact
snapshot `5b6a1e56dce89380daa2b30de7249ee33e25bfe4`, passes all 140 release
tooling tests, all 45 package build/check/test tasks (969 unit cases), all 15
package manifest/documentation/boundary checks, all 16 registry metadata checks,
App ownership, both slices' spec-first checks, normal Bases and CSV prepack/
publint, and the complete static Storybook build. Package checks reuse qualified
cache results where inputs are unchanged; the npm packages are built normally
inside the isolated worker before packing.

Its Bases npm archive has 157 public files and SHA-256 `02b2392b`. Two complete
runtime builds and their normal public payload verification produce identical
payload SHA-256 `731176d3`. Test-only Ed25519 signed bundles reproduce exactly
and pass the public signature/file verifier; the signed archive SHA is
`826f5c0a`. The ephemeral private key is removed and checked absent before the
static build. Public trust metadata, signed envelope, files, npm archive and
same-source receipt are retained together. This is test-only consumer evidence,
not release signing or publication. The earlier provisional archive `2c25bef8`
has the same 157 paths and byte-identical public entries; its compressed archive
identity remains separate.

The validation-only staged helper runs independent normal commands after the
unchanged release-tooling suite. It records failures, continues unrelated checks
to complete evidence, then fails the overall run; it does not change a tracked
checker, assertion or gate. Two normal commands remain failed:

- `pnpm check:no-tailwind`: four existing CSV class findings, `opacity-0`,
  `group-hover:opacity-100`, `overflow-visible` and `group`.
- `pnpm spec:check`: the existing missing Markdown asset-lease record link and
  the CSV Registry Screenshots family's missing coverage declaration.

Both specification findings reproduce in isolated immutable-parent run
`7af531fd-4d3c-496f-bd23-ce227ccaeb0b` with a byte-identical `aefc4048` source
tree. The exact style checker also reports the same four findings there. A fresh
final audit still reports the single high Zod advisory above. On 2026-10-25 the
user explicitly accepted exactly the one high Zod advisory, four existing CSV
style findings and two existing specification findings for the CSV ordering and
Bases label commits. The normal checks still report those failures; this limited
acceptance does not qualify registry-only installation or publication, add an
audit ignore, weaken any checker or cover future findings. No earlier waiver is
reused. The later default Markdown lease implementation
and its evidence remain a separate source change and have not been copied here.

Source records, original and host-path-projected portable manifests, independent
check statuses and reports remain under the ignored `c87573e6` run directory.
Final consumer, native, registry-only, visual and release qualification remain
separate. No screenshot baseline, default workspace source, lockfile, production
signing credential or public release is changed.
