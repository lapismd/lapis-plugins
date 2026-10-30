# Shared native History observation — qualified source

Updated 2026-10-26 11:17:14 UTC. Source qualification is complete with the explicitly
accepted unchanged dependency, CSV-style and release-lock findings retained.
This does not complete Desktop adoption, hosted reader/screen adoption or R3.

## Scope and provenance

The source is Desktop `05d0e8abb802a7fc4ed1a762908b404406f2b9b6`: its existing
`HistoryIndexController`, indexed response validators and query/context shape. Plugins owns the public controller,
`nativeIndexedHistory` and Repository provider registration. Notes owns generated
DTOs and the already admitted `NativeHistoryIndex` port; hosts retain native
admission, saved reads, activation and lifetime.

The controller starts once, observes cached status once per second, reports
distinct failures and recovers without starting again. Disposal drains its
accepted read, drops late updates and stops only observation. The provider
removes renderer batch loops, query-triggered scheduling and backup capture
subscriptions. The App port takes precedence over injected indexed services.
No port is acquired automatically by ordinary profiles.

The public leaf controller/adapter imports support pure Node transport code.
The aggregate Repository entry also exports Svelte views and uses the ordinary
application bundler; Desktop's initially failing aggregate import remains in
its consumer record and is corrected by the existing public leaf entrypoints.

## Exact before and after

- `node --import <installed-tsx>/dist/loader.mjs --test
packages/history/test/repository/repository-indexed-search.test.mjs`:
  **2 failing before**, **2 passing after**. Both original failures are the
  absent `start` observer entry, not timeouts or fixture failures.
- The new adapter's test-only attempt failed to import its not-yet-created
  module. Combined observer/adapter acceptance now passes **7/7**, retaining
  exact commands, native failure identity, response-kind rejection and
  Desktop's immutable-ID/page/cursor/context validation.
- The exact provider/selection Vitest target passes **5/5**. All owning History
  Vitest cases pass **20/20**; the complete retained Repository Node suite
  passes **91/91** (84 original plus seven new cases).

Direct Node 26 startup first rejected the removed
`--experimental-transform-types` option; strip-only startup then rejected
constructor parameter properties. The explicit installed `tsx` loader produced
the actual two-failure baseline above. These loader failures are not counted as
functional failures. Docker attempts also retained their refused-SSH/input
transfer failures until the shared validation SSH master was reconstructed.

These small initial dependency-free checks deliberately used the installed
`tsx` loader. All package, catalog and artifact qualification below uses frozen
isolated Docker, without native fallback.

## Complete source and artifact gates

Frozen package source `fd82f08e72549863218ed4f672eea1c8841a9210` passes strict
History checks with zero errors/warnings, public build, publint and npm packing
against Notes API `c91a8d15` from frozen `34650276`. That API candidate includes
App/session fields and passes 3 App, 6 hosted, 1,628 API and 79 Web cases plus
strict public declaration checks. Broader Notes/host gates are separate.

Frozen full source `8d5b7609c2c7bf82dcd700acd42be54f15462586` passes:

- All **1,010 Vitest plus 91 Node package cases** (1,101 total).
- All 16 strict check tasks and 15 build/publint tasks.
- All **285** cold catalog interaction/accessibility cases in four bounded
  shards (68, 92, 54 and 71), followed by static Storybook.
- Canonical validation, mdBook, spec-first, App ownership, 58-family story
  composition and package/registry boundaries.
- Two History runtime builds and payload verification; the payload bytes are
  identical with SHA-256
  `ececef12fe4cca7568c7ada1a430d00005f619788e373e121ca4d99edda7831e`.

Npm archive `0fa89766e6501c7d868772e2da4617598b31c13d385d5942d5448f858ae534f0`
retains the qualified public package. No package or baseline was published.

## Explicit unchanged findings

The failed aggregate remains failed. `pnpm audit` reports one high Zod advisory
`GHSA-mrhx-c7xc-m3w5` through API; `check:no-tailwind` reports four existing CSV
utilities; release tooling passes **139/140**, with its known OIDC lockfile
policy failure. These belong to API dependency repair, CSV styling and Plugins
release tooling respectively, not History observation.

All three failures reproduce on clean parent `e0144c6a`. Five relevant lock,
assertion and CSV inputs are byte-identical between the parent and candidate.
The same failures were already recorded and accepted during Search intake;
the standing instruction to choose the logical backlog-completion answer
permits retaining that scoped exception without reopening unrelated repairs.
No audit ignore, assertion, metadata policy or visual baseline was weakened.

## Remaining host gates

Hosted still needs an admitted Repository reader before mounting the retained
screen. The Rust minimal profile does not register that plugin yet. A passing
HTTP index route does not prove saved comparison, restore or full History
parity. Desktop consumes the public leaf controller/adapter and retains separate
native acceptance. Default cutover, dependency-floor release and publication
remain separate; legacy AppDatabase History capture is unchanged.
