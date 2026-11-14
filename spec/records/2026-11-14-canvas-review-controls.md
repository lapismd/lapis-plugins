# Canvas review controls and examples

This slice starts from main `5e89c0eafd5e6c7b64755c00c3b934cf22897da1`.
Canvas authoring and navigation start collapsed on a single right rail, with
searchable Command View pickers, shared tooltips, saved snapping controls and
zoom-to-fit below reset. Group editing retains a stable outline and the custom
colour button has a circular rainbow fill. The minimap sits opposite the rail.

The panel and registry stories share an original offline coastal research
board with notes, a sketch, a background image, a checklist, a web reference
and labelled connectors. Website cards add URL-derived titles and hostnames
without metadata requests; the existing opt-in credentialless sandbox and
browser fallback remain qualified.

The richer contrast matrix exposed a Markdown-owned defect: nested FileEmbed
and file surfaces reset their inherited palette to a named theme. Those
surfaces now inherit their owner's Mira tokens. This changes no public props
or exports. Their focus rings retain the owning workspace colour. Canvas
embeds and editable cards qualify both consumers.

## Regression counts

| Exact boundary | Before | After |
| --- | --- | --- |
| Accessibility, Export and WebPreviews Storybook families | 1 failure / 14 cases | 0 failures / 14 cases |
| Canvas Contrast matrix | 2 failures / 4 cases | 0 failures / 4 cases |
| Native Canvas browser suite | 6 failures / 30 cases | 0 failures / 30 cases |
| Outgoing Links family | 1 failure / 7 cases | 0 failures / 7 cases |

The focus check retains its 3:1 threshold and waits for the shared button's
colour transition to settle. Body text retains 4.5:1. Native selectors now
address the richer board's named groups and cards, and scroll the reading
note before hit-testing embedded controls. Touch tests expand navigation
only when using selection; panning and pinch gestures begin collapsed.
No assertion, timeout or visual threshold was relaxed.
Outgoing Links now measures inherited editor foreground instead of requiring
a named theme ancestor, retains its exact workspace focus-ring comparison,
and uses the platform's Select All modifier before replacing editor text.

## Qualification

- `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm check`: all 18 checks pass,
  including App ownership, package boundaries and 76 story families.
- `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm ci:packages`: all 51
  build/check/test tasks pass, including Canvas's 156 unit cases and
  Markdown's 154 unit cases, with publint in package builds.
- `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test:release`: 223 tests
  pass, including archive and signature security coverage.
- `pnpm spec:check`: validation, mdbook and specification-first lanes pass.
  Doctor records the existing QMD native ABI mismatch; semantic discovery
  uses the documented rg fallback.
- The complete eight-shard catalog run records 349 passes, 57 existing
  governed skips and one obsolete forced-theme assertion. After its repair,
  the full sixth shard passes all 44 cases, yielding 350 qualified cases
  across the combined inventory. No exclusion changes. The final Canvas
  Contrast, Accessibility and Review families separately pass all 22 cases;
  the final Outgoing Links family passes all seven cases on macOS too.
- Fresh static Storybook builds and all 30 native Canvas tests pass. After
  enlarging the example's web card, the five affected geometry/layering cases
  pass again against a fresh static build.
- Audit passes the unchanged policy: two existing ignored low advisories,
  no non-ignored advisories.
- `node scripts/pack-packages.mjs --already-built` packs all 17 public
  packages and verifies their public import boundaries and registry metadata.
- Canvas and Markdown runtime builds reproduce each payload twice and pass
  `verify-plugin-release.mjs`. The explicit local validation source snapshot
  is `8e5413a570d5d0a69136eef529bb84820905c3db`; hosted PR artifacts must use
  the final pushed commit. No artifact publication is part of this slice.
- Canvas media capture/check verifies two declared items and eight refreshed
  light/dark/product assets from real 1200x800 shells at 2x density. Stories
  remain `visual-pending`; no Visual Delta baseline is replaced.

Local raw logs are under `.local/canvas-review/logs/`. Hosted qualification
and the merged source identity are recorded by the pull request checks.
