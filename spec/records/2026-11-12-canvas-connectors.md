# Canvas connector workflow qualification

LN-CANVAS-046/047 implement both-end reconnection, attached-card navigation
and linked-card creation under LN-CANVAS-018. The pure regression target was:

    pnpm --dir packages/canvas exec vitest run src/lib/canvas-connections.test.ts

It initially failed because the helper was absent. All five cases now pass:
both endpoints retain imported connector fields, missing identities fail
without mutation, and both starting-handle directions allocate fresh card and
connector identities while preserving the original document.

The exact browser target was:

    pnpm exec vitest run --project storybook stories/plugins/canvas/Connections.stories.ts

EndpointEditing initially failed because there were no reconnect anchors.
Both final stories pass, including the keyboard endpoint form, side changes,
App-protected fieldset, follow-target navigation, persistent undo and imported
node/connector/document retention. Escape closes the native details menu and
returns focus to its summary. The selected edge remains selected after an
explicit endpoint edit, allowing repeated corrections.

The built public Storybook also passes four native Playwright cases:

    pnpm test:canvas-browser

These drive actual mouse events for source reconnection, target reconnection,
cancellation and a new connection dropped on empty board space. A new card and
connector form one undo entry. Cancelling reconnection preserves the original
edge and does not create a card. App protection also rejects both new and
reconnected gestures that started before the input hold. The native lane is required by the static CI
job; synthetic Storybook pointer events alone do not qualify these gestures.
An initial missing brace in the new test file was corrected before all three
gesture cases and the protection case passed. The public lane builds fresh
package and Storybook output and uses the normal validation wrapper. Its first
release-policy check caught the direct-script bypass (one failure); routing
the lane through the existing wrapper repairs that exact regression and all
203 release-tool tests pass. No assertions or thresholds were weakened.

The complete Canvas unit suite passes 118 cases, and source diagnostics report
zero errors/warnings. Root check, unit and build lanes pass 18/18, 18/18 and
17/17 tasks. The cold catalog candidate passes 66 families, 307 tests and
57 existing skips with zero failures (run 6ff5e59c-b2dd-4068-8d70-e54b290a6336).
The final in-flight protection hook is additionally qualified by all four
native gesture cases. All 17 npm packages pack successfully. Final committed
runtime and installed-host receipts follow qualification. Visual stories remain
visual-pending and release publication remains separately gated.

Installed OPFS acceptance passes the seven prior cases but initially failed
the new connector workflow once: the top authoring panel intercepted the
Reconnect control. The connector toolbar now reserves fixed-panel bounds when
choosing above/below placement, rather than obscuring either control surface.
The exact installed regression is repeated with the candidate runtime.

The fixed-panel regression required a vertical offset as well as an above/below
choice when the connector anchor itself lay inside the authoring panel. The
installed exact case now passes native pointer creation, both-end endpoint
editing, preservation and undo (one pass). An intermediate attempt used a
wrapped-label locator whose text included its option children; the final test
uses the unchanged combobox accessible name. The tracked constrained-toolbar
fixture and native pointer test retain source-owned regression coverage.

Final source qualification passes all five cold native cases, including the
tracked constrained-toolbar regression. Root checks, tests, spec and release
tooling pass; the cold catalog passes 66 families, 310 tests and 57 existing
skips, with zero failures (run 2e279e06-c331-425e-aa0e-add486f8eb11). The
repaired installed native workflow passes without force clicks or relaxed
assertions. Its candidate runtime payload is SHA-256
8653e1af774345c005d673f180e6cd478ead42b8b57ae9277c32adbad6493f74.
