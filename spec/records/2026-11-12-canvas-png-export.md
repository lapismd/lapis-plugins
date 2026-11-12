# Canvas PNG export qualification

LN-CANVAS-058/059 implement LN-CANVAS-022. Three geometry/quality tests initially
failed to import the missing helper (one suite, zero cases). All three pass:
full-board bounds independent of the camera, exact viewport crop/transform and
rejection of invalid or oversized quality requests without silent scaling.
Output is bounded to 16384 pixels per side and 32 megapixels.

Editable boards offer whole-board or viewport PNG export, 1x/2x/4x quality,
transparency and independent content choices. File contents/paths, web addresses
and images are omitted by default. The private inert snapshot copies rendered
styles, retains geometry, and strips browsing contexts, network URLs, event
attributes and editing controls. Optional local images use already decoded
pixels; export never fetches remote images or fonts. Captured board ownership
prevents a later source from receiving a stale download.

The first source check found two unsupported ControlButton bind properties;
focus restoration now uses the owning control DOM without a type shim. Package
diagnostics report zero errors/warnings and all 144 Canvas units pass. Initial
Storybook imports used stale public dist; rebuilding the owning package fixed
that preparation failure. The options story then exposed an initial-camera
animation in its fixture: it now waits for boot fitting, explicitly resets zoom
and awaits exactly 1 before recording camera retention. All four focused
interaction/axe stories pass, including the open dialog and empty-board reason.

Native downloads first proved PNG signatures, exact dimensions, redaction,
explicit disclosure and unchanged source/camera. The cleanup assertion wrongly
matched the persistent dialog heading as well as private snapshot divs; its
corrected exact DOM target passes. A stronger check decoded the actual PNG
pixels and exposed a real blank-output defect: an offscreen left coordinate
survived computed logical positioning. Moving the private host offscreen with
a transform and clearing that transform for rasterization fixes the same exact
pixel assertion. No threshold was lowered.

All four native PNG cases now pass: nonempty full-board output at 2732x632,
default privacy/no remote requests; a correctly cropped transparent viewport
with explicit content disclosure; a clear missing-capability reason; and
rasterization failure with original bytes retained and private DOM removed.
The preceding complete 21-case run passed 19 cases and exposed the pixel defect
plus the Web slice's incomplete isolated-host fixture. Each failure is repaired
at its owning boundary; final combined receipts follow below.

html-to-image 1.11.13 is an ordinary declared registry dependency; the lockfile
adds only its direct dependency edge. No baseline or package publication occurs.

Visual inspection of the installed download exposed curved connectors above
the node-only crop. A new exact browser regression failed once: expected a
397px image including the curve, received 316px. Whole-board bounds now union
the painted connectors, arrowheads and labels with card geometry before adding
padding, converting screen extents back through the current camera. The 2x
fixture consequently becomes 2732x794 rather than clipping its connector at
2732x632. Viewport exports retain their deliberately selected crop.

The exact curved-connector regression passes after a cold build. All five PNG
cases and the complete 22-case pre-theme native suite pass. The repeated full
catalog passes 71 families, 326 cases, 57 existing skips and zero failures
(493a5177-5c09-4935-bf01-619de4f5b120). Root check/test/spec, 203 release-tool
cases, all 17 builds/publint/npm packs and deterministic runtime verification
pass. The signed combined runtime from c33da349bbe395aea18ba15055a29c56cdf0e41c
passes installed Web PNG acceptance with nonempty 2732x794 output, default
privacy, no remote requests, unchanged camera/source and private DOM disposal.

The later mandatory audit discovered two newly indexed moderate advisories in
the existing MCP dependency graph. The lockfile now resolves the already
allowed @hono/node-server range to registry 2.1.6, preserving every other
resolution and matching its registry integrity/peer metadata. Frozen install
and audit pass: zero active findings, with the same two governed low findings.
Root checks and units pass again after intake. No exception is added.

Advisories: https://github.com/advisories/GHSA-qv5m-9pm6-hqp3 and
https://github.com/advisories/GHSA-jpvv-r467-5p4w. The completed theme candidate
provides the wider combined catalog/consumer qualification after this intake.
