# Search tool empty results

2026-10-19; enclosing Jujutsu change muypknlm; LN-SRCH-041.

SearchToolResult now uses public Design Core Empty, Search icon and muted
description for an empty result list. Hit navigation, output normalization,
authorization and indexing are unchanged. The desktop host separately removes
its custom transcript frame; no consumer CSS override or replacement renderer.

Exact before: `pnpm exec vitest run --project storybook
stories/plugins/search/SearchToolResult.stories.ts -t 'Empty Results'` fails 1/1
(1 skipped): the paragraph has no Empty root. The first after attempt finds the
new description itself via the component-family marker and fails its icon check;
scoping to the public Empty root fixes the selector. The full file then passes
2/2 with interaction/accessibility enabled. Logs `.local/search-empty-before.log`,
`search-empty-after.log`, `search-empty-after-2.log`.

`pnpm --filter @lapis-notes/search check` passes Svelte (zero errors/warnings)
and TypeScript; `pnpm --filter @lapis-notes/search test` passes 40 tests in
9 files; `pnpm --filter @lapis-notes/search build` passes svelte-package and
publint. `pnpm audit` reports only the existing two ignored advisories (one
moderate, one high); no new ignore was added. Logs `.local/search-empty-types.log`,
`search-empty-unit.log`, `search-empty-build.log`, `search-empty-audit.log`.

`pnpm --dir packages/search pack --out /absolute/Notes/archive.tgz` packs the
public dist with prepack/publint. Actual archive:
`lapis-notes-search-0.1.3-local-results.tgz`; code snapshot
`9371df00d66bfda9fe01696b7092d385a277df1e`; SHA256
`8bfdeed978d02027a59aa2d5c7408c57fdc43cbca007e0be4babf378d5ad9a99`.
`.local/search-empty-pack.log`.

Notes E-AI-061 owns consumer refresh and focused acceptance. Wider suites,
release archive/signature/reproduction, publication, registry and visual-baseline
gates remain deferred under the user's UI-first scope; this is a local UI
slice and no release is qualified.

The desktop overlay rejected the initial archive because Search's `^0.4.0`
range excluded Design Core 0.5.1. Search now accepts `^0.4.0 || ^0.5.0`; the
lock retains its qualified 0.4 resolution while desktop qualifies 0.5 using
public exports. LP-SPEC-011 and governance contracts remain unchanged: portable
ranges, source ownership, no aliases/patches and no release promotion.

Final compatible archive: same filename, source snapshot
`53d1602eeeeb99335c23c6a5b7da5bfcb31c29d1`, SHA256
`97a3cee7024ea2c8f03439b7a718cebf0bf1f04c486c2fcd15ac7b59893b6c16`.
The repeated pack/prepack/publint and `pnpm spec:check` pass. The frozen offline
lock check stops on the existing pnpmfileChecksum configuration mismatch before
package resolution; no unrelated hook/lock graph is changed to bypass it.
The initial YAML/semver probe could not import unexposed root dependencies.
A standard-library manifest/lock check confirms matching specifiers and the
unchanged 0.4.0 lock; Notes local installation admits the actual 0.5.1 archive.
Logs `.local/search-empty-pack-2.log`, `search-empty-spec-2.log`,
`search-empty-lock.log`, `search-empty-range.log`, `search-empty-range-2.log`. Full frozen release
qualification remains deferred.
