# DOCX Plugin

`@lapis-notes/docx` opens a vault Word document in a file view and in a note
embed. `Plugins/DOCX/Panels/Viewing` is the first governed surface. It loads a
seeded sample in every placement, and Middle (Top Tabs) also opens a Markdown
note that embeds that same file. The story stays `visual-pending`. It does not
create Visual Delta baselines.

The package lives at `packages/docx` as version `0.1.0` with runtime id
`lapis-docx`. The view type is `lapis-docx`. `App` is received by the plugin
constructor. The preview does not read or assign `globalThis.app`.

A file named `*.docx` is associated exclusively with that view, and
`registerExtensions(["docx"], "lapis-docx")` agrees. The embed registry entry
`docx` is the extension renderer, so `![[Sample.docx]]` uses the same viewer.
An ordinary Markdown embed stays a Markdown preview. The filename caption
stays on the DOCX embed. Open Word is the command that opens the active DOCX
in this view.

The file view and the embed call one mount helper. The packaged output keeps
that import as a relative path to the vendored tree beside `dist`. This slice
does not publish, so the archive file list does not yet carry that tree. The
helper lazy-loads the vendored browser editor from canvas-word commit
`69dac7966e8932ec9b8bb8bde152d008d67a2cc3`, reads the vault bytes, and opens
them with no `backendUrl`. The file view is editable. Ctrl/Cmd+S and the
editor save control write a `.docx` back to the same vault file with
`vault.modifyBinary`. A dirty file view saves once before it closes. A clean
close does not rewrite the file. File ▸ PDF writes a sibling `.pdf` with
`vault.createBinary`, and a later export overwrites that file with
`vault.modifyBinary`. The PDF is not written over the `.docx`. Ctrl/Cmd+S
stays a Word save. A note embed stays
`readonly: true`. The vendored tree is the
browser `WordCanvas` graph and its shared model. It is not the
`@forevka/wordcanvas` npm package. `@chenglou/pretext@0.0.7` is bundled with
the upstream bidi and analysis patch. `fflate` and `txml` are bundled for
DOCX import. None of those modules are host externals. A mount that finishes
after dispose destroys the editor immediately. The host has a pixel height.
The embedded frame uses the theme border and a small theme radius. The
editor status strip uses the workspace status bar background, muted
foreground, and border. When the host carries the `dark` class, the page
gutter uses the theme background, each page is inverted the same way a dark
PDF page is, and the editing ribbon uses the workspace background, foreground,
and border.

Catalog metadata includes dimension placeholders so the package checker can
see the plugin. Those images are not an approved capture. The capture command,
settings, dedicated DOCX theme tokens, collaboration, conflict merge, and
legacy `.doc` stay deferred. This slice does not publish the
package and does not add it to a host profile.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-DOCX-001 | DOCX MUST live at `packages/docx` as `@lapis-notes/docx@0.1.0` with runtime id `lapis-docx` and view type `lapis-docx`. The plugin class MUST receive `App` from its constructor and MUST NOT read or assign `globalThis.app`. It MUST register the file view, an exclusive `*.docx` association, `registerExtensions(["docx"], "lapis-docx")`, an Open Word command, and `embedRegistry.register("docx", ...)`. The file view and the embed MUST call one mount helper. That helper MUST lazy-load the vendored browser `WordCanvas`, read the file with `vault.readBinary`, and open those bytes with no `backendUrl`. The file view MUST be editable, MUST leave PDF export available, and MUST write `format === "docx"` bytes back with `vault.modifyBinary`. A PDF export MUST write a sibling `.pdf` with `vault.createBinary`, MUST overwrite that sibling with `vault.modifyBinary` when it already exists, and MUST NOT write those bytes over the `.docx`. A save that finishes after dispose MUST NOT write. A dirty file view MUST save once before it closes, and a clean close MUST NOT rewrite the file. A note embed MUST stay `readonly: true`. `@forevka/wordcanvas` MUST NOT be an npm dependency. `@chenglou/pretext`, `fflate`, and `txml` MUST be bundled and MUST NOT be added to the host external allowlist. A mount that finishes after dispose MUST be destroyed immediately. The host MUST have a pixel height. An embedded DOCX MUST use the theme border and a small theme radius. The editor status strip MUST use the workspace status bar background, muted foreground, and border. A host with the `dark` class MUST paint the page gutter with the theme background, invert each page, and paint the editing ribbon with the workspace background, foreground, and border. |
| LN-DOCX-002 | `Plugins/DOCX/Panels/Viewing` MUST open `packages/docx/assets/sample.docx`, seeded as `Sample.docx`, in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. That file is the canvas-word showcase document. The story MUST show the viewer host and at least one canvas, and both sidebars for that placement. The editor status strip MUST match the workspace status bar color. The file view MUST show the editing ribbon, and a note embed MUST keep that ribbon hidden. Closing or leaving the view MUST remove that viewer. The play function MUST then restore the open file, and Middle (Top Tabs) MUST restore the note, so the settled story shows the file. Middle (Top Tabs) MUST also open a Markdown note containing `![[Sample.docx]]` and show the same viewer inside the embed frame with the filename caption. An ordinary note embed in that note MUST stay a Markdown preview. The viewing stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-DOCX-003 | Registry screenshots, settings, dedicated DOCX theme tokens, collaboration, conflict merge, legacy `.doc`, and web or native resource-url checks MUST stay deferred. This slice MUST NOT publish the package or add it to a host profile. |

## Verification

Package tests cover the runtime id, the exclusive `*.docx` association, the
`docx` embed registration, the Open Word command, an editable file mount that
writes docx bytes with `modifyBinary`, creates a sibling PDF and overwrites
that sibling on a second export, a read-only
embed, a dirty close that saves once, and a mount that is closed before the
document finishes opening. Neither mount sets a collaboration URL. `Plugins/DOCX/Panels/Viewing` asserts the viewer host, a canvas, the
placement sidebars, and removal of the viewer after the view closes. The play
function then restores the open file, and Middle (Top Tabs) restores the note,
so the settled story shows the file. Middle (Top Tabs) also asserts the
filename caption on `![[Sample.docx]]` and keeps `![[Welcome.md]]` as a
Markdown preview. The sample is the canvas-word showcase document at
`packages/docx/assets/sample.docx`. The story also checks that the editor status strip matches the workspace
status bar color, that the file view shows the editing ribbon, and that a
note embed keeps that ribbon hidden.
