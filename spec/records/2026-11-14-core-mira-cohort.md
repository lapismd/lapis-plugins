# Released Core and Mira maintenance qualification

The combined replacement for dependency PRs 98 and 99 keeps the Bases
`svelte/store` host-module declaration and consumes registry Core 0.13.2,
Mira 0.2.0, and the matching 0.0.4 editor/AI/Mermaid packages.
History and Markdown retain their existing public Core compatibility unions;
normal lockfile refresh resolves them to the root provider identity.
No source alias, cast, package patch, or new vulnerability exception is added.

Qualified functional source: `3680af6e75a96610ad835986b7674c69272bf413`.
This record and its verification links are documentation additions afterward.

## Before and after

- History quality failed once at `repository/components/repository-status.ts:59`
  because settings page/controller types resolved Core 0.13.0 alongside 0.13.1.
  The coherent registry lockfile resolves Core 0.13.2 and the exact check passes.
- Markdown preview quality failed once when a Mira 0.2 asynchronous adapter was
  passed to a retained 0.0.3 editor. The matching 0.0.4 floor repairs that public
  contract; focused Markdown and complete package quality pass.
- The full quality lane exposed one Transcripts error at
  `TranscriptFileEmbed.svelte:92`: an asynchronous render result was assigned as
  immediate cleanup. The component now awaits it, passes its owned abort signal,
  and disposes cleanup that resolves after teardown. An asynchronous decline
  reaches the existing Markdown fallback.
- `pnpm test:storybook stories/plugins/transcripts/EmbedLifecycle.stories.ts`
  reproduces both lifecycle/fallback failures before the component change and
  passes 2/2 after it. An earlier draft story import-path failure collected no
  tests and is not counted as the behavioral reproduction.
- Whole-PR spec-first initially reports ten missing package chapters. The final
  range from `754fd4f74b2979f51d2083a6e3c001bbd4271328` passes with all
  20 protected files and 14 owning chapters represented.

## Executed qualification

Docker `pnpm check` passes all 18 package tasks, including the existing audit
policy, story composition, package metadata, App ownership and source-style
checks. No audit ignore is changed. Docker `pnpm test` passes 1,340 reported
unit cases; Docker `pnpm build` passes all 17 package builds and package lint.
`pnpm spec:check` passes validation, mdBook and spec-first. Docker
`pnpm test:release` passes all 204 release-tool cases.

The unchanged full Docker `pnpm test:storybook` command passes every eighth:
48, 38, 56, 80, 23, 44, 28 and 18 cases, totaling 335 passing cases. Its 57
existing unfinished Sync skips remain unchanged. No browser assertion,
quarantine, timeout, accessibility policy or Visual Delta baseline is relaxed.
The actual-component regression and full catalog run both start fresh workers.
The complete catalog report is
`.local/validation/runs/lapis-plugins-validation-018356e4-ff3f-4aa8-a059-8d0eb6cd61c5`.

Docker `pnpm release:prepare` also passes the complete release preparation,
including all 17 npm packs, all 17 plugin payload archive checks and a cold
static Storybook build. Report:
`.local/validation/runs/lapis-plugins-validation-8ad049fc-63ac-4d17-8122-75fa32251bde`.
Docker `pnpm test:canvas-browser` rebuilds the public static catalog and passes
all 27 native browser cases. Report:
`.local/validation/runs/lapis-plugins-validation-68723615-230e-48ae-8ba0-e88267597cf2`.
These are local candidate artifacts at their source versions, not overwritten
registry publications. Exact-head hosted CI, publication and downstream
adoption remain separate gates.
