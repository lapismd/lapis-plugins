# Canvas text-to-note qualification

LN-CANVAS-056/057 implement LN-CANVAS-023. The exact helper target was
`pnpm --dir packages/canvas exec vitest run src/lib/canvas-note-conversion.test.ts`.
It initially failed one suite import with no cases. Eight cases now pass:
pending Markdown flush, failed flush admission, exact note contents and lossless
replacement, vault creation failure, stale completion, concurrent target edits,
missing targets and portable filenames.

The owning App's public file manager chooses a collision-free path and its
vault creates the Markdown note before changing the card. The replacement
retains identity, position, dimensions, edges and unknown fields. One undo
restores the text card while keeping the created note. A failed create leaves
the original card and a visible retryable error. Native dialogs share the App
input fence, and conversion captures App/path/document-session identity before
asynchronous admission. Disposal or a later source refuses replacement.

The first source check found two test-fixture excess-property type errors.
The fixture now imports extended JSON through the real Canvas parser, retaining
all unknown-field assertions. Final package diagnostics report zero errors and
warnings and all 141 Canvas units pass. Two interaction/axe plays verify
collision retention, exact content, extensions, complete undo/redo and failed
creation followed by retry; the native fixture also passes its readiness play.

Actual native browser acceptance flushes pending Mira text before replacement
and retains that note through undo. A second case changes the owning leaf's
file while vault creation is deferred, then proves neither the old nor new
board is replaced. The first editing attempt did not establish the intended
selected-card hover; the final fixture hovers and asserts the real Edit control
accepts pointer input before clicking. No forced click or exclusion is used.
The complete fresh native catalog then passes all 16 cases before the later
web-isolation and PNG additions.

Root check/test/spec, 203 release-tool cases and all 17 npm packs pass. The
complete cold interaction/accessibility catalog passes 70 families, 322 cases
and 57 existing skips with zero failures
(7028d8d9-2b29-4f0d-8aa9-a7cc6ca3ff12). The first wider run inherited the
Web slice's old Link-button assertion; the repaired native-anchor contract
passes in the complete repeated run. No assertion was weakened.

Final normal-registry intake uses Mira 0.1.5 and Design Core 0.12.4. Root
checks, units and specification pass, and the repeated complete cold catalog
passes 70 families, 322 cases, 57 existing skips and zero failures
(eb8abdf1-1d0c-458d-9a9d-f96765e5cf6b). All 17 local npm packs pass.

The deterministic runtime and test-signed registry fixture from
6c390356e2c0ba153b7a11d3f2a233a4ee8b51b9 pass verification. Installed Web
acceptance passes actual pending-editor conversion, preserves the colliding
original note and card extensions/edges, and restores the text card with undo
while retaining the created note. The combined candidate passes all 22 native
browser cases.

Stories remain visual-pending. This slice does not publish a package or change
a baseline; installed Desktop release qualification remains separate.
