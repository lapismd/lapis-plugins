# Canvas touch qualification

LN-CANVAS-051/052 implement the native touch workflow under LN-CANVAS-020.
The exact pure target was:

    pnpm --dir packages/canvas exec vitest run src/lib/canvas-long-press.test.ts

Before implementation, one suite failed to import the missing helper and no
cases ran. All four cases now pass: a stationary 500ms hold; cancellation on
movement beyond 10px, release, a second contact and non-pane starts; a late
App-protection check; and disposal that removes pending work and refuses new
starts. Owning-surface and document pointer listeners are removed on teardown.

Touch panning uses the public XYFlow mouse-button list so ordinary left-mouse
box selection remains available while touch reaches native panning. Pinch zoom
is explicit. Long press opens the existing pointer-positioned creation menu;
card creation and undo continue through the existing parent board controller.

Explicit native checkboxes select multiple cards without a keyboard modifier.
They expose real labels, preserve stored bytes, disable during App protection,
and enable the existing group action and undo. The focused two-story family
passes interaction and axe. An initial Svelte accessibility warning on the
native details keyboard handler was repaired with a disposable DOM listener;
the final source check has zero errors or warnings. All 122 Canvas units pass.

Coarse-pointer presentation exposes selected-card connection and edit actions,
44px resize/connection targets and larger toolbar controls without hover.
Native browser acceptance drives actual CDP touch contacts and touchscreen taps,
including panning, pinch zoom, long press, selection, movement, resize, editing,
grouping and connection creation. Qualification receipts follow below.

Local native preparation first lacked a newly merged Bases dependency; the
frozen workspace refresh repairs installation. The separate qualification
workspace additionally needed the parked Sync package's own frozen install,
matching the standard validation worker preparation. These were install/build
failures before browser cases ran, not ignored functional failures. Stories
remain visual-pending, and publication and visual baselines remain separate.

The first real touch run passes three cases (pan/pinch, long press, and
connection creation) and fails the combined manipulation case at resize.
Hit-testing proves the 44px control receives the contact. The bridge still
serialized the original CSS dimensions while public XYFlow resizing updates
node.width/height. The exact additional bridge target initially fails one case
and passes after the repair. Both creators, persistence, grouping bounds and
camera helpers now use the public geometry fields, retaining a legacy-style
fallback. Imported small geometry and public style helpers remain supported.
Separate native mouse acceptance verifies cards, groups, undo and redo.

The final cold catalog passes all 68 families, 316 tests and 57 existing skips,
with zero failures (run d5a7d2b6-03cf-45e5-9b74-5729d237ee6c). Root check/test,
specification, audit and all 203 release-tool tests pass. All 12 native cases
pass from a fresh package/static build, including both endpoint workflows,
Explorer drops, navigation, mouse resizing and all four touch cases.

The affected-family run first exposed two functional failures: an edge-count
assertion ran before measured endpoints were ready, and enabling right-button
panning consumed the existing creation context menu. The fixture now waits
for the same exact edge count, and touch admission retains only middle-button
mouse panning so native right-click creation remains available. The original
context target passes after the fix. Several local attempts failed before
case execution on stale Vite imports or an iframe transport disconnect. A
fresh diagnostic configuration and regenerated local cache pass the exact
target; the complete immutable cold lane then passes every affected case with
zero unhandled errors. No test exclusion, threshold or assertion is relaxed.

All 17 npm packages pack successfully. The source runtime archive verifies and
installs through a test-signed registry into the real Web host. Native touch
acceptance passes persistent card resize, retained extension fields, undo,
explicit multi-selection, grouping and stationary-hold creation; a final undo
restores the complete original document. Two earlier fixture failures attempted
grouping without reselecting the card cleared by undo, then held on a point
covered by rendered content. The final fixture checks both selection states
and hit-tests an actually exposed empty pane. No product assertion is removed.
The same installed source retains the previously qualified navigation and
connector behavior. Publication and installed native Desktop qualification
remain separate gates.
