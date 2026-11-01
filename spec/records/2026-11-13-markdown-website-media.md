# Markdown website media readiness

The website's reviewed Reading screenshot displayed a broken nested
`Assets/map.png`. The fixed Reading story now requires a meaningful content
image to decode with nonzero natural width and height before capture readiness.
CodeMirror's intentionally source-less, hidden cursor-buffer images do not
represent document content and are excluded by their accessibility attributes.
The source fixture's PNG decodes correctly; no production runtime or shared
fixture implementation changed.

All six declared Markdown media items were regenerated through the existing
registry capture command: banner, overview and four gallery cards, each with
preview/full/light/dark outputs. Plain product images retain 1200x800 CSS pixels
at 2x density. Both themed Reading images were visually inspected and show the
embedded map. No Visual Delta baseline was created or updated.

## Executed source qualification

- Cold focused Reading: 1 passed, 4 unselected, 0 failed.
- Complete affected Registry Screenshots family: 5 passed, 0 failed, retaining
  the real preview annotations, runtime-warning guard and enabled axe checks.
- Markdown package check: zero Svelte warnings or errors; type lane passed.
- Markdown unit suite: 25 files / 154 tests passed, zero failures.
- Markdown build/prepack and publint, including the actual npm pack, passed.
- Explicit App-ownership audit passed. No App ownership implementation changed.
- Specification check: validation, mdBook and spec-first all passed.
- Fresh static Markdown Storybook build passed. The ignored focused config
  imports the owning repository's main config and default preview unchanged,
  selecting the one affected family for diagnosis and capture. It is not a
  second maintained Storybook or a full-repository catalog qualification.
- `pnpm registry:media:capture -- --plugin markdown --storybook-dir .local/storybook-website-final`
  generated all 24 declared assets.
- The matching `pnpm registry:media:check` passed for all six deterministic
  items in both themes.
- Latest registry `@lapismd/spec-validator` remains 0.2.0. Doctor passed nine
  checks with two warnings because QMD is absent from PATH; `spec:search` used
  its documented rg fallback. The specification gates remain enabled.

Focused browser commands:

```sh
pnpm exec vitest run --config .local/website-storybook/vitest.config.ts --testNamePattern Reading
pnpm exec vitest run --config .local/website-storybook/vitest.config.ts
```

These checks used native Node 24 as explicit source diagnosis, without claiming
Docker or native Desktop qualification. November 1 broad source runs were
canceled under memory pressure and have no full-suite result. The normal full
Storybook path had also failed dependency optimization in parked Sync imports
before collecting tests. Those attempts do not count as successful catalog
coverage.

## Existing audit failure

`pnpm audit` fails on the inherited lockfile: nine advisories, of which the two
existing low exceptions are already ignored. The seven unignored findings are
six moderate and one low in `hono` and `@hono/node-server`, reached through
`@lapis-notes/api` -> `@lapismd/ai-host` -> `@modelcontextprotocol/sdk`.

The unchanged parent's package.json, pnpm-lock.yaml and pnpm-workspace.yaml were
exported to an isolated directory; their bytes match this change. Its independent
`pnpm audit --json` reproduces the same six moderate and three total low findings.
No manifest, lock, vulnerability ignore or audit assertion changed in this slice.

Advisories: GHSA-qv5m-9pm6-hqp3, GHSA-jpvv-r467-5p4w,
GHSA-4m76-xfj5-7975, GHSA-h7mg-cq63-vhpq, GHSA-3gg2-335m-rxc6,
GHSA-46wx-v44x-9hh2 and GHSA-4h7h-rv7c-7m2v. Dependency maintenance owns the
registry refresh; AI Host owns its public dependency contract. No audit finding
is reported as passing. On November 13 the user explicitly accepted recording
this existing audit limit and pushing the focused migration change, with the
audit gate and all existing checks left enabled.

## Diagnostic corrections retained

An initial image query included CodeMirror cursor buffers and failed once on an
intentionally source-less image. The final semantic selector requires real
content, without suppressing broken document images. An initial temporary preview
re-export omitted its default export; the generator rejected identical theme
captures. The corrected preview imports the actual default, and final cold
captures and deterministic checks distinguish both themes. No failed or canceled
attempt qualifies the final media.
