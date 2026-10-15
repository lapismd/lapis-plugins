# Sync UI qualification

The default `lapis-plugins` workspace now contains the retained Sync, History,
File History, comparison and merge UI, status bar, pairing and recovery settings.
History comparisons use one wrapping header with title, actions, and counts plus
Close. The synced status icon is green; the status popover uses application
theme tokens and compact typography.

Sync remains private and parked. The production default is disconnected. The
catalog injects a test-only runtime; Deno transport, durable event/object storage,
endpoint enrollment and server capture/apply remain unimplemented. End-to-end
encryption is mandatory, and the session rejects unauthorized, unenrolled,
locked or unencrypted mutations. Ordinary configuration never stores keys,
decrypted content, pairing sessions or recovery files.

## Main workspace checkpoint: 15 October 2026

Stage 0C consumes published API 0.1.4, Design Core 0.3.3 and Mira 0.0.5.
Workspace 0.2.0 is also resolved from npm; the old sibling-archive dependency
setup below is historical. Svelte 5.56.10 matches the API renderer contract.
The source engine and UI are unchanged from the qualified runtime stack.

The 37-case engine target and ten shell/status stories pass first. All 184
Sync unit cases and all 47 Sync interaction/accessibility stories then pass.
One complete-story attempt lost its browser connection after 44 passing cases;
the affected Review file passes all three cases, followed by a clean 47-case
run. No assertion, timeout or diagnostic policy changed. Package checks,
build/publint, Node/Deno imports of 63 engine exports, package/registry guards,
ownership and specification checks pass. Wider catalog qualification remains
deferred; these results do not claim live Deno synchronization.

## Historical qualification: 13 October 2026

- `pnpm --dir packages/sync test`: 89 tests in seven files pass.
- `pnpm --dir packages/sync check`: zero errors or warnings.
- `pnpm --dir packages/sync pack`: build and publint pass; the packed inventory
  has 96 files with no tests or story fixtures. Node and Deno import its bundled
  headless engine successfully with 32 exports and no UI/host imports.
- `pnpm exec vitest run --project storybook stories/plugins/sync
--no-file-parallelism`: all 47 stories pass, including interaction and axe
  checks. The original six failing UI stories are repaired. The registry family
  adds six governed scenes; all six pass.
- `pnpm check`, `pnpm test` and `pnpm build`: the repository package lanes pass.
  `pnpm test:release`: 104 tests pass. `pnpm spec:check` and App ownership pass.
  `pnpm audit` was run without adding CVE exceptions.
- `NODE_OPTIONS=--max-old-space-size=8192 pnpm build-storybook`: the static
  catalog builds. The first root build exceeded Node's default heap limit;
  the larger local heap leaves repository settings unchanged.
- Registry capture/check verify six deterministic items, producing 24 WebP
  assets. The metadata audit verifies all 13 preview/active sources. Media
  selection tests prove that Sync remains outside activation, dispatch and
  release selectors. Direct Sync archive selection fails closed.

Registry commands from the repository root:

```sh
pnpm registry:media:capture -- --plugin sync --storybook-dir storybook-static
pnpm registry:media:check -- --plugin sync --storybook-dir storybook-static
```

Omit `--storybook-dir` to build a fresh catalog. Omit `--plugin sync` to include
all active media and the explicit private Sync preview. Fixed IDs in
`packages/sync/registry.json` select the banner plus Changes, History, File
History, Merge and Status. These assets are registry media, not Visual Delta
baselines. All new stories remain `visual-pending`.

## Historical source and consumer boundaries

Design Core owns the accessible-name fixes for status items, copyable revision
values and the mobile tab-count button. The status/settings regression moved
from one failure to one pass; their families have 12 passing stories. The mobile
regression likewise moved from one failure to one pass. Its complete checks
include 734 unit tests and 688 Storybook interaction/axe tests, plus static,
type, specification and pointer/browser lanes. No baselines were changed.

The development preview uses an ignored temporary dependency setup: registry
API/UI/File Explorer 0.1.2 and Language Service 0.1.1, the built sibling Workspace
0.2.0 archive, and prepared Design Core source archives for these repairs. Svelte
5.56.10 matches the renderer contract. Committed host ranges remain unchanged;
the root lockfile changes only the Sync importer and adds its dependency records.
Existing importer, package and snapshot entries are preserved.

This is source and temporary-consumer qualification, not registry-only release
qualification. Workspace has no published version satisfying the existing host
range. Sync is not packaged as an installable signed plugin or released.

## Historical wider catalog findings

The complete shared Storybook lane ran separately from Sync. Existing
Search, AI History and Markdown All Properties accessible-name failures were
reproduced before and after this slice. They belong to their plugin controls
and shared filter chrome, not Sync. The original first shard had 20 failures;
after source accessibility repairs it has 10 failures and 50 passes. Across all
four final shards, 195 stories pass and 29 fail. Additional failures occur in
existing AI chat/registry and AI/Bases shell scenes, Bookmarks, History Mobile,
and Markdown Tags/Outgoing Links. Sync has zero failures in its 47-story focused run. Wider
catalog failures remain release blockers; no assertions or axe rules were
disabled and no visual baselines were approved.
