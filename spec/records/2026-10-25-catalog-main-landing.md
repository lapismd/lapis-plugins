# Catalog validation landing in the default workspace

The catalog-composition and Docker-first validation slice is integrated into
the default Plugins workspace. The original qualified change is `kxxktsvo`
(`a4eb4545` before the landing follow-up). Existing CSV editor, Markdown asset
lease and other application changes remain separate, uncommitted work.

The pre-landing snapshot is retained at
`local/validation-landing-before-20261025`, commit `642fc5ad`.
Ignored `.local/validation/landing-20261025/before.json` records its file hashes.
The default workspace has no unresolved Jujutsu conflicts. The temporary
`catalog-validation` workspace remains pending the user's cleanup confirmation;
its evidence and prerequisites are retained.

## Combined checkout validation

The original isolated qualification remains in
[the original record](2026-10-25-catalog-validation.md). The combined checkout
passes all 56 current story-family inventory and composition checks, all 47 runner/composition regressions,
specification and App-ownership checks. `pnpm ci:packages` passes all 45 tasks
for the current 15-package catalog in run
`lapis-plugins-validation-63432ade-28cb-431b-8f19-bbf74139e75d`.

The exact cold CSV/PDF selection reports eight passing PDF cases and six failing
CSV placements in `lapis-plugins-validation-a5beaea7-139c-40f4-8709-7d0f14e453be`.
The CSV header moves 16 px where the existing assertion requires less than 2 px.
The unchanged CSV editor and its stories belong to the existing application
work. On 2026-10-25 the user accepted recording this blocker and finishing the
validation landing. No assertion, skip or visual threshold is changed.

The full four-shard run
`lapis-plugins-validation-735b459d-528a-4fe1-be47-9226ae584af8` reports 273 passed
and seven failed cases: the six accepted CSV failures plus one AI Shell Desktop
pointer-timing failure. The exact fresh `pnpm test:storybook --
stories/plugins/ai/shell/Shell.stories.ts -t '^Desktop$'` rerun passes one case
with zero failures in `lapis-plugins-validation-a2bec23f-cb66-491e-b0cb-fb3397d4a4e1`.
The subsequent shard-four run passes 63 cases, including Desktop, but loses the
browser connection before the six Sync placement cases; that run is incomplete
and is not recorded as a full-shard pass. A second shard-four attempt reproduces
the same browser-disconnection error after 63 passes. The exact fresh Sync
family passes all six cases with zero failures in
`lapis-plugins-validation-33806580-ef75-43f9-be0f-9618549a069a`; the original
complete four-shard run also passed those six cases. These reruns do not turn
the incomplete shard attempts into full-suite passes. Browser-runner stability
remains a qualification limit alongside the accepted application blockers.

## Package inventory regression

The clean npm-pack lane initially scans excluded compiled Markdown tests and
rejects a source-only native fixture import. The import-containment audit now
checks the actual packed JavaScript inventory. The focused
`node --test scripts/npm-package-imports.test.mjs` target moves from two passed
and one failed to three passed and zero failed. The regression also proves a
shipped test with an escaping import is still rejected.

The widened tooling target passes all 140 cases. The final Docker tooling rerun also passes all 140 cases in
`lapis-plugins-validation-5cf568a6-36cd-4c34-9d91-c61812da82e5`. The PDF package also selects its actual
`src` root for clean builds and carries an independent patch Changeset; its
build, type checks, tests and publint pass in the combined package lane.

The subsequent all-package pack run
`lapis-plugins-validation-488dacf3-3c2f-479d-8f16-fc3920720353` gets beyond the
excluded-test issue and fails on a real pre-existing PDF boundary violation:
`dist/lib/mount-pdf.js` imports its WASM through
`../../../../node_modules/.pnpm/@embedpdf+pdfium@2.15.1/node_modules/@embedpdf/pdfium/dist/pdfium.wasm?url`.
That import is already present in the committed PDF source. The containment
gate remains strict and PDF release qualification is blocked. On 2026-10-25
the user explicitly accepted recording this PDF blocker and finishing the
validation landing. No complete all-package archive qualification is claimed.

The worker installs explicit temporary source archives before validation;
ordinary runs retain their frozen registry install. Current source-archive
identities are retained in every per-invocation report. Tracked dependency
manifests and lockfiles remain registry based.

The previously accepted Zod 3 advisory and the released Design Core teardown
blocker retain their separate upstream release gates. No release is published,
no visual baseline is changed, and the preserved application work is not
committed by this landing.

## Final landing checks

The final combined `pnpm spec:check` and explicit App-ownership audit pass in
`lapis-plugins-validation-45c9dd14-bea4-42f2-a7e1-565039ccf99b`. Final native
specification validation and formatting also pass after the evidence links.

The before/after SHA-256 comparison across all 1,740 existing tracked files
finds no unexpected changes. One distribution-document conflict was resolved by
retaining both the existing CSV metadata note and the new package-inventory
contract. The CSV metadata notes remain with the unfinished application's
uncommitted changes so its same-change specification gate remains intact.
Existing CSV, Markdown asset and lockfile work is preserved, with no unresolved
Jujutsu conflicts.

## Confirmed temporary-workspace cleanup

On 2026-10-25 the user confirmed cleanup. The 1 temporary workspace was
unregistered from Jujutsu and moved to timestamped macOS Trash locations.
Their complete local evidence was archived in the default workspace under
`.local/retired-workspaces/catalog-validation-20261025T155102Z`,
with verified archive checksums, original head/parent revisions and local
recovery bookmarks in `retirement.json`. Each checkout was clean, its non-empty
changes were already landed, and no running process owned its directory.
The before/after comparison confirmed every existing main-workspace tracked
file remained byte-identical during retirement. Other workspaces were retained.
