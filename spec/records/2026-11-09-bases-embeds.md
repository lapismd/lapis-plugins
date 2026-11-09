# Bases Markdown embeds

## Behaviour

File and fenced embeds render a bounded read-only Bases pane with the real
view toolbar, view selection, Search and Filter. Source bytes are retained;
creation and view-editing actions are hidden. File names appear in a hover/focus
corner Badge, flush to the bottom and right and rounded only at the top left.
Invalid YAML uses the released destructive Shadcn Alert with a Lucide icon and
a disposable mount. Read-only dates have property-derived accessible names.

The Markdown story now leaves its populated views mounted after proving
resource cleanup. Its separate registry fixture contains 40 realistic records
and seven additional List properties, grouped by configured status. Metadata
pairs wrap within the viewport, maintain label/value baseline alignment, and
retain usable numeric and short-text widths plus bounded long values. Embedded
record separators span the pane while hierarchy indentation sits inside each
row. The story checks a 360px pane as well as the full width. Table tracks share
the body surface. Kanban and Activity each render file and fenced examples.

## Before and after

- The exact Markdown Embed story initially failed once because its play cleanup
  left the rendered surface blank: `lapis-plugins-validation-0c73b217-aa6a-4a12-aae6-6a17e507c623`.
- Restoring populated content exposed a zero-height embed host and three unnamed
  disabled date fields. The bounded host and date labels repair those source
  defects without suppressing axe.
- Enabling the actual toolbar exposed a default List filename-search failure.
  Empty-order Lists now project and search their displayed filename identity.
- Two Board/Activity Embed story cases exposed duplicate IDs and landmarks in
  released Core 0.12.2. The owning repair is Core PR #69, exact head
  `3c06d3d4a5f7ced64f9bea73d94c99d29cee55d0`; its full source checks and hosted
  run `42540558765` pass.
- Broader Bases acceptance found three cases: Grouped List baseline drift,
  short List values wrapping, and a Notes filter test deriving data identity
  from a DOM ID. Definite value limits preserve the original baseline and
  one-line numeric/short-value assertions; wrapping replaces the former
  mandatory single-row metadata assertion under the user's updated contract.
  The Notes scenario uses the existing data identity helper. These three
  regressions pass, followed by all 31 Bases stories in
  `lapis-plugins-validation-4ed8ebe1-7d25-4952-bfd4-b303fdf4bb9c`.

## Qualification boundary

Heavy checks use isolated Docker on omarchy with 4 CPUs, 12 GiB and serial
expensive lanes. Temporary candidate installation verifies the Core archive's
SHA-256 before replacing the isolated install graph; source manifests and lock
are restored before checks. No dependency node_modules source, local source
alias, manifest link or package patch was changed.

Candidate: `lapismd-design-core-0.12.2-built.tgz`, SHA-256
`03ce34d416e5ae8989fc1a07b7248cc1f376960fb52cf9f17bb08c991c058186`.
This contains the proposed Core 0.12.3 fix but is not that registry release.
Root/Bases ranges and the frozen lock must take the released patch before
registry-only CI, merge and the approved plugin publication.

Package receipt `lapis-plugins-validation-051a881b-249c-4a27-8f69-60460e298171`
passes the exact three Embed stories, full ci:release package gates, 51
build/check/test tasks, 193 tooling tests, 17 npm packs and deterministic plugin
payload verification, and a cold static Storybook build. Audit passes under the
existing committed policy: two low findings remain ignored under the retained
2026-10-29 unpatched-advisory assessment; no exception was added or broadened.

An unsharded exploratory full-catalog invocation then stopped with one browser
RPC transport error after 218 cases passed; 25 reported skips and remaining
files were not qualified by that aborted run. The repository's canonical
eight serial shards bound browser lifetime. No assertions, timeouts or product
coverage were disabled to address that invocation error.

Canonical browser/media receipt
`lapis-plugins-validation-f7343e91-5b92-45e0-bb1e-b7ed2d910003` passes all eight
serial shards: 277 interaction/accessibility cases across 64 files, with the
existing 57 `sync-unfinished` cases skipped under the retained private Sync
policy. There are zero assertion, accessibility or browser transport failures.
It rebuilds the cold static catalog, regenerates all 28 declared Bases WebPs
and passes seven deterministic media checks. Gallery entries remain the five
curated cards, including Kanban and Activity. Generated metadata validation is
kept separate from publication.

Package source snapshot: `4a63ce636c77253c3c5be23a4674d6590433b993`. Browser/media source snapshot:
`2646130fbb281943c55dda0466015e74323b4fe9`. Their complete Bases runtime and Storybook trees match the committed
slice; later changes are specification evidence and generated media only.
The source/candidate lanes do not claim registry-only CI or publication.

Visual Delta baselines remain unchanged and stories retain visual-pending.
Both repositories use the latest Deno-free spec-validator 0.2.0. QMD search and
doctor pass with the existing wrapper-script alias warning retained.
