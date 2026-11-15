# Native keyboard and bounded Canvas catalog acceptance

The complete remotes review lane exposed existing macOS story-input defects.
Bases Kanban document-end actions now use Command+End on macOS, followed by
public clipboard paste. Canvas multi-selection, select-all and undo use Command
on macOS and Control elsewhere. Product save/title, selection and document
assertions remain intact. Navigation awaits a stable camera transform across
two animation frames and verifies the full expected 80px pan before continuing.
No production behavior or baseline was changed.

Initial exact baselines exposed 3 Kanban failures, 7 Canvas Features/Layout
failures and 1 remaining Navigation failure. Their final affected and
full-catalog run has zero failures. The full standard
eight-shard `pnpm test:storybook` lane under Node 24.10.0,
`LAPIS_PLUGINS_VALIDATION_RUNTIME=native` and
`LAPIS_PLUGINS_BROWSER_TEST_PORT=63431` passes 392 cases across 76 files, with
57 existing skips and no errors. Checkout-local API-port selection prevents
independent workspaces from colliding; the default remains 63422. Unsharded
exploratory runs lost their browser connection; the final standard shard lane
passed without relaxing assertions or timeouts.

Full `pnpm check` and `pnpm test` pass all 18 tasks each; `pnpm build` passes
17 tasks including publint. Audit is included in the root check. All 227 release
tool tests pass. `pnpm build-storybook` passes with existing dependency/chunk
warnings. Canonical checks pass after adding the browser-port isolation mapping
to distribution. Full catalog acceptance uses the documented built API archive
from the optional-state projection source fix; registry refresh remains pending.
