# Markdown editor chrome: targeted qualification

The browser comments on `Plugins/Markdown/Reading surface/Short Note` exposed
an inline title offset and Find/Replace painting above Settings. Follow-up
rename testing also exposed a stale breadcrumb in this story host.

## Source ownership

- Notes change `pvkyoqpw` owns measured title padding, long-title wrapping,
  a single Enter/blur rename path and authoritative filename text projection.
  Its isolated workspace is `.codex-workspaces/markdown-title-alignment-notes`.
- Mira commit `082703eb` owns the shared CodeMirror stacking context. Public
  options and entry points are unchanged.
- The Plugins shared panel host now starts and drains the existing App-owned
  vault-change service. Its absence prevented existing API rename projection
  from updating the editor, tab and breadcrumb. Production watcher policy stays
  in the API and hosts.

## Before and after

The original targeted `Editing Title Alignment` and `Editing Search Settings`
run failed **0 passed / 2 failed**: title offset **80.65625px**, editor isolation
`auto` instead of the required stacking boundary. Mira's source browser overlay
regression also failed **0 passed / 1 failed** before its theme change.

The final targeted Plugins run passes **5/5**, with **4 original Reading
scenarios unselected**, no unhandled errors, and the inherited axe error gate:

- Editing Title Alignment, Source Title Alignment, Editing Title Alignment Dark.
- Editing Search Settings and Editing Search Settings Dark.

The alignment scenarios toggle line numbers, change digit widths, rename via
Enter under the real protection boundary, assert the new vault path and header,
save subsequent edits to that path, and resize a real two-editor split. The
temporary YAML source pane uses fold gutters and closes through its actual tab
action before final accessibility acceptance. The Settings scenarios retain
Find and Replace values and check modal focus, hit testing and editor stacking.

Exact final command:

```sh
pnpm exec vitest run --config .local/editor-surface/vitest.config.ts --project storybook stories/plugins/markdown/ReadingSurface.stories.ts -t 'Editing Title Alignment|Source Title Alignment|Editing Search Settings' --no-file-parallelism --reporter=default --reporter=json --outputFile=.local/editor-surface/final-results.json
```

The ignored runtime config imports the tracked config and changes only its
inline browser API port to **63423** because another task owns **63422**.
No tracked test configuration, assertion or accessibility threshold is relaxed.
The spec-first changed-path gate passes. Source evidence includes Notes
**12/12** editor/rename tests plus **3/3** internal rename projection tests;
Mira **6/6** search tests, **2/2** Code Editor browser scenarios and **1/1**
portaled block-menu scenario. Total selected cases: **29 passed / 0 failed**.

## Live package acceptance

Storybook was cold-started on **6006** after installing the two packed source
packages through the existing ignored archive hook and `pnpm install
--lockfile=false --prefer-offline --ignore-scripts`. Tracked manifests,
registry lockfiles and loader configuration are unchanged. Previous artifacts
are preserved in `.local/editor-surface/before-api.tgz` and `before-mira.tgz`.

| Package                  | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `@lapis-notes/api@0.1.4` | `d95586a04f4f93508dcfb8800e271522b0ceb3394958d61cf8cb2d82e79e448c` |
| `@lapismd/mira@0.1.1`    | `5df6b9065f184a8213ba9d2d7c21be33404231586bea6f6b04c77dda93c4f57f` |

Live Short Note Edit mode measures title/text starts at **395.1562px** and
**395.15625px**. A native UI rename to `Verified title` updates both filename
and breadcrumb to `Verified title.md`; Settings covers the open Find/Replace
panel and owns focus. Screenshots and JSON results are retained under
`.local/editor-surface/` without creating visual baselines.

## Deferred qualification and finding

Full repository suites, wider consumers, visual-baseline approval and release
remain deferred by explicit user instruction. One separate inherited Mira
finding was observed while the temporary YAML pane remained mounted: the
Obsidian dark `--mira-syntax-variable` colour `#027aff` on `#1e1e1e` gives
**4.15:1**, below **4.5:1**. Its owner is
`mira-mde/packages/mira/src/themes/_obsidian-palette.css`. This is recorded for
separate palette qualification; the final requested scenarios have no failures.
