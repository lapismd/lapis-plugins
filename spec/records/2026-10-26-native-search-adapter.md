# Retained Search native observer adapter

Working from qualified built-in Canvas source `5e0dffc3` in isolated Plugins
workspace `native-search-adapter-20261026`; the dirty default workspace is
preserved. Search retains its existing UI, query, settings and standalone
browser behavior. Native ownership is selected only through the explicit App
background observer supplied by the shared API.

The native branch declares provider identities, versions, priorities and the
existing chunk settings without invoking matches/extract callbacks. It uses
service refresh/status, omits renderer file/metadata writer listeners and
checkpoint writes, and keeps manager/view disposal passive. API Plugin disable
is the separate native drain. Rebuilds and provider/chunk-setting changes use
the service controls; ordinary view/query preferences do not redeclare indexing.

## Exact evidence

The exact owner target is
`pnpm --dir packages/search exec vitest run src/lib/native-search-manager.test.ts --maxWorkers=1`.
At `2ed7b391` it has zero passes and four failures: native declarations are
ignored, progress comes from renderer state, writer listeners are installed,
and unsupported providers run browser callback fallback. Worker
`lapis-native-search-adapter-exact-9a097c00` retains that baseline. The first
source retry at `e8c5901b` passes 4/4. These are owning unit results against an
observer fixture; they do not qualify the final public API package or a host.

Pending convergence adds a 4-pass/1-failure baseline at `a422891b`. Expanded
direct-write, failure, rebuild and passive-disposal cases pass 9/11 at
`99005fc6`: native completion time is absent and the missing-observer diagnostic
is imprecise. The adapter retry at `45ad5fef` passes 11/11, including the
pending-convergence regression (`lapis-native-search-adapter-exact-46e84a28`).

Native query telemetry adds a 12-pass/2-failure baseline at `9cbd30cf`; active
and pending native work incorrectly use idle renderer state. Caching only the
last observed native activity passes 14/14 at `a4774a45`, worker
`lapis-native-search-adapter-exact-6f32dd16`, without extra query service reads.
The real SearchPlugin settings, provider and rebuild controls extend the exact
target to 17 cases. Their first run at `320003bf` has 14 passes and three fixture
failures because the public Component's DOM compatibility factory is absent;
the fixture now supplies the same isolated factory as existing Graph tests.

The public API candidate from Notes owner snapshot `c7786ebb` is consumed as a
checksummed archive, not a source alias. Its SHA-256 is
`ae589c0d13e7f0eec47e67d62b5dbf95908ed82ff6ec0ec9d1cefac3a686e35e`.
All 17 initial manager/plugin controls pass at `156de208`; three additional
disposal-race regressions fail there because late continuations can reselect
or refresh native indexing. Entry and post-await lifecycle fences pass 20/20
at `fa5b403a`, worker `lapis-native-search-adapter-exact-3a984963`.

Focused owner qualification at `08377a36`, worker
`lapis-native-search-adapter-focused-248a875d`, passes the exact 20 cases,
strict Search checks, all 107 Search tests across 13 files, build/publint,
App ownership and complete canonical specification checks. Full owning-repo
check/test/build, affected and cold catalog, static catalog, audit,
public archive/reproduction/signature and consumer integration remain distinct
gates before source commit.

The native disable/re-enable regression at `8fbb88ca` has 20 passes and one
failure: PluginManager reuses the plugin, whose old manager remains disposed.
A fresh manager per subsequent activation and captured-manager guards for old
startup/provider continuations pass the expanded 22/22 target at `75b85311`,
worker `lapis-native-search-adapter-exact-78fbe3bd`. Explicit native disable now
fences new declarations before awaiting the App-owned drain; late settings
cannot restart work during that wait.

## Separate existing repository failures

Full-source worker `lapis-native-search-adapter-full-515d0b91` at `3c08341b`
passes 20 exact cases and Storybook parity (57 families, zero findings), then
retains two failed required gates. `pnpm audit --json` reports one high Zod
3.25.76 advisory through the API (`GHSA-mrhx-c7xc-m3w5`), with zero critical
findings. `pnpm packages:check` reports unsynchronized `packages/csv/package.json`.
Independent worker `lapis-native-search-adapter-baseline-92b6779f` checks out
unchanged parent `5e0dffc3` and reproduces both failures; its audit JSON is
byte-equivalent as parsed data. API dependency maintenance and Plugins CSV
metadata policy own these failures respectively.

Continuation worker `lapis-native-search-adapter-full-6643cf9a` retains four
CSV styling findings from `pnpm check:no-tailwind`: `opacity-0` and
`group-hover:opacity-100` in row actions, plus `overflow-visible` and `group`
in the data table. CSV source owns these findings. Search does not alter the
CSV files, dependency ranges, audits or guards, and these full commands remain
failed. Publication and distribution are outside this source slice.

The shared API observer, final generated command/status contract, complete
Search source/packed/runtime gates and actual application acceptance remain
separate qualification boundaries. No source alias, type shim, consumer patch
or new screen is introduced. Slot4 workers use their own new cache volumes.
