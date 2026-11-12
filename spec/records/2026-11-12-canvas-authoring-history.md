# Canvas authoring, history and clipboard qualification

This slice implements LN-CANVAS-032 through LN-CANVAS-035 and the history/
clipboard requirement LN-CANVAS-013. LN-CANVAS-012 remains in progress until
real File Explorer drag-source integration is implemented in its owning source;
standard vault-path/URI-list receiver acceptance does not claim that bridge.

Exact initial regression:

```sh
pnpm exec vitest run --project storybook stories/plugins/canvas/Features.stories.ts -t 'Empty boards create cards'
```

The existing empty board had no Add text card control; the target failed once
before production edits. Creation now supports text, vault-file, media, HTTP(S)
and group cards through a keyboard-accessible toolbar and context actions.
Native modal form input is protected alongside the board by the App producer:
the focused FileAndWebAuthoring target first failed because dialog.inert was
false during a real App guard, then passed after sharing that fence.

Canvas keeps 100 document history entries, coalescing geometry gestures and
completed text sessions. Undo/redo restores full JSON rather than reconstructing
known fields only. Focused text and form input retains native shortcuts. Clipboard
commands preserve selected group contents and internal edges, allocate new IDs,
remap references and retain extensions. Plain Markdown paste creates a text card.
A read-only pending-text snapshot was added after its source regression failed;
it includes virtual drafts without changing dirty state or acknowledging IO.

URI-list parsing handles comments, multiple HTTP(S) targets and existing vault
paths, ignoring unsafe schemes. Drop placement uses the public XYFlow coordinate
contract; all targets in a drop form one document mutation. Source tests cover
validation, field retention, group expansion, identity remapping and history
boundaries. Real plays cover empty-board creation, protected file/web dialogs,
clipboard history, native editor undo, plain paste and pointer/context creation.

The first native browser run after new icon imports invalidated the Vite
optimizer with zero tests. No test configuration or assertion was weakened.
The exact target was rerun after dependency optimization.

Parent PR #81 merged as bc1905b7 after every GitHub workflow passed. Its complete
cold local interaction/accessibility run passed 64 files, 287 tests and the 57
existing skips with zero failures; all three packaged Web cases passed again
against the committed head. This supplements its earlier running receipt.

The drop scenario failed on four targeted runs. Temporary event tracing proved
that ancestor handling consumed drops before a window listener. Canvas now
registers/disposes drop handlers at its owned surface capture boundary, and
clipboard/shortcut handlers on that surface. Exact pointer, count, safe-scheme
and context assertions pass, including undoing an entire multi-card drop once.
The temporary window-bubbling diagnostic was removed after identifying the
integration boundary; no behavior assertion was weakened.

A wider Canvas run exposed one clipboard edge-rendering failure (nodes appear
before XYFlow measures their connector handles). The unchanged exact target
reproduced it. Waiting for the exact two connectors preserves the original
assertion and verifies the completed render; all document/reference assertions
remain. A further cross-board test denied browser clipboard permission and
failed because a view-local fallback disappeared on file switch. The fallback
now belongs to the explicit App, stays isolated from other vault Apps and is
cleared on plugin unload.

## Validation

- Exact empty-board, modal-protection, clipboard-snapshot, drop, connector
  readiness and cross-board fallback targets pass after their recorded failures.
  Authoring/helper tests: **9 passed**; document-session target: **10 passed**.
- Complete Canvas unit suite: **68 passed / 0 failed** in six files. Canvas
  check reports zero errors or warnings. Package build/publint passed.
- Canvas interaction/accessibility family: **32 passed / 0 failed**, three files.
- Complete cold immutable-container interaction/accessibility run: **64 files,
  294 passed, 57 existing skips, 0 failures**. The report is
  `lapis-plugins-validation-c2128c41-aebe-404d-befa-c673caf23786`.
- Root check, test and build: **18/18**, **1,164 unit tests / 0 failures** and
  **17/17** tasks. All 17 npm packs passed. Specification and App-ownership
  gates, audit with the existing two low ignores, and **199 release tests** pass.
  Static Storybook cold build passed.
- Runtime archive reproduction and ephemeral signatures pass. Candidate payload
  SHA-256 is `1bc3b50c9dd9635b7b267da908ab3ed9a281699afead89eabe19290081e6611e`.
- Packaged Web on Notes main `6fbe662e`: **4 passed / 0 failed**. Its new
  empty-board authoring case failed against the previous plugin artifact (no
  Add text card control), while the original three cases passed. The identical
  four-case target passes after the source rebuild and test-signed installation.
  Consumer source, manifests and lockfiles remain unchanged; temporary acceptance
  remains ignored. Installed native Desktop release acceptance is separate.

Stories remain visual-pending. No baselines or publication changed. Registry
marketing capture will be refreshed with the remaining presentation/theme slice
so it reflects the completed UI, separately from visual-baseline approval.
