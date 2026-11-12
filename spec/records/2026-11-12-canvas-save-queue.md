# Canvas queued-save qualification

This slice implements LN-CANVAS-024/025/026 after the import-safety slice merged
as `c3a804c83fe0f81983314c6b2a765741b357d809` (PR #77). The canonical Canvas
chapter keeps LN-CANVAS-011 in progress: App editing-session registration,
conditional conflicts, native admission and pending embedded Mira text buffers
are still outstanding. This record does not qualify that broader lifecycle.

## Behavior and exact regressions

A queue captures its original App/file destination and serializes writes.
Explicit flush drains the latest delivered board value; failure keeps that value
for retry and rejects file transitions. A failed older write cannot replace a
newer pending draft. Loading, unloading, reloading and close hooks drain the
existing queue. Slow or superseded reads cannot replace the newer binding or
leave its pane inert. Input is blocked during an active transition, and values
delivered during the read are drained before publication.

The file view now uses the API's existing public `mountComponent` contract.
Settings and save-state props update reactively. Save acknowledgements do not
feed JSON back into board hydration, so selection and editing are not reset.
A save error keeps the board mounted and exposes a Retry save button.

Exact initial command:

```sh
pnpm --filter @lapis-notes/canvas exec vitest run src/canvas-view/canvas-save-lifecycle.test.ts
```

The first five cases failed before editing: wrong-file writes, lost saves on
unload, ignored close errors, concurrent writes and stale mount props. They
passed after repair. Failure-retention and stale-read cases expanded the target
to seven passes. Further transition checks found two failures (pane protection
and draining values delivered during a read); a strengthened stale-read check
also exposed a superseded-read protection regression. The final exact target is
**9 passed / 0 failed**. Assertions were retained or strengthened throughout.

Real workspace plays separately verify that a blocked source write prevents a
file switch and that an injected write failure keeps the board visible and can
be retried. The plays use the fixture-owned App and real vault/file view. They
restore the temporary fault injection in cleanup.

## Validation

- Canvas package check: no errors or warnings; package tests **40 passed** in
  four files. Package build and publint passed.
- Current Canvas Storybook family: **20 passed / 0 failed**, three files.
- Root native check, test and build: **18/18 check tasks**, **1,136 unit tests /
  0 failures**, and **17/17 build tasks**.
- Complete final container interaction/accessibility lane: **64 files passed;
  282 passed / 0 failed / 57 existing skips** across eight shards. Receipt:
  `.local/validation/runs/lapis-plugins-validation-a759497e-fcd5-4036-aede-ee0a00ae3dcc`.
- `pnpm spec:check`: validate, mdBook and spec-first passed. Root check includes
  explicit-App ownership. `pnpm exec spec-validator doctor` passed ten checks
  with the existing custom-script-alias warning. Registry latest spec-validator
  remains the already installed Deno-free `0.2.0`.
- `pnpm audit`: passed with the existing two governed low-severity ignores;
  no ignore changed.
- Static Storybook build passed; release-tool tests **199 passed / 0 failed**.
- Canonical npm packing produced all 17 packages. Canvas runtime build,
  payload verification, test signing, signature verification and deterministic
  signed archive reproduction passed.

A native focused Storybook invocation encountered Vite re-optimization and
failed to import three files without running their tests; a fresh focused run
passed all 20 cases. An earlier full container snapshot was stopped and replaced
after the additional transition regressions changed production source. Only
the complete final snapshot is used as the full-lane receipt.

## Consumer evidence

Consumer: Lapis Notes main `6fbe662e`, with no tracked consumer changes.
Candidate source snapshot:
`9b380c48891e02343a67ce3ee0ade3ead887a858`.
Runtime payload SHA-256:
`4d26edf157dac78b66de0d89410305898e9852663faf088a1d732c11fd4f63dc`.

The ignored single-plugin fixture and runner documented in the import-safety
record were rebuilt for this source snapshot. The temporary test-signed registry
uses the normal schema, signature verifier and installed-plugin loader; it is
not a registry release, source alias or production trust change.

`node .local/canvas-acceptance/run.mjs` in Notes rebuilt its registry-acceptance
Web host and passed **2 tests / 0 failures**. The first retained the prior import,
arrow and read-only embed acceptance. The second installed the packaged Canvas,
held an A.canvas write while requesting B.canvas, proved the old file remained
active and inert until the write completed, then injected a B.canvas write
failure and persisted the retained board through Retry save.

Native packaged Desktop acceptance is not claimed: no executable is available
in the checkout. Visual review remains pending; no baselines changed. No npm
package, public release artifact or registry entry was published.
