# Canvas App-owned board persistence

This slice adds LN-CANVAS-027/028 on top of PR #79. LN-CANVAS-011 remains in
progress: virtual text-card buffers and complete rename/native host lifecycle
qualification are separate work. Publication and visual baseline approval remain
separate gates.

The file view registers one captured App/file writer before exposing the board.
It awaits native admission and supplies synchronous input protection and saved
bytes. App guards drain the board queue. FileTextPersistence, imported through
the public API root, writes conditionally against acknowledged bytes and owns
reviewed conflict actions. The API's optional capability contract (Notes LN-ARCH-142, LN-PKG-167/168)
preserves legacy persistence on hosts that do not advertise conditional text
writes. Failed conditional writes never fall back to unconditional writes.
The browser OPFS and legacy Desktop adapters intentionally lack that optional
capability, so atomic external conflict acceptance is limited to advertised
adapters (the real Memory vault story and native contract fixtures).
Unexpected unload unregisters the producer but keeps failed dirty state and the
protected component until App recovery succeeds. Own-save acknowledgement still
does not rehydrate the board. The API peer floor advances to ^0.2.4.

Exact regression:

```sh
pnpm --filter @lapis-notes/canvas exec vitest run src/canvas-view/canvas-save-lifecycle.test.ts
```

Before production edits the original nine cases passed and two new cases failed:
missing App registration and unconditional persistence. The expanded target also
covers conflict choices, retained teardown, native admission and App guards.
One added teardown regression exposed a transient false-clean notification
between removing the pending buffer and reserving the active write. Reserving
the flight before status notification repairs that lifecycle gap.

The pre-existing controlled read tests now wait for asynchronous admission to
settle rather than assuming a single microtask. All original behavioral
assertions remain. Story fault injections target conditional persistence,
which is the new production write boundary. ExternalConflict uses a real vault
external write and the public conflict recovery action.

The initial packaged Web run found three failures after conditional writes
were incorrectly required on an OPFS host without the optional capability.
The exact added legacy-capability regression failed once before repair. A further failing regression requires a captured conditional writer never to switch to unconditional IO if capability advertisement later disappears. The
plugin now follows the existing public API capability contract. This is not an
OPFS source defect, and no consumer workaround or adapter mutation is used.

## Validation

- Exact lifecycle target: **18 passed / 0 failed**. Complete Canvas unit suite:
  **49 passed / 0 failed** in four files.
- Canvas interaction/accessibility family: **21 passed / 0 failed** in three
  files, including real Memory-vault conditional conflict recovery.
- Root check, test and build: **18/18**, **1,145 unit tests / 0 failures**, and
  **17/17** tasks. Package build/publint and all 17 npm packs passed.
- Canonical specification check passed all three lanes. Doctor passed ten
  checks with the existing custom-alias warning. App-ownership audit passed in
  the root check. Audit passed with the existing two recorded low ignores.
- Release tooling: **199 passed / 0 failed**. Static Storybook cold build passed.
  Canvas runtime payload, archive reproduction and ephemeral signatures passed.
  Candidate payload SHA-256:
  `cc2c2d438584ce7d3b109d7348cc29060e1b4665e310c6030c49673089bd5538`.
- Packaged Web consumer on Notes main `6fbe662e`: **2 passed / 0 failed** after
  the optional-capability repair. The initial third test incorrectly expected
  atomic conflicts on OPFS without that optional capability; the canonical API
  contract establishes why it is inapplicable. Conditional acceptance remains
  enforced by the real Memory-vault story and focused unit tests. No consumer
  source, manifests or lockfiles changed; the existing ignored, ephemeral,
  test-signed registry fixture installs the packaged plugin through the real
  host loader. Native Desktop release acceptance is not claimed.
- Complete final Storybook container interaction/accessibility run is in
  progress on an immutable source snapshot. The superseded pre-compatibility
  run was stopped after the source changed. Merge remains gated on the full
  interaction lane and complete required GitHub workflows; no baseline changed.

