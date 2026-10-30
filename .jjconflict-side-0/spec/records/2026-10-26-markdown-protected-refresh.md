# Markdown protected native saved-state refresh — 2026-10-26

Notes CORE028 follows the actual hosted editor/Tasks close regression: a native
mutation completes, but the producer retains an older conditional baseline.
Markdown uses the existing public Mira text-recovery lease to reconcile saved
state under retained input protection after the native fence resumes.

This isolated workspace builds on qualified Markdown binding `40f8febb`.
Three exact cases cover a native saved-text refresh followed by a real
conditional local save, failed refresh with explicit retry and no mutation
replay, and managed deletion retaining expected absence without inventing empty
text. Their original binding cases share a typed test-only fixture; assertions
and production package exports are preserved.

Exact command:

```sh
pnpm --filter @lapis-notes/markdown exec vitest run src/lib/mira/file-protected-refresh.test.ts
```

Before: **0/3**, receipt `2eb78db4-b2a5-4f52-b4de-40bdc4374cc3`, source
`44fa9ff5`, using owner-qualified CORE028 API `1c10db6d`. All three reject the
missing protected-refresh callback. After: **3/3**, receipt
`28618425-180b-454c-9d07-8bba9aa9c6c9`, source `50e86b4b`.

Owner receipt `75778bab` passes the three new cases, three original native
admission/handoff cases and all **23 affected adapter cases**, then finds one
implicit-any annotation in the extracted test fixture. Adding that annotation
produces final owner receipt `c3e8cb11-2dd3-449b-ac44-236d919c8083`, source
`a8e4fb57`: **23 affected / 142 Markdown cases**, strict check, build, publint
and public pack pass. The archive SHA-256 is
`ad896d6590cb490509477da36de15ab52371d2ed6d50bd2bb7c099f9f52127e6`;
test fixture paths are absent from the package. Published manifests and lockfiles
are unchanged.

Final formatted product snapshot `b4efa987` uses the final owner-qualified API
archive `58599268`. Full receipt `76098596-ee3a-4129-a82e-f2dd8fb4ccd8`
passes **23 affected**, the cold real FileEmbed native-mutation story, all
**1,117 package cases**, strict checks, all builds, public pack, ownership,
metadata/parity and **21 release-tooling cases**. Two independently built and
verified plugin payloads are byte-identical across 181 files; payload SHA-256
is `e6947600349d6f9ce55537793a253baf89c774242cea97f52389c4d9defc894b`.
The final npm archive SHA-256 is
`f1a6666de7f9d03064a427fc2672a9a54ed3c60fe6e400f885a89d93e3e527e6`.
Compared with the earlier owner archive, only emitted JavaScript formatting and
declaration-map coordinates differ; public declarations are unchanged.

The first three cold catalog shards pass **68 + 93 + 54 cases**. Shard four
passes **69 cases** across 13 files, then loses its browser connection before
`LinkPreviewAcceptance.stories.ts` runs. The worker reports `OOMKilled=false`.
This is an incomplete aggregate, with **284 passing assertions**, two unexecuted
Link Preview cases and one retained harness error. No product assertion or
timeout has been weakened.

Cold closure receipt `d861daed-82b8-4a80-8eb3-653c4c150ea9` passes the exact
missing Link Preview file **2/2**. Its subsequent unchanged full shard-four
command repeats **69 passes and one browser-orchestration error** before that
file. These are **286 distinct passing catalog cases** across the retained cold
commands, not a passing full-shard aggregate.

This is the previously reproduced and accepted harness baseline documented in
[Search settings recovery](2026-10-26-search-settings-recovery.md#inherited-repository-failures):
unchanged parent `bd305e58` repeats the same 69-pass/createTesters error, with no
cgroup OOM, browser crash or product assertion failure. Its resumed closure
records the user's standing no-confirmation decision for that demonstrated
unrelated defect. That acceptance persists here; the failed aggregate remains
failed and assigned to catalog-orchestration maintenance. No browser channel,
timeout, isolation, file selection, assertion or fatal diagnostic guard changes.
Documentary receipt `5b7c9a83-c7cf-46f3-8a9b-4261ac4ce4dc`, source
`37ae7100`, passes all 15 build tasks, a fresh static Storybook build and all
three specification lanes (validation, mdBook and spec-first), followed by the
App-ownership audit. Compared with product snapshot `b4efa987`, every changed
path is documentary; all production, unit and story bytes remain identical.
Final record formatting and specification checks follow before the source
commit. The component requirement is Implemented; actual host adoption remains
separate.

Native Desktop/hosted acceptance remains separate.
Existing accepted Zod audit/CSV styling findings retain their source ownership;
no ignore or assertion is weakened. No release, signing or visual baseline
approval is part of this slice.
