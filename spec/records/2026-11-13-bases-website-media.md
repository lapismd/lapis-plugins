# Bases website media refresh

Reviewed November 13, 2026 against public parent
`42bc2291ac6527b05b4996ed5df5d975eefed277`, package `@lapis-notes/bases@0.3.1`.
Only generated registry media and this evidence change. Runtime, registry
metadata, fixed story IDs and baselines remain unchanged.

## Capture evidence

The six existing Registry Screenshots stories (Filter options, Cover cards,
Overview, Grouped List, Kanban and Activity) passed all interactions and axe
checks in a cold owner-configured Storybook run: 6 passed, 0 failed. A fresh
static Storybook build passed. `pnpm registry:media:capture -- --plugin bases
--storybook-dir .local/website-media-bases/storybook-static` regenerated all
seven declared items, 28 assets, at 1200x800 CSS pixels and 2x density in both
themes. The matching `registry:media:check` verified all seven deterministically.
Banner and Overview were visually inspected in both themes: populated cover
cards and grouped project records with grouping controls open. Captures remain
visual-pending; no visual baseline was created, replaced or approved.

## Qualification

- Frozen registry install passed.
- `pnpm --dir packages/bases check`: zero errors and warnings.
- `pnpm --dir packages/bases test`: 26 files, 277 tests passed, zero failed.
- `pnpm --dir packages/bases build`: package build and publint passed.
- `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm check:app-ownership`: passed.
- `pnpm audit`: zero unignored findings; two existing low findings ignored by
  the unchanged repository policy.
- `pnpm spec:validate`: 8 validators, 34 chapters, 729 requirements passed.
- `pnpm spec:first`: initially failed once because regenerated assets require
  their mapped canonical chapter; the chapter now records this refresh.

The website imports the four plain banner/overview themed assets only, pinned
to the final source commit and checksummed. This does not publish npm packages,
plugin archives or registry releases, or claim native host qualification.
Local logs are under ignored `.local/website-media-bases/`.

After recording the canonical refresh, the exact `pnpm spec:first` gate passed
(28 protected files, one canonical chapter). `pnpm spec:check` passed all three
lanes (validation, mdBook and spec-first), and `pnpm --dir packages/bases pack
--pack-destination ../../.local/website-media-bases/pack` produced the local npm
tarball with a passing prepack/publint. Release signatures and archive publication
were not changed and are outside this media-only slice.
