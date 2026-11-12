# Canvas shared contrast and accessibility qualification

This slice implements the shared palette under LN-CANVAS-040 and the
Canvas-owned accessibility boundary under LN-CANVAS-041. Approved registry
Mira 0.1.5 intake and signed installed Web acceptance now complete that boundary.
The following early packed-candidate receipts precede the final registry run.

The four initial browser contrast targets failed after correcting the first
editable-card selector: light connectors measured 2.34:1, a dark card measured
1.37:1 and an embed label measured 4.44:1. KeyboardDescriptions failed because
screen-reader descriptions and announcements were display:none. Exact targets
now pass with the packed upstream fix, without excluding card content.

One board palette resolves actual computed theme and preset values in its
owning document, including CSS Color 4 and inherited transparency. It observes
owned ancestors and stylesheet/theme changes and disposes its observers.
Custom JSON hex colours use pure luminance/contrast calculations. Presentation
adjustments never change stored colours. Cards share fill, text, metadata,
links, borders and group labels across views and embeds; connectors retain a
contrasting halo when crossing other cards. Controls expose visible focus.

Mira owns the inactive preview-button and overflowing-scroll-region defects.
Their source fixes are in Mira PR #31, merged as def0f2c9 after every workflow
passed. Its source gates passed 527 unit tests, 180 interaction stories and
61 native browser cases, plus checks/build/packing/static/spec lanes. Its 0.1.5
version candidate is Mira PR #32. The separately approved 0.1.5 publication
completed before final normal-registry consumer qualification.
Canvas uses public Mira theme tokens rather than copying its implementation or
adding a CSS patch to conceal the accessibility defect.

Canvas's pure matrix checks reference luminance and all 216 sampled RGB colours
in each mode, with ordinary/group card text, links, borders and selection
contrast. Browser plays measure the painted colour values, preset override
adoption, focus rings and unchanged source bytes. The four current focused
colour/focus stories pass; the complete Canvas unit suite passes 94 cases.

Packed upstream acceptance passed all five new accessibility/contrast plays,
then 65 catalog files, 305 passes, 57 existing skips and zero failures in run
af8418c0-e2e0-44c0-a4f4-184baf052f1b. A repeat against the final Mira CSS candidate
also completed without functional failures; its receipt is supplemented after
all reports and registry intake are collected. Temporary candidate archives
are installed only in immutable validation containers. Source manifests,
lockfiles and node_modules retain registry dependencies.

PR #84 live-embed qualification finished with 300 passes, 57 existing skips and
zero failures in 64 files (run 935b55c8-112f-4eca-85f1-a74ee3e02710). Its committed,
test-signed runtime passed all five installed Web cases. It merged as e21ffeb9.

Final normal-registry qualification uses Mira 0.1.5 and Design Core 0.12.4.
All 148 Canvas units and seven accessibility stories pass. The additional two
stories measure authoring, web-card, export, conversion and group-background
controls/dialogs in both themes. One new native touch case initially failed
because the selected Edit control retained pointer-events:none; the coarse
pointer rule now enables it, and the exact cold case passes. Selected-only
desktop hover behavior is retained without a duplicate all-card hover rule.

The complete fresh native candidate passes all 22 cases. Its test-signed
runtime from b1b8403533f19054bc91e5c0074dbed437d907be passes all 14 installed
Web cases, including measured 4.5:1 text contrast for all presets and custom
black/white in boards and note embeds through live light/dark changes. Source
bytes remain unchanged. A later PNG crop repair is qualified separately.

Registry banner and note-embed gallery images are refreshed in light and dark
at the governed density. `pnpm registry:media:check -- --plugin canvas
--storybook-dir storybook-static` verifies both deterministic media items.
No visual baselines or public release assets changed. Installed native Desktop
release qualification and Canvas publication remain separate gates.

Reviewing the refreshed media exposed an imported group painted over its
contents. The exact native hit-test initially failed once; group background
paint now stays below ordinary cards and connectors without modifying flow
zIndex or stored array order. Four native cases pass light/dark editable/embed
surfaces. The full cold native suite passes all 27 cases.

The same review expanded the existing colour matrix to minimap outlines and
attribution links. Four minimap cases initially failed, including a light
minimap in a dark note embed; public MiniMap colour/mask props now follow the
owning board palette, with transparent group fills and contrasting outlines.
Three attribution cases measured 1.14–2.85:1; owned Canvas chrome now supplies
its readable text and focus colours. A further dark embed case revealed the
outer Markdown link rule winning the cascade; the Canvas chrome selector now
owns that boundary without changing Markdown content styling.

Two workflow-control plays exposed fixture sequencing after closing a native
dialog. They now await the existing focus-return contract before moving to the
next card and use explicit card-selection controls; keyboard navigation keeps
its separate native qualification. The registry plays verify Explorer through its real filename
button rather than an unsupported view attribute. Existing assertions remain.

One combined installed run passed 13 cases and lost its execution context
during conversion fixture creation, before exercising conversion. The exact
same installed conversion target passes on a fresh run. Final repeated full
consumer qualification follows the presentation repairs below.

Actual group-label paint exposed a further stylesheet precedence defect: the
later generic input background overrode the badge's transparent input surface.
The stronger regression measures the input's complete ancestor-composited
background, rather than assuming its parent's fill, and fails the dark board
once. Scoping the existing group-label rule to its Canvas shell restores the
badge surface and readable text, including its placeholder. All nine focused
accessibility/registry stories pass after that exact repair.

The repeated full installed Web run passes all 14 cases with zero failures.
Final source and consumer receipts after the badge repair follow below.

Final export presentation review also found selected-connector editing chrome
entering the private snapshot. A focused DOM regression first needed jsdom's
absent SVGImageElement constructor represented for its image-free fixture,
then failed with three retained controls. The exact case now passes: toolbar,
reconnection targets, hit area and draft editor are omitted; a selected label
becomes static text with geometry and its original label retained. Native PNG
acceptance now exports an actually selected connector and rejects button/select
markup in the rendered snapshot input.

Final qualification uses normal registry Mira 0.1.5/Core 0.12.4 and the patched
root/standalone Hono graphs. All 149 Canvas units, root check/test/spec,
App-ownership, all 203 release-tool cases and all 27 cold native browser cases
pass. Both exact audits have zero active findings and retain their existing
governed low findings. Doctor passes with the known wrapper-alias warning;
QMD semantic discovery remains available.

The verified runtime and signed fixture from
e262581516da8ce5d242d9dd38b0dda19dda6a1e reproduce payload SHA-256
f4eff612f1f122516c1d17e94c02c27440c483cfcb8c71102a52f11a82e5d4cc.
Its complete installed Web run passes all 14 cases with zero failures. The
contrast case now includes an imported enclosing group and measures its label
against actual backgrounds in both board surfaces and modes. The PNG case
exports a selected connector, inspects real rasterizer input for redaction and
absent controls/frames, and verifies nonempty pixels, full dimensions and
unchanged source/camera. All 17 local npm packs pass, and both deterministic
registry media items pass after the corrected badge capture.

The final complete cold interaction/accessibility catalog passes 72 families,
333 cases and 57 existing skips with zero failures
(4ddc2437-56a1-4559-b647-497fd757bcb0), using no validation archives. All 17
builds/publint/npm packs pass again in
6c187b94-85d6-4a7b-ba69-6029d3794dbe. All 60 Canvas requirement rows now have
implementation evidence. Visual review remains pending; no baseline, Canvas
publication or installed Desktop release qualification is implied.
