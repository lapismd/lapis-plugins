# Canvas pending text-card writer qualification

This slice completes the source writer lifecycle under LN-CANVAS-011 with
LN-CANVAS-029/030/031. It builds on PR #80's App-owned document producer.
Virtual Mira editors bind to that producer rather than synthetic vault paths.
Their pending buffers contribute to the Canvas dirty state before debounce,
flush before graph persistence, and acknowledge only after JSON durability.
Synchronous holds cover existing and newly bound virtual editors. Protected
local/external/merged recovery and native refresh synchronize child buffers
before releasing protection. Unexpected detached failures retain the component
and remain discoverable through the original App registry.

Exact regression:

```sh
pnpm --filter @lapis-notes/canvas exec vitest run src/lib/canvas-document-session.test.ts
```

All six initial cases failed before implementation: missing dirty ownership,
parent flush, durable acknowledgement, synchronous holds and complete conflict
recovery. They pass after repair. An additional native refresh regression failed
because the clean editor buffer stayed stale; protected refresh now resets it
alongside the parent document. The expanded target also covers retained failed
teardown and reviewed merged text.

Real Mira/workspace plays verify pending text before file switch, before the
public file manager's guarded rename, and during conditional conflict recovery.
The rename play edits again afterward to prove the new destination binding.
A native Vite optimizer invalidation caused one import failure with zero tests;
the exact unchanged target was rerun before attributing it to product code.

Parent PR #80's final immutable container run passed 64 story files with
283 passed, 57 existing skips and zero functional/accessibility failures. Both
packaged Web cases passed again against its committed head 0985975d. The parent
record's running status is historical; its PR description has the completed
receipts.

The public optional-capability contract remains unchanged: conditional conflicts
are qualified on supporting adapters; OPFS/legacy Desktop retain existing
persistence. Installed native Desktop release acceptance and publication remain
separate gates. Stories remain visual-pending, with no baseline changes.

## Validation

- Exact document-session target: **9 passed / 0 failed** after the initial six
  failures and the additional native-refresh failure were repaired.
- Complete Canvas unit suite: **58 passed / 0 failed** in five files. Canvas
  check reports no errors or warnings; package build/publint passed.
- Canvas interaction/accessibility family: **25 passed / 0 failed** in three
  files. All four new real-editor plays pass. The external-version play first
  assumed an explicit recovery would keep the editor open; review rehydrates
  selection and closes editing. Its corrected contract verifies the accepted
  preview, reopens the real editor and checks its buffer, persisted bytes and
  clean state. Normal save acknowledgements still retain selection/editing.
- Root check, test and build: **18/18** tasks, **1,154 unit tests / 0 failures**,
  **17/17** build tasks. All 17 npm packs passed. Audit passed with the existing
  two recorded low ignores; specification and App-ownership gates passed.
- Release tools: **199 passed / 0 failed**. Static Storybook cold build passed.
  Runtime archive reproduction and ephemeral signatures passed. Candidate
  payload SHA-256:
  `b88e4e8ea99bb1715a388b92995a2ae2cc5808179a48330312309ec4ae0b495e`.
- Packaged Web on Notes main `6fbe662e`: **3 passed / 0 failed**. The new
  pending-editor case failed on PR #80's previous artifact (dirty state was
  false) while its two existing cases passed. The identical three-case target
  passes with this source's rebuilt, test-signed plugin. Consumer source,
  manifests and lockfiles remain unchanged; temporary acceptance stays ignored.
- Complete cold container interaction/accessibility qualification is running on
  an immutable source snapshot; merge remains gated on that lane and every
  complete required GitHub workflow. Visual review remains pending with no
  baseline changes.

