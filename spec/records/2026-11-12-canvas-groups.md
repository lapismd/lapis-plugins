# Canvas group background qualification

LN-CANVAS-044/045 implement the group background workflow under LN-CANVAS-017.
The initial exact regression command was:

    pnpm exec vitest run --project storybook stories/plugins/canvas/Layout.stories.ts -t 'Groups render and edit'

It failed once because the imported background image did not render. The
repaired target passes actual SVG decoding in the editable view and a Markdown
note embed; default cover, ratio/contain and repeat presentation; replacement;
invalid-path retention; removal; persistent undo; imported geometry, metadata
and extension retention; and the App guard's synchronous modal input hold.

The story waits for XYFlow's measured node visibility before selecting through
its public keyboard behavior. Early synthetic pointer checks ran against a
hidden, unmeasured node. Later checks exposed two unhandled pointer-capture
errors when modal select events reached the board selection handler. The
dialog now contains its pointer-up events. The final exact target passes with
zero unhandled errors, without suppressing events in test infrastructure.

Six image-source tests cover matching updates, ignored unrelated modifications,
stale reads, pending disposal, missing/non-image paths, recreation, resource
failures and independent sibling leases. Each mounted background captures the
explicit App and Canvas source path, copies the resolved file, and releases
every acquired public resource URL exactly once, including stale results.
The reader never writes the vault. Missing/decode failures show a visible note.

Changes flush through the existing parent board, validate an existing vault
image and preserve all unrelated JSON fields. Failed validation retains the
current background. Native dialogs are inert during App input protection.
Views and embeds share the same renderer; embeds expose no editing controls.

All 113 group/layout Canvas unit cases and root check/test/build lanes pass;
source diagnostics have zero errors/warnings. Specification/App-ownership,
release tooling and all 17 npm packs pass. The cold group candidate passes
65 families, 302 tests and 57 existing skips with zero failures (run
b1ad1110-613d-472e-a696-5065387c0b70). The subsequent connector candidate also
passes the complete catalog: 66 families, 307 passes, 57 skips and zero failures.
Its fresh static build includes these group surfaces. The group runtime payload
verifies SHA-256 f702a42ed127d174d0b64cfd443f1d0f07ac3e340784f26c61457a87148e8d28.

Installed OPFS acceptance first exposed a separate API-owned defect: browser
vault resource blobs lacked their MIME type, preventing SVG image decoding.
The Notes source repair under LN-WEB-091 retains complete bytes and public
resource-lease ownership. All six exact API regressions and all 36 browser
storage tests pass. All seven installed Web acceptance cases now pass with
the source API host rebuilt through its public exports, including real SVG
decode, sizing, invalid replacement, removal and undo. This is explicit
temporary source-host acceptance; plugin manifests retain registry semver and
the upstream API fix/release remains separately owned and tracked.

Stories remain visual-pending; no baseline or publication approval is implied.
