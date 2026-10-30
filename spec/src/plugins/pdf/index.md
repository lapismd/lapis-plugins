# PDF Plugin

`@lapis-notes/pdf` opens a vault PDF in a file view and in a note embed.
`Plugins/PDF/Panels/Viewing` is the first governed surface. It loads a seeded
sample, with a photograph, two columns, and a table, in every placement, and Middle (Top Tabs) also opens a Markdown
note that embeds that same file. The story stays `visual-pending`. It does not
capture registry media and it does not create Visual Delta baselines.

The package lives at `packages/pdf` as version `0.1.0` with runtime id
`lapis-pdf`. The view type is `lapis-pdf`. `App` is received by the plugin
constructor. The preview does not read or assign `globalThis.app`.

A file named `*.pdf` is associated exclusively with that view, and
`registerExtensions(["pdf"], "lapis-pdf")` agrees. The embed registry entry
`pdf` is the extension renderer, so `![[Sample.pdf]]` uses the same viewer.
An ordinary Markdown embed stays a Markdown preview. The filename caption
stays on the PDF embed. Open PDF is the command that opens the active PDF in
this view.

The file view and the embed call one mount helper. That helper lazy-loads
`@embedpdf/snippet`, opens the file with `vault.getResourceUrl`, and revokes
that URL on destroy. When the issued URL is not `blob:`, `http:`, or `https:`,
the helper reads the vault bytes, opens a blob URL, and revokes that blob URL
instead. A mount that finishes after dispose destroys the viewer and revokes
the URL immediately. EmbedPDF document open and document close stay disabled,
so the viewer cannot replace the vault file. The host has a real pixel height
so pages, not only toolbar chrome, lay out. `@embedpdf/snippet` is bundled.
It is not a host external.

The first slice uses these defaults: fit-width zoom, vertical scroll, and
page gap 10. PDF settings expose **Invert PDF pages in dark mode** as
configuration key `lapis-pdf.forceDarkPages`, defaulting to on. While that
setting is on and the document is dark, rendered page images use
`invert(1) hue-rotate(180deg)`. The viewer theme preference follows
`app.isDarkMode`, and also the `dark` class Storybook uses for the same
switch, including after that class changes. An embedded PDF uses the theme
border and a small theme radius. Zoom, scroll, page gap, `--pdf-*` tokens,
and the file-view pane action stay deferred.

`Plugins/PDF/Registry Screenshots` supplies the release-page capture. The
banner is the open PDF and the gallery card is the note embed, both
`visual-pending`, captured with `pnpm registry:media:capture --plugin pdf`.
Web and native viewing, including Tauri resource URLs, stay a later host
check. Storybook does not prove those URLs. This slice does not publish the
package and does not add it to a host profile.

## Requirements

| ID        | Requirement |
| --------- | ----------- |
| LN-PDF-001 | PDF MUST live at `packages/pdf` as `@lapis-notes/pdf@0.1.0` with runtime id `lapis-pdf` and view type `lapis-pdf`. The plugin class MUST receive `App` from its constructor and MUST NOT read or assign `globalThis.app`. It MUST register the file view, an exclusive `*.pdf` association, `registerExtensions(["pdf"], "lapis-pdf")`, an Open PDF command, and `embedRegistry.register("pdf", ...)`. The file view and the embed MUST call one mount helper. That helper MUST lazy-load `@embedpdf/snippet`, open the file through `vault.getResourceUrl`, and revoke the issued URL on destroy. A non-fetchable URL MUST fall back to a blob URL created from `readBinary`, and that blob URL MUST be revoked instead. A mount that finishes after dispose MUST be destroyed immediately. Document open and document close MUST be disabled. The host MUST have a pixel height. `@embedpdf/snippet` MUST be bundled and MUST NOT be added to the host external allowlist. Defaults MUST be fit-width zoom, vertical scroll, and page gap 10. The plugin MUST register a PDF settings section and configuration schema for `lapis-pdf.forceDarkPages`, defaulting to on. While that setting is on and the document theme is dark, rendered page images MUST use `invert(1) hue-rotate(180deg)`. An open viewer MUST follow a later change to the setting or the document theme class. An embedded PDF MUST use the theme border and a small theme radius. |
| LN-PDF-002 | `Plugins/PDF/Panels/Viewing` MUST open `packages/pdf/assets/sample.pdf`, seeded as `Sample.pdf`, in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. The story MUST show the viewer host, at least one rendered page, and both sidebars for that placement. It MUST NOT depend on PDF text being selectable in the DOM. Closing or leaving the view MUST remove that viewer. The play function MUST then restore the open file, and Middle (Top Tabs) MUST restore the note, so the settled story shows the file. Middle (Top Tabs) MUST also open a Markdown note containing `![[Sample.pdf]]` and show the same viewer inside the embed frame with the filename caption. An ordinary note embed in that note MUST stay a Markdown preview. The viewing stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. `Plugins/PDF/Registry Screenshots` MUST capture the open PDF as the banner and the note embed as the gallery card, with `registry-media` and `visual-pending` tags. |
| LN-PDF-003 | Zoom, scroll, and page-gap settings, `--pdf-*` theme tokens, the file-view pane action for page inversion, and web or native resource-url checks MUST stay deferred. This slice MUST NOT publish the package or add it to a host profile. |

## Verification

Package tests cover the runtime id, the exclusive `*.pdf` association, the
`pdf` embed registration, the Open PDF command, fetchable and blob resource
URLs, revoke on destroy, a mount that is disposed before EmbedPDF
initializes, a theme change after the viewer opens, and the invert-pages
setting defaulting to on. `Plugins/PDF/Panels/Viewing` asserts the viewer host, a rendered
page, the placement sidebars, and removal of the viewer after the view closes.
The play function then restores the open file, and Middle (Top Tabs) restores
the note, so the settled story shows the file.
Middle (Top Tabs) also asserts the filename caption on `![[Sample.pdf]]` and
keeps `![[Welcome.md]]` as a Markdown preview. The sample is
`packages/pdf/assets/sample.pdf`.

## Clean package validation

The package explicitly builds `src` into `dist` so its declared runtime and type
entrypoints exist in a clean npm archive. Registry loading and failure
presentation use an accessible status region; the settled capture still mounts
the production workspace shell. Functional checks do not approve visual media.
