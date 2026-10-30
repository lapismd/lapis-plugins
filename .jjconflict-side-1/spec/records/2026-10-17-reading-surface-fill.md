# Reading surface fills the workspace pane

The desktop Edit Note review exposed one layout defect: the reading preview
ended at 620px inside an 868px available pane. The outer Mira Editor already
filled that pane. Markdown's external-scroll adapter set the inner layers to
automatic height, but its block wrappers did not stretch the inner Mira and
preview with the outer flex item. The remaining area showed the shell's
different background.

The source adapter now makes its editor and preview wrappers flex columns and
allows their inner Mira/preview surfaces to grow. It retains automatic content
height and visible overflow so the existing outer Design Core Scroll Area owns
long-document scrolling. No desktop CSS override or Mira package change is used.
LN-MD-078 and the existing single-scroll contract remain authoritative.
The user confirmed that this belongs at Lapis's shared Markdown view layer,
used by its web and desktop hosts. Other consumers of portable Mira are outside
this scoped wrapper. Web refresh and full consumer acceptance remain deferred;
the current manual review covers desktop Storybook.

`Plugins/Markdown/Reading surface` adds Short Note, Long Note and dark variants
using the real owned App/WorkspaceShell fixture. Their authored assertions cover
full-pane geometry, short-note overflow, the outer long-document scroll range,
and the final section's reachability. Source story execution and complete
interaction/accessibility/native suites remain deferred by the user's explicit
presentation-review instruction; visual baselines remain pending.

## Static and packaging evidence

- `pnpm audit`: exits successfully with the two existing advisory ignores
  (one moderate, one high); no ignore or dependency policy changes.
- `pnpm --filter @lapis-notes/markdown check`: zero Svelte errors/warnings.
- `pnpm --filter @lapis-notes/markdown build`: public Svelte/declaration output
  and publint pass.
- `pnpm spec:validate`: 6 validators, 27 chapters, 601 requirements.
- `pnpm spec:first`: 2 protected files, 1 canonical chapter.
- `pnpm check:app-ownership`: explicit owned-App audit passes.
- The first Prettier invocation could not infer a Svelte parser in this source
  workspace. Formatting through the desktop's installed public
  `prettier-plugin-svelte` succeeds; Markdown/TS use the source formatter.

## Narrow desktop candidate

The default plugin head contains unrelated Markdown persistence changes beyond
the desktop's installed `d76ed20282b7cc34352a6fe74896566c17c9b4b2` source.
An isolated source workspace at `.local/desktop-reading-fill` applies only this
layout fix, its canonical paragraph and review story to that installed base.
The code fix remains in the current source checkout as well.

The isolated package build and publint pass. Its ordinary `pnpm pack
--config.ignore-scripts=true` output supplies the desktop overlay; no archive
implementation is edited. Temporary dependency-runtime links are removed before
capturing its source snapshot.

- Source snapshot: `8c345d30b497e7678ebc5f410d43dfacf12e6f37`.
- Package: `@lapis-notes/markdown@0.1.6`.
- SHA-256: `94961f48973de70cc8a610a88c2064fc7e06051113915dd03d481a4689a91401`.
- Desktop installs only that replacement within its existing fourteen-archive
  cohort, retaining portable manifests and lockfile.

After a fresh desktop Storybook process, the original tall Reading pane and its
preview both measure 868px instead of 868px/620px. Short light/dark scenes both
fill a 600px viewport without excess scroll. A disposable 40-section note grows
to 4433px through that outer 600px viewport; wheel scrolling reaches its final
heading while the inner preview keeps visible overflow. This is manual
consumer evidence, not complete source or native qualification.

Desktop manual acceptance and current deferrals are recorded separately in
`lapis-desktop/spec/src/history/E-CATALOG-007.md`. This record does not qualify
the deferred package, complete catalog, signed-plugin or native product gates.
No release, signing, publication or push is performed for this review slice.
