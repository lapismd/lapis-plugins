# Sync TypeScript source rebaseline

The first implementation slice restores the retained TypeScript engine and
Storybook source oracle without changing Sync's private, parked or
default-disabled status. Native Rust, Tauri, Server and release qualification
remain separate stages.

## Starting boundary

The isolated task repository started from Plugins merge `6b499b36`. The exact
package baseline collected 18 files and skipped all 205 tests through
`src/sync-unfinished.setup.ts`. Sync stories retained the `sync-unfinished` tag
and the root Vitest configuration excluded that tag. No product assertion had
executed at this boundary.

## Unit restoration

Removing the unconditional setup skip made the complete package run pass. A
fresh file-by-file run then executed every retained file separately:

| Family              | Files | Cases | Result |
| ------------------- | ----: | ----: | ------ |
| Objects             |     2 |    24 | Passed |
| Presentation        |     3 |    37 | Passed |
| Protocol            |     3 |    58 | Passed |
| Runtime             |     5 |    71 | Passed |
| Settings            |     2 |     4 | Passed |
| UI formatting/graph |     3 |    11 | Passed |
| Total               |    18 |   205 | Passed |

The first file-by-file command used removed Vitest reporter name `basic`; every
invocation failed during reporter loading before test collection. The corrected
command used `--reporter=dot`; no product assertion, fixture or threshold was
changed.

## Story restoration

The eight Sync story files remove only `sync-unfinished`; `visual-pending`
remains. The focused repository lane ran their production/App-backed stories
and passed 57 interaction/accessibility cases in 8 files.

The default Docker attempt stopped before collection because the configured
`desktop-linux` context hung in `docker info`. It is an infrastructure failure,
not a story result. The deliberate
`LAPIS_PLUGINS_VALIDATION_RUNTIME=native` run passed, and hosted PR CI had
already passed all four Storybook interaction shards with the same restored
stories. Docker, native and hosted evidence remain distinct.

## Wider native qualification

The first complete native Storybook run exposed three current-main portability
defects outside Sync. An independent clone at `6b499b36` reproduced all three
Kanban failures: `user-event` cannot place Ctrl+End inside the multi-node
CodeMirror editor on macOS. Clicking the final rendered editor line instead
keeps the same edit and persistence assertions and passes all 6 cases.

The same independent main clone reproduced 6 failures in the 30-case Canvas
feature file. Four text-editing cases appended instead of selecting, and two
multi-selection cases selected only one card because the stories hard-coded the
Control modifier. The Layout story had the same unchanged current-main
multi-selection defect. Using the browser platform's primary modifier preserves
the real select-all, undo and multi-select interactions. The exact repaired
files pass 30/30 and 2/2. The complete bounded native lane then passes 75 files
and 407 interaction/accessibility cases across all eight shards.

## Commands and gates

| Command                                                                 | Result                                       |
| ----------------------------------------------------------------------- | -------------------------------------------- |
| Baseline `pnpm test`                                                    | 18 files, 205 skipped                        |
| One `pnpm exec vitest run <file> --reporter=dot` per retained test file | 18 files, 205 passed, 0 failed               |
| Focused `pnpm test:storybook -- <eight Sync story files>`               | Blocked in `docker info`; no tests collected |
| Focused native override of the same Storybook command                   | 8 files, 57 passed, 0 failed                 |
| `pnpm --dir packages/sync check`                                        | TypeScript and Svelte: 0 errors, 0 warnings  |
| `pnpm --dir packages/sync test`                                         | 18 files, 205 passed, 0 failed               |
| `pnpm --dir packages/sync build && pnpm --dir packages/sync publint`    | Passed; public package surface is valid      |
| `pnpm audit`                                                            | Passed; 2 governed low findings ignored      |
| `pnpm --dir packages/sync audit --ignore-workspace`                     | Passed; 1 governed low finding ignored       |
| `pnpm spec:check`                                                       | Passed validation, mdBook and spec-first     |
| Native `pnpm build-storybook`                                           | Passed; static catalog emitted successfully  |
| Native root `pnpm check`                                                | Passed all 18 package/check tasks             |
| Native root `pnpm test`                                                 | Passed all 18 package/unit tasks              |
| Native root `pnpm build`                                                | Passed all 17 package/build tasks             |
| Native Kanban regression file                                           | Baseline 3/6 failed; repaired 6/6 passed      |
| Native Canvas Features regression file                                  | Baseline 6/30 failed; repaired 30/30 passed   |
| Native Canvas Layout regression file                                    | Baseline 1/2 failed; repaired 2/2 passed      |
| Native complete Storybook lane                                          | 75 files, 407 passed across 8 shards          |

Visual review remains non-blocking and no baseline is updated. These results do
not qualify Docker, Tauri, Server, installed-app, release or publication
boundaries.
