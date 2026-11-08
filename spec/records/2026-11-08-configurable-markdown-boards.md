# Configurable Markdown boards and inline editing

Bases supplies independent Kanban and Activity layouts for arbitrary indexed
Markdown files. Grouping, optional anchoring, title, chip, description, tags,
badge and Activity-date mappings live in Edit current view. Hidden mapped
properties participate in projection and invalidation. Column predicates remain
independent of document and view filters.

Cards use body excerpts when no description value is mapped, render metadata in
an ordered two-column grid, and open the registered Markdown file surface.
Contenteditable title saves and body persistence are guarded. Successful state
changes retain the open detail and update its paint. The Markdown provider maps
preview, editor and live-preview widget backgrounds to the host surface.

## Regression evidence

Command: `node .local/kanban-validation/run.mjs test:storybook stories/plugins/bases/kanban/BasesKanban.stories.ts`.

- Initial focused result: four passed, two failed (Notes and Tasks), with four
  protected-file editing errors. Same-path surface retention removed the
  editing errors; an explicit Tasks anchor makes its reference lane available.
- Settings acceptance exposed None reverting to Automatic because the shared
  config setter treats null as removal. The owning view now retains explicit
  null, with persisted None and subsequent regrouping covered in Notes.
- The Projects live editor reproduced one white frontmatter widget despite a
  matching editor shell. Mapping the existing Mira widget token fixed its
  effective background. Projects now checks collapsed/expanded properties and
  its rendered heading; all reference editors check their widget paint.
- Final focused result: six passed, zero failed. Receipt:
  `lapis-plugins-validation-a07ef910-7d4d-48df-b320-c172825a2694`.
- Tasks proves a move to Ready persists the phase, retains the dialog and updates
  both detail-card and Markdown paint. Roles, Notes and Tasks exercise actual
  vault body and title saves. Scroll proves both horizontal and vertical
  overflow, and Activity retains invalid/missing dates under Undated.

## Remote qualification

Full validation runs on Docker context `omarchy`, bounded to four CPUs,
12 GiB RAM and 8 GiB shared memory. The worker retains security overrides and
existing audit policy, checks imported source identity, and uses an empty child
working copy for release-source resolution. Node's default heap is bounded to
half the container RAM, capped at the existing 6 GiB CI budget. Audit, source
identity and resource-policy regressions pass (30 focused tests).

The full package lane passes all 51 build/check/test tasks, 169 release-tool
tests, specification checks, App ownership, native-CSS checks, package metadata
and public boundaries. Seventeen npm archives pack and seventeen runtime payload
archives verify. The audit reports zero unignored advisories; its two existing
ignored low-severity findings retain the unchanged repository policy.

The static Storybook build passed. Full release-preparation receipt:
`lapis-plugins-validation-c0c22f9c-e6c1-4767-998d-0518012e5ea6`, source
`fbc17887ee2e6a75bf799b3ef523a37861060b19`. The full eight-shard
interaction/accessibility lane passed: 271 passed, zero failed and 57 existing
skipped cases unchanged across 64 story files. Receipt:
`lapis-plugins-validation-b63c8a61-3d56-44f4-8dc4-935759083af8`, source
`4a9e3f42b719ebe2fa694e6100d0b86140a982ba`. All six Kanban stories pass
in that full run. No visual baselines were changed; the stories remain
`visual-pending`.

## Dependency and release boundary

Design Core owns the shared UI and is committed as `658f2858`. Consumer
acceptance uses its prepared candidate archive with SHA-256
`eee51eee8c1633d4a187f951f4c161868fce4993bae46694765e13e3f4278ce9`.
The canonical archive input is temporary and private to validation; committed
manifests and lockfiles retain registry ranges. Bases now declares the existing
CodeMirror lint host module required by its control dependency closure.
The registry lockfile remains unchanged.

These are source and consumer-validation receipts. Production signing,
publication, native-service qualification and the released Design Core range
upgrade remain separate gates.

## Pull request integration

The review branch is rebased onto current main
`0d52829638fa55a9a74650db7ccebfa14833007b`, preserving the completed document
release and packed-DOCX repairs. Its three-way documentation resolutions retain
both sets of requirements and verification rows. The debug log remains outside
the review branch, and one minor Bases Changeset describes the complete feature.

The rebased six-story acceptance passes with published History 0.1.0; only
Design Core uses a candidate archive. Receipt:
`lapis-plugins-validation-39cf9804-9385-4bb7-8ead-0b3d9dea080c`.
Design Core PR #63 now contains the complete prerequisite UI, at
`5c8cebba8e98bc348f8c13a629e662fe91a7a69e`. The user approved merging after green checks and completing its prerequisite
minor release on 2026-11-08; registry-only consumer qualification follows that
publication.

## Activity and property-picker review

Group by and all mapped-property settings now compose the same private searchable
Bases property picker, with shared outline buttons, property icons and display
names, keyboard focus restoration, and an accessible clear action. View settings
retain existing fallbacks and filters. Activity consumes Core's sticky lane/date
headings and reference-style date labels through its public export.

The Notes story originally failed once because Group by had no property search;
the first repaired run exposed one missing Command input name, now supplied by
the Command root label. The exact Notes regression now passes with zero failures
and checks the borders, property search and selection, clearing to the chip's
Title fallback, and persisted grouping. Receipt:
`lapis-plugins-validation-21709b6f-a7ba-4c95-9a20-a7f6c29ca3bf`.

All six Kanban/Activity stories pass against the fresh prepared Core archive,
SHA-256 `327a71444cf63c33819cf5ab28120295d437f6a281324941e1770aa2b2d8fb02`,
receipt `lapis-plugins-validation-59df8245-a3cc-462f-b9ed-950667f0b6b6`.
This is candidate-archive evidence; the final integration will use the released
registry version. Storybook on port 6006 was cold-restarted from the isolated
review workspace and visibly shows the updated Activity and bordered settings.

The expanded candidate run passed all 51 package build/check/test tasks, 169
release-tool tests, audit, ownership and specification gates, all 17 npm packs,
17 verified plugin payloads and the static Storybook build. Receipt:
`lapis-plugins-validation-af176fd3-02fc-4ba4-befd-acac3e4f3673`.
All eight Storybook shards passed: 271 passed, zero failed and the same 57
existing skips across 64 files. Receipt:
`lapis-plugins-validation-b29d8b5c-0644-46a5-b156-e2eb1517b981`.
`pnpm spec:check --base main@codex-https --head @` passes for the full review
diff, including distribution, native-boundary and Changeset governance.

## Released registry dependency

Design Core PR #63 merged as `3e3717428fe76f1273993e6037f5ca2ff58a9bea`
after all hosted checks passed. Version PR #64 merged as
`a608cb584e285b75faa69a04cd36e5ad52f4acfe`, also after all hosted checks
passed. The approved 0.12.0 release completed in workflow `42449414844`,
including clean installation, integrity and npm provenance verification;
exact-main CI `42449414513` passed. The protected npm-production approval was
applied only to this authorized deployment, preserving the environment rules.

npm initially returned 404 while its acknowledged upload was being processed;
verification waited for visibility without changing assertions or policy.
The verified release is
<https://github.com/lapismd/design-core/releases/tag/design-core%400.12.0>.
The registry integrity is
`sha512-rARPr30oB9ZpXAstW1VE/O5X1G8L1BKlarsh7qBTLI4/kSKu/a3WzSdxqUyggON4HxbcgiycZc56oxESuZjIXA==`.

Bases and the root catalog now require `^0.12.0`, and the normal pnpm lockfile
resolves the published package. A frozen local registry install passed and the
review server was restarted against that graph. Final remote qualification uses
an empty archive inventory (`[]`); candidate-archive receipts above remain
historical evidence only. Registry-only full qualification passed as recorded below.

The registry-only focused Kanban family passed all six cases with no candidate
archives, receipt `lapis-plugins-validation-1c4a0fad-1bcc-469f-b6d0-33cf07176d2c`.
The first full registry run exposed one strict History settings-page type error,
receipt `lapis-plugins-validation-4bf32d7e-1259-4bd1-b81c-4eb628e73308`:
`packages/history/src/lib/repository/components/repository-status.ts:59:9`
(`pnpm --dir packages/history check:svelte`) rejected Core 0.10.1 controller
identity against the host's Core 0.12.0 controller. The earlier candidate
archive setup unified every Core version and could not prove this registry
cohort boundary.

History now admits `^0.12.0` alongside its existing Core ranges, allowing its
settings component and host registration to use the same released provider.
This dependency-only compatibility repair carries a History patch entry;
no cast, alias, package override or assertion change is introduced. Focused
History build/check/test and the repeated full registry lanes are in progress.
The initial range extension alone retained the old valid 0.10.1 lock resolution,
so the focused History lane still reported that same single strict error
(receipt `lapis-plugins-validation-16fb0d32-5650-43a9-b2e0-9c05df4001a2`).
A targeted package-manager update (`pnpm --filter @lapis-notes/history update
@lapismd/design-core@0.12.0 --no-save --lockfile-only --ignore-pnpmfile`) now
resolves History to 0.12.0 while preserving the extended public range and normal
registry integrity. The frozen graph is rechecked before wider qualification.

The repaired frozen History graph passes `ci:packages --filter=@lapis-notes/history`:
four successful tasks, including the unchanged strict Svelte check with zero
errors and warnings, unit/repository tests, package build and publint. Receipt:
`lapis-plugins-validation-2ecd24db-944b-4c08-b6e4-3c73a123cbb1`.
Targeted History plus Kanban Storybook acceptance passes all 32 cases across six
files, receipt `lapis-plugins-validation-ed0a7b2a-a495-4245-aac4-5085c6fa0b36`.
The complete registry-only `ci:release` lane passes all 51 tasks, release-tool
tests, audits, 17 npm packs, 17 plugin payload verifications and static Storybook,
receipt `lapis-plugins-validation-2f8067b3-4222-4076-92c4-5030dc9d7003`.
These receipts use source `196875fc4c78a6deeaaaf0961bbdfb0dde83566e` and an
empty archive inventory. Full Storybook acceptance passed on that graph.

Final full registry-only Storybook receipt:
`lapis-plugins-validation-bbe9a230-c86c-48c1-9726-cd35ffa8eafc`, source
`196875fc4c78a6deeaaaf0961bbdfb0dde83566e`: all eight shards and 64 files
passed, with 271 passed cases, zero failures and the same 57 existing skips.
No candidate archives, assertion changes, new skips, baseline updates or audit
policy changes are included. The single History type regression is repaired;
all directly affected packages and story families pass. Final frozen local
installation also passed, and Storybook 6006 was cold-restarted against that
registry graph. Plugin publication and native-service acceptance remain separate
gates; this review branch does not publish a plugin.
