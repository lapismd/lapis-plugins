# Published patched localization peer intake

The private registry fixture root previously supplied patched i18next 26.7.2
against API 0.6.12's older peer declaration, retaining a visible temporary
warning. Notes PRs 198/199 publish API 0.6.14 from
`5e7b804a09a166d016af2f97fb0d2e18238e227a`; the public peer contract now admits
`^25.3.0 || ^26.3.4`. Consume that released registry version through `^0.6.14`
and retain direct patched i18next. Historical receipts remain unchanged.

This private development intake does not change any plugin runtime manifest,
package version, release intent, audit policy, source pin, publication or signing
authority. Parked Sync remains independently locked on its historical API line;
its documented private peer warning and excluded status remain separate.

The first portable check fails once on stale managed source facts. Regenerating
the existing source slots exposes the unchanged source-scope restriction.
The API's newly published peer metadata therefore uses a fresh exact transition
receipt from base `44d97ac52a04e93b872878bc448500e023446e7b`, alongside the retained
historical transition. Neither ordinary metadata comparison nor same-version
immutability is relaxed. Positive and negative receipt controls accompany it.

## Focused qualification

Frozen registry install resolves API 0.6.14 and removes the current-API peer
warning. Root audit has zero unignored advisories with its existing ignored low
finding; parked Sync's separate audit reports no known vulnerabilities.
The complete portable check passes all 17 tasks without cache hits. The portable
intake suite passes 45 tests, including historical-receipt replay and changed
localization-peer rejection, while preserving the original transition cases.
The Bases compatibility writer passes 81 probes and changes only its API-version
provenance from 0.6.12 to 0.6.14; all observations and source hashes stay fixed.

An additional portable intake request initially stops before test collection
because the full check already holds the workspace lease. Running that same
portable command after check completes produces the 45 passing cases above;
the lease guard and Docker runtime remain enforced.

## Wider source qualification

Portable tests pass 17 tasks (one cache hit), builds pass 16 tasks (one cache
hit), full release tooling passes 266 cases and all four specification lanes
pass. Package build lanes run their normal export/package lint checks.

The first complete catalog attempt encounters one Source Editor screenshot
suite import failure and one browser-connection error before those cases are
collected. Other shards continue collecting passing cases. The failed run is
stopped to reproduce that exact boundary after disk pressure is addressed;
startup errors from later interrupted invocations are not functional results.
The exact portable command
`pnpm test:storybook -- stories/plugins/source-editor/RegistryScreenshots.stories.ts`
then passes both screenshot cases in a fresh process. The subsequent complete cold catalog passes all 410 cases across 71 files
and eight shards (48, 46, 58, 67, 30, 48, 64 and 49 cases). No assertion, skip
or baseline changes accompany the environmental recovery. The initial import
and connection failures remain recorded; their cause is not established.

## Private artifact qualification

After portable source qualification, the isolated Jujutsu workspace runs the
explicit native CI artifact recipe: frozen install, build, `packages:check`,
`packages:pack -- --already-built`, `plugin:build`, `plugin:verify` and
`node scripts/create-registry-acceptance-fixture.mjs`. All 16 npm archives and
16 deterministic payloads build and verify; 16 ephemeral test-signed registry
releases bind working snapshot `57a5958db80ad763cb90640cf545b59ed8381795`.
This is a private qualification snapshot, not a publication or final committed
source receipt. Final-head CI must reproduce the artifacts. No production
signing material, public release assets or registry dispatch is used.
