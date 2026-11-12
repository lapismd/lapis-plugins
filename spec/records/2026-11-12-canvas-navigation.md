# Canvas navigation qualification

LN-CANVAS-048 provides camera navigation and help for LN-CANVAS-019. The exact
browser target was:

    pnpm exec vitest run --project storybook stories/plugins/canvas/Navigation.stories.ts

It failed once before production changes because Canvas help did not exist.
The repaired target passes help focus return, App-protected modal input,
fit-selection, zoom reset, Alt-arrow panning, named-group jumps and untouched
form input. The original stored Canvas bytes remain identical after navigation.

One intermediate check compared camera transforms while the preceding group
animation was still finishing. The corrected check waits for the completed
group jump before typing shortcut-like text into a native creation form; it
then proves both input text and camera state are unchanged. No delay or
assertion weakening hides keyboard behavior.

The focused board owns its capturing keyboard listener and removes it on
teardown. Nested boards do not receive their parent's navigation commands.
Native form/contenteditable targets and already-handled shortcuts remain
untouched. Reduced-motion preferences remove camera animation. Read-only help
omits card movement and selection instructions, and responsive controls wrap
inside their own pane rather than requiring a fixed viewport width.

The duplicate-source read-only scenario exposed one landmark-unique axe
failure: two named sections for the same Canvas became duplicate region
landmarks. LN-CANVAS-049 identifies each embedded board as a named widget
group. The source label stays available while repeated embedded content does
not add duplicate note-section landmarks. No accessibility exclusion is added.

Source diagnostics report zero errors and warnings. Wider catalog, runtime and
installed-host receipts follow qualification. Stories remain visual-pending;
publication and baseline approval remain separate gates.

Native Explorer qualification uses the existing public File Explorer view and
real HTML drag events. After correcting the fixture to open its initially
empty sidebar, the exact native target failed once: adding the first card
changed the camera from translate(0,0) to translate(-222.5,-111). The owning
Canvas fit controller now finishes startup for empty boards and cancels a
pending startup fit on user interaction. Responsive read-only fitting remains
separate. The test checks the original note, screen and stored drop coordinates,
unchanged camera and one-step undo. A prior attempt used stale local static
output; the native lane now builds its own fresh packages and Storybook first.

The navigation family passes all four cases with axe, and the cold candidate
passes 67 families, 313 tests and 57 existing skips with no failures (run
4eb9fd92-202f-42ae-81ea-0277294bc6f5). The subsequent connector placement
regression adds one fixture, independently qualified by the complete parent
catalog and native lane. The combined final native candidate passes all 12
cases, including both navigation tests and real Explorer drops.

Installed Web acceptance passes the eight prior cases and the exact added
navigation/repeated-embed case. Its first attempt opened the note in the host's
default editing mode, where Canvas syntax is source text; the final test uses
the existing reading-mode toolbar action before checking the two embeds. It
proves real help/shortcut controls, group jumps, independent sibling cameras
and byte-for-byte source retention. No assertion or source contract is relaxed.
Final candidate-wide receipts follow the committed source qualification.

The final independent navigation candidate passes all 67 catalog families,
314 tests and 57 existing skips, with zero failures (run
04d7ee19-89b2-4053-a3d4-e9a5116baae5). Root check/test/spec pass, all 17
packages pack, and the signed source runtime qualifies installed Web navigation.
The exact consumer case now passes after entering the real reading surface.
