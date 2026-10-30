# Graph settings lifecycle for native intake

LN-GRAPH-034 admits the pending persistence debounce through the existing App
operation registry. Superseded timers release their cancelled work without
writing; the latest snapshot remains coalesced and unload releases and awaits
it. The normal conditional plugin save retains its original conflict writer.
Failure notices use the owning App.

LN-GRAPH-035 observes owning Configuration plugin-data recovery and applies the
parsed snapshot to every registered global/local view. It does not save the
recovered value again. Current local self-save echoes remain ignored.

## Exact evidence

```sh
pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts
pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-recovery.test.ts
pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts src/lib/__tests__/graph-settings-recovery.test.ts src/lib/__tests__/graph-plugin.test.ts
```

The first admission fixture resolves an old API archive without settleOperations
and fails once. Refresh the consumer with ten verified current core archives
across 37 workspace import routes, preserving tracked manifests/lockfiles. The
correct boundary reproduces one genuine failure: the close drain completes
while the pending Graph timer has not called saveData.

The initial recovery fixture and first combined attempt use the package name
instead of the preserved runtime id lapis-graph, failing once each. Correct the
fixture to manifest.id and reproduce the original missing listener with the
repair temporarily removed: one genuine failure. Restoring the repair passes
all 12 cases across three exact files. The legacy debounce/unload assertion
remains intact and its fixture explicitly models a nonconditional vault.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. All 62 Graph cases in 15 files pass. Strict Svelte/types report zero errors
and warnings. Normal build/prepack/publint, all three specification lanes and
the App audit pass. Audit exits zero with the existing moderate/high ignored
findings; no ignore is added. Native qualification remains pending.

## Remaining qualification

The desktop has not yet registered Graph. Its native intake must consume the
verified public archive and prove global/local indexed rendering, file follow,
filters, navigation, cold restore and close/failure/recovery through real
controls. Do not replace its renderer or settings surface.

Full source, Storybook/axe, web and Desktop gates remain deferred until M7
implementation. Deno is frozen. Signing, publication, visual baselines and
post-M7 plugin intake remain deferred. Keep the source candidate isolated from
unrelated main work until every prerequisite for pushing is met.
