# Canvas live-embed qualification

LN-CANVAS-036 through LN-CANVAS-039 qualify live source ownership, vault-file
content, bounded nested rendering and responsive read-only navigation. The
shared colour presentation part of LN-CANVAS-014 remains for the theme slice.

Initial exact targets and failure counts:

- `pnpm --filter @lapis-notes/canvas exec vitest run src/canvas-plugin.test.ts`
  failed its new listener-ownership assertion once: embeds subscribed to no
  source changes. That assertion and both original tests now pass.
- `pnpm exec vitest run --project storybook stories/plugins/canvas/Features.stories.ts -t 'Note embeds resolve live vault-file content'`
  failed once because the file card showed only its filename. It now renders
  the live body through the public FileEmbed contract. The subsequent combined
  source/content run exposed one read-only lock-control failure; using XYFlow's
  actual public showLock prop fixed it without relaxing the assertion.
- `pnpm --filter @lapis-notes/canvas exec vitest run src/lib/canvas-text-preview.test.ts`
  had three behavioral failures after correcting the initial test's synchronous
  resolver assertion. Links, resolved-file reads and watchers were isolated
  from the vault. All five final tests pass, including editing-binding ownership
  and absence of synthetic vault writer registration.
- The exact Controlled embed previews browser target failed once when live
  vault content overrode an explicit fileContents input. That target passes.
  The separate canvas-controlled-preview.test.ts failed once for an empty
  section override; nullish lookup now preserves the explicitly empty value.
- Direct/Markdown cycles and live-geometry fitting passed their initial browser
  targets. The explicit zoom choice target reproduced one failure from delayed
  startup fitting. Public readiness and ResizeObserver replace the poll and
  five delayed timers. The first repaired test captured an unfinished zoom
  animation; waiting for its precise target preserves the exact final transform
  assertion. The complete family passes.

Each source subscription owns modify/create/delete/rename listeners, captures
its file, rejects stale asynchronous reads and disposes idempotently. A removed
or invalid source remains visibly unavailable without changing disk and can
recover on a subsequent update. File/folder rename updates source identity.

Canvas owns DOM boundary annotations across independently mounted Markdown
roots. Detached fragments defer inspection until attachment. Repeated canonical
paths in the same App stop, and a fixed six-ancestor bound limits acyclic depth.
Siblings and different Apps are independent. Stopped previews retain navigation.
The direct and Markdown-interleaved browser case verifies both stopped branches,
one actual board, three navigation actions and unchanged source bytes.

File content uses the explicit App's public renderer, including registered
media/Canvas embeds and Markdown subpaths. Text-card adapters delegate public
link, asset and embed contracts with the owning Canvas source path, while virtual
writes, watchers and editing bindings retain their parent-document ownership.
Explicit controlled previews take precedence. Mounted boards lease the bundled
XYFlow foundation stylesheet per document; repeated cleanup and independent
Apps/documents cannot remove another live surface's foundation.

PR #82 merged as 0ce63f5b after every workflow passed. Its full cold run finished
with 294 passes, 57 existing skips and zero failures; its committed package also
passed all four Web acceptance cases.

## Validation

- Complete Canvas unit suite: **90 passed, zero failures**, 11 files.
- Complete Canvas interaction/accessibility family: **38 passed, zero failures**,
  three files, from a fresh Vitest/Vite process.
- Root check: **18/18** tasks; root build/publint: **17/17**. Root unit suite
  includes **1,186 tests**. Release-tooling tests: **199 passed**. All 17 npm
  packs pass; App ownership, specification and audit gates pass with the existing
  two low audit ignores. Static Storybook cold build passes.
- Candidate runtime payload SHA-256:
  `01b61ae9c2721d1a78b20182900dba88a0d343b35436aab89084b9431d5c7437`.
- The five-case packaged Web suite on Notes 6fbe662e first yielded **four passes
  and one failure** against the previous artifact: the new live embed case lacked
  the file body. Rebuilt-candidate acceptance and the full cold immutable story
  run are recorded when complete below.

No consumer source, manifests or lockfiles changed. Test-signed acceptance inputs
remain ignored; installed native Desktop release acceptance and publication are
separate. Stories remain visual-pending. Marketing captures will be refreshed
with the final presentation/theme UI without changing visual baselines.
