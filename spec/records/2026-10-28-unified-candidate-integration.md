# Unified Mira candidate: cross-slice contract closure

The landed Reading Surface isolation scenarios and the landed File Properties
edit protection required two different Mira builds, and no archive carried
both: the documented R7 candidate (SHA-256 `03e15e02…`, built from
mira-mde `cb8f2b2b`) lacks the CodeMirror `isolation: "isolate"` stacking
containment, so cold shard 1 retained exactly two deterministic failures
(`Editing Search Settings`, `Editing Search Settings Dark`), while the
editor-surface build (`5df6b906…`, from main `082703eb`) lacks
`FrontmatterControllerCommit.previousRecord`, so every File Properties panel
commit refused its write. See
[File Properties restoration](2026-10-28-fileproperties-mira-candidate-restoration.md).

## Source integration (mira-mde)

The Mira owner duplicated the properties-edit-boundary line onto the main
lineage tip: `d24f79bf → 0fbf3d7a` and `cb8f2b2b → 5ee4c0e7` over
`082703eb`, with no textual conflicts; the merged tree is exactly the base
plus both source deltas. One semantic resolution was required (`13a93535`):
`082703eb` had recorded the MIRA-CSS-045 verification row in a standalone
table the canonical-matrix validator does not read, so
`spec-validator validate` failed with `SPEC-VERIFY-UNMAPPED MIRA-CSS-045` on
the base itself — reproduced byte-identically on the extracted `082703eb`
tree before integration. The row now sits in the canonical matrix with its
original evidence. Owner-lane evidence and the integration record
(`88ac686c`) live in mira-mde
`spec/records/2026-10-28-unified-candidate-integration.md`: Docker `build`
8/8, `lint` pass, `test` 520 package cases, `spec:check` and `spec:validate`
pass; native prettier, `turbo run check` 11/11, `turbo run test` 11/11,
spec-first over the merge diff (9 protected files, 3 canonical chapters),
and the six-tarball pack validation including leak, tsc-fixture, stylesheet
and prod-audit checks. The mira `check` lane's audit sub-gate fails on a new
low deepmerge advisory (GHSA-gcqx-w48m-w2h4 via `@sveltejs/vite-plugin-svelte`,
no patched release); the lockfile is byte-identical to `082703eb` and the
host reproduces the same single finding, so it is pre-existing and owned by
dependency consolidation.

## Archive identity and contract verification

`pnpm pack` in `packages/mira` at `13a93535` produced
`lapismd-mira-0.1.1-unified-13a93535.tgz` (343,772 bytes), byte-identical
across two packs, SHA-256
`012dcd4d6d21f043ed2e13d9a391e441cd6da0b376ec850216d7a3c852c8491a`. The
packed dist carries all three contracts:
`MiraMarkdownEditingSession.hold`
(`dist/extensions/markdown-editing.d.ts`,
`dist/preview/editable-markdown-preview/editing-session.js`),
`FrontmatterControllerCommit.previousRecord`
(`dist/preview/frontmatter/controller.svelte.d.ts`), and
`isolation: "isolate"` (`dist/internal/codemirror/base/index.js`). The
archive is stored under `.local/mira-candidate/` beside the preserved
byte-exact R7 candidate, and the ignored checkout hook pins it; committed
manifests and the lockfile keep registry ranges, and the lockfile was
restored to its committed bytes after each hook install (LP-SPEC-024).

## API archive repair (temporary validation setup)

Qualification exposed a second, Mira-independent archive gap: the pinned
sibling tarball
`../lapis-notes/.local/packages/lapis-notes-api-0.1.4.tgz` (built Oct 27
20:41) predates the inline-title alignment commit (lapis-notes `99c6012c`,
Oct 27 20:56) that the landed Reading Surface title-alignment stories
require. Earlier passing runs survived only through uninterrupted
`node_modules` link continuity from the Oct 27 19:55 install generation; a
fresh documented hook install downgrades the API and deterministically fails
`Editing Title Alignment`, `Source Title Alignment` and
`Editing Title Alignment Dark` (title/content offset 80.65625px;
`--ui-editor-inline-title-inset` never written). The failure reproduces
identically under both the R7 and unified Mira candidates, and the two
candidate dists differ only by the isolation rule, proving it
candidate-independent. The intact alignment-era extraction (pnpm variant
`9b960f8a`, byte-identical to variant `4f8a17a2`) was repacked byte-faithfully
with `npm pack --ignore-scripts` to
`.local/api-candidate/lapis-notes-api-0.1.4-alignment-9b960f8a.tgz`
(SHA-256
`3cf0894260d38d4b06d1022c121fe208bebc9740d16afe5dfd3d57f178358cf7`) and
pinned through the ignored hook. Owner: the lapis-notes publication
workstream must ship a released API containing `99c6012c`; the documented
pin is restored afterwards. No lapis-notes repository content was modified.

## Requalification (documented host environment, cold processes)

- `mira-frontmatter-contract.test.ts` **2/2** against the installed unified
  runtime, within the Markdown package **154/154** tests and passing package
  check.
- File Properties family **8/8**, including the three exact restored stories
  (before: 3/3 — no regression).
- Reading Surface **9/9**, including the two exact isolation scenarios
  (before under R7: 0/2 deterministic failures; standalone story files pass
  individually).
- Cold catalog shard 1 **76/76** (before: 74/76).
- Complete cold four-shard catalog **76 + 105 + 68 + 73 = 322/322** (before:
  320/322). Shard 4 needed one retry after a host-contention browser crash
  (`Browser connection was closed`); the crash point moved randomly across
  runs (`Embeds`, `sync/Settings`, `sync/History`, `LinkPreviewAcceptance`),
  every crashed file passes standalone, no assertion ever failed, and
  concurrent Storybook dev servers from another workstream were active on
  the host.
- Specification lanes: validate and spec-first pass over the record changes;
  Docker `spec:check`/`spec:validate` and based `spec:first` re-run after
  commit.

## Boundaries

The frozen lapis-notes qualified cohort is untouched; the unified candidate
matters for Notes only at publication/lockfile-regeneration time, where its
publication dependency (recorded in lapis-notes
`spec/records/2026-10-27-publication-readiness.md`) now also includes a
released API carrying `99c6012c`. Nothing was published, no bookmark moved,
and no visual baseline changed.
