# Markdown Reading math consumer regression

This source-owned consumer slice starts from committed Plugins `c9c76f7f` in
an isolated Jujutsu workspace. It excludes the coordinator's uncommitted Core
0.7.3 intake. No package manifest, lockfile, root override, production code,
public API, global fixture, baseline or release state is changed.

The frozen registry cohort retains API 0.2.3, UI 0.1.5, Workspace 0.3.1,
Core 0.7.2 and Mira 0.1.3. Existing root security overrides, including KaTeX,
remain unchanged. This functional consumer baseline does not prove removal of
the future Mira repair's vulnerable dependency chain.

The implemented Reading surface composes public `MiraEditor` in preview mode,
passing the existing Math-enabled feature flags and App-owned adapters. Actual
published Mira 0.1.3 uses remark-math and rehype-katex in that preview renderer.
LN-MD-004 and LN-MD-005 already own this rendering and mode lifecycle; this
slice adds regression evidence rather than a new feature requirement.

`ReadingMath` joins the existing real-App `ReadingSurface.stories.ts` family
and its governed `PanelDemo` → public `WorkspaceShell` path. It creates one
disposable vault document containing a normal heading, strong paragraph, list,
inline formula and display formula. It verifies visible KaTeX output, one display
wrapper, exact TeX annotations and no math errors; then enters Source, verifies
the original text, returns to Reading, repeats the rendered assertions and
verifies the vault source remains unchanged. Live Preview widgets and Mira's
parser/macro/trust parity are outside this consumer regression.

The first cold command used `-t ReadingMath` and selected zero executed tests
(10 filtered). That is not a pass for this regression: CSF TypeScript display
names are humanized. The exact target is:

```sh
pnpm test:storybook -- stories/plugins/markdown/ReadingSurface.stories.ts -t 'Reading Math'
```

The cold exact run passes one case, zero failures and nine filtered cases in
`lapis-plugins-validation-178a2ca1-7a49-4a74-88e6-c79971921097`. The complete
Reading Surface family then passes all ten cases, zero failures, in
`lapis-plugins-validation-ed94d878-a475-4871-85d9-f3a850583502`.

`pnpm ci:packages -- --filter=@lapis-notes/markdown` passes all three owning
package tasks: strict Svelte check with zero errors/warnings, public package
build and publint, and all 154 unit cases across 25 files. Report:
`lapis-plugins-validation-8261d5a3-2588-476a-8c53-2ed29d471c7b`.
`pnpm check -- --filter=@lapis-notes/markdown` also passes, including the actual
registry-lock audit, 64 governed story families, 17 public package boundaries,
App ownership and the no-Tailwind audit. Its registry audit reports two low
findings ignored by the unchanged existing policy; this slice adds no
exception. Report:
`lapis-plugins-validation-a61f924a-025e-4989-911b-3ecb67af9099`.

The latest Deno-free validator is freshly confirmed as 0.2.0. Doctor and
semantic QMD discovery pass using the coordinator workspace's unchanged
validator wiring; the chapter is read authoritatively from this isolated
committed-source workspace. Docker canonical validation, mdBook, spec-first and
App ownership pass in
`lapis-plugins-validation-5f2f9cfe-be72-40d7-926b-cfe6f71ee4f8`.
The final scenario explicitly asserts both formula elements are visible. Its
repeated exact cold case passes one, zero failures and nine filtered in
`lapis-plugins-validation-0c396f18-6dec-48d5-bc03-7013d4f3f34b`;
the complete affected family passes all ten with zero failures in
`lapis-plugins-validation-ae154fd0-c270-4d07-a6c7-00f5562ae0db`.
Validation uses an independent Docker lease with four CPUs,
12 GiB memory, 2 GiB shared memory and the existing shared SSH control path;
there is no host fallback. The scenario stays `visual-pending`, and no PNG is
generated or approved. This initial source regression does not qualify the
future packed or published Mira repair; its identical exact command must be
repeated against that verified artifact before final consumer intake.
