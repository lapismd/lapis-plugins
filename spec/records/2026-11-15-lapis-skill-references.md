# Lapis skill reference qualification

The initial skills supplied only SKILL.md and attribution. They omitted the
supporting resources requested by the implementation plan. This correction
keeps concise entrypoints and adds two Bases, two Canvas and five Markdown
references, written against the Lapis implementations and public Mira 0.2.0
exports. Upstream MIT attribution remains included.

Markdown documents grid tables with spans, directives, list callouts, extended
task markers, code metadata, editor modes/settings, doodle metadata and source
ownership for embeds and editable previews. Bases documents native board and
activity mappings, callback locals and typed dates; the registered map renderer
is explicitly unavailable. Canvas documents native validation, complete JSON
examples and source-owned read-only projections. No upstream-only capability
is inferred from an upstream skill or a registered view name.

## Narrow regressions

`node --test scripts/plugin-skills.test.mjs` initially failed 3 cases (one per
plugin) because no supporting references existed, with the existing archive
case passing. The expanded target checks recursive source/public-bundle parity,
frontmatter, all authored relative links, YAML and Canvas JSON examples, actual
npm tarball bytes, and verified signed payload inclusion for all three plugins.

Markdown's exact target is `pnpm --filter @lapis-notes/markdown exec vitest run
src/lib/skill-examples.test.ts src/lib/rich-skill-examples.test.ts`: 4/4 pass
against the production metadata parser and public Mira parser. The initial
JSDOM run lacked ResizeObserver; the harness supplies that browser primitive
before importing the unchanged public runtime.

Bases' exact target is `pnpm --filter @lapis-notes/bases exec vitest run
src/lib/skill-examples.test.ts`: 2/2 pass, including all seven collection
expressions read from the packaged reference through the actual query engine.

Consumer adoption and release remain separate from source qualification.

## Completed source gates

All nine affected package check/test/build lanes pass: Bases 279, Canvas 156,
and Markdown initially 157 tests (592 total), with zero check warnings/errors
and successful publint builds. After adding the whitespace-sensitive divider
regression, the exact Markdown examples target passes 4/4 and the complete
Markdown suite passes 158/158 (593 affected package cases total). That case first
failed 1/3 after an embedded Markdown formatter rewrote the example as a heading;
restoring the real comment/rule and preserving code-fence whitespace fixes it.
The original spanning-table fixture is also preserved rather than reformatted.

The focused asset target passes 6/6. All 234 release-tool cases pass in the
normal validation worker. Actual npm tarball extraction and signed archive
verification run for each of Bases, Canvas and Markdown, including nested
reference bytes. Package/registry metadata checks pass. Audit passes with only
the two existing documented low-severity exceptions; no new ignore is added.
Canonical checks and the application-ownership audit pass. A concurrent
validation-worker lease collision was rerun serially; it was a harness failure,
not a product/test failure. No runtime or Storybook component changes are made.
