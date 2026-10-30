# Search tool-result accessibility and retained catalog qualification

`SearchToolResult` displayed a filename and vault-relative path but its open
button named only the filename. Axe reproduced one label-content-name mismatch.
The source button now includes both visible strings in its accessible name:
`Open auth.md Projects/auth.md`. The new production-component story verifies
that name, both displayed values, file navigation and retention of the chat.
LN-SRCH-041 and the AI catalog query follow that public name.

## Focused and package evidence

- `pnpm exec vitest run --project storybook stories/plugins/search/SearchToolResult.stories.ts`:
  one failure before, one pass after.
- Search/AI affected stories: 33 passed. Existing assertions remain intact.
- `pnpm audit`: passed with the two existing recorded advisory ignores; no
  policy or ignore changed.
- `pnpm spec:check`: canonical governance and App ownership passed.
- `pnpm check`: all 13 tasks passed (12 cached); Search strict Svelte and TS
  checks passed with zero errors/warnings.
- `pnpm test`: all 13 tasks passed (12 cached); Search's 40 tests passed.
- `pnpm build`: all 12 tasks passed (11 cached); Search declarations/build and
  publint passed.
- `pnpm test:release`: 119 passed, including package/archive reproduction and
  signature-fixture regression coverage. No production key or release signing.

## Complete catalog coverage

The first full command stopped on Backlinks Middle Top Tabs: the entrance
animation yielded a 399.1px intermediate rectangle before its unchanged 400px
minimum. Exact reproduction failed once; a cold parent run passed, establishing
intermittent readiness. The leaf assertion now uses the existing bounded
`waitFor`, retaining the same minimum, geometry, editing and navigation checks.
Its exact target then passed.

The second full command passed shards 1 and 2, then stopped on Outgoing Links
Middle Top Tabs with the same early rectangle measurement. That leaf assertion
now waits for the same unchanged minimum. Its exact target passed. No shared
helper, timeout, animation, test selection or threshold was changed.

All four actual shard runs against final production Search behavior passed:

- Shard 1: 56 cases, 12 files (second full command).
- Shard 2: 72 cases, 12 files (second full command).
- Shard 3: 48 cases, 12 files (rerun after the Outgoing Links repair).
- Shard 4: 60 cases, 11 files (fresh rerun).

Commands use `pnpm exec vitest run --project storybook --no-file-parallelism
--shard=N/4`. This records 236 passing cases across the four selected shards;
it does not claim the earlier single `pnpm test:storybook` command passed.

The first shard-4 run passed 59 cases but lost the browser connection before
Bases Embeds could run (one unhandled transport error). The unchanged exact
Embeds file passed its one case in a fresh process, then the entire fourth
shard passed all 60 with no unhandled errors. No assertion was weakened.

`pnpm build-storybook` passed the fresh static build. Existing large-chunk and
optional browser-externalization advisories remain. No baselines changed.
Two final spec-first attempts rejected the missing Markdown parent chapter
for the leaf play changes; the mapped canonical index now records the settled
geometry contract. No mapping or checker was weakened.

Desktop consumer acceptance uses a new local npm archive after source
qualification, without publishing a package or creating a release.

## Local npm payload

`pnpm --dir packages/search pack --pack-destination ../../.local/m102-search-qualified`
passed prepack, declaration emission and publint. The archive contains the
repaired production Svelte label; no registry version or portable manifest was
changed. Source revision is this enclosing change.

SHA-256: `6b579afcad06a179bf7034de25c1824e52cba5c2fde9932f6b265d67bffaec57`.

Source fixes remain local for the authorized desktop archive overlay. Existing
main/bookmark histories are preserved; no package, release or unrelated branch
history was published.
