# Canvas export camera readiness

Main CI `43571108497` failed `pnpm test:storybook -- --shard=3/4` with
43 passing cases and one failure in
`stories/plugins/canvas/Export.stories.ts`,
`Export privacy, quality and focus remain accessible`.
It compared inline `translate(-9.49971px, 288px) scale(0.999999)` captured
during Reset zoom against the final `translate(-9.5px, 288px) scale(1)`.
The readiness getter read a rounded computed CSS matrix, which could report
scale 1 before the underlying inline transform reached 1.

The story now reads the exact inline matrix for its existing scale-1 wait.
The final byte-for-byte camera style comparison, focus restoration, source-byte
comparison, privacy defaults and all browser budgets remain unchanged.
No product implementation, visual baseline, fixture or shared setup changes.

The exact local single-story command was run before editing and passed;
the hosted failure is retained as the before evidence, not claimed as a local
reproduction. The same command passes after the change (one selected case;
three other cases deselected by the explicit selector). Fresh Docker acceptance
then passes all 66 Canvas interaction/accessibility cases across 11 files.
All 51 package build/check/test tasks pass, including 149 Canvas unit cases;
all three specification lanes, 223 release-tool tests, the unchanged governed
audit policy and a fresh static Storybook build pass.

Reports and logs: focused before `a79fff14-0fa5-455d-b457-85e07e9fd407`,
focused after `4ed43d9a-dc29-4575-a8e5-82133366c0dd`, and
`/tmp/canvas-export-camera-qualification.log` for the complete affected surface.
Broader hosted PR qualification remains separate from these local receipts.
