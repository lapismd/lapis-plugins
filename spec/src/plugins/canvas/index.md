# Canvas Plugin

`@lapis-notes/canvas` opens a JSON Canvas file in a file view and in a read-only note embed. `Plugins/Canvas/Panels` is the governed surface. It loads the legacy feature board: a colored text note, two file notes, a link, a group, and three labeled connectors, in every placement. Middle (Top Tabs) also opens a Markdown note that embeds that same file. `Plugins/Canvas/Features` isolates text, whole-file, heading-section, link, group, connector, and note-embed examples. The stories stay `visual-pending`. They do not create Visual Delta baselines.

The package lives at `packages/canvas` as version `0.1.0` with runtime id `lapis-canvas`. The view type is `lapis-canvas`. `App` is received by the plugin constructor and passed into the file view. The canvas nodes do not read or assign `globalThis.app`.

A file named `*.canvas` is associated exclusively with that view, and `registerExtensions(["canvas"], "lapis-canvas")` agrees. The embed registry entry `canvas` mounts the read-only `CanvasEmbed`, so `![[Sample.canvas]]` shows the board without writing it back. The embed fits that board into its frame after layout, so the nodes stay readable. Create new canvas asks `fileManager.getAvailablePathForAttachment` for `Untitled Canvas.canvas`, creates an empty document, and opens it. Snap to grid defaults off and snap to objects defaults on. Those settings stay on the plugin class.

The copied board keeps text, file, link, and group nodes, connectors, pane clipping, and the JSON Canvas parse and save path. Markdown previews and editors inside a node use a transparent surface, so they show the node fill, including a colour preset. Block spacing inside those cards stays compact: reading-view margins do not open a full note column inside the node. `@xyflow/svelte` is the canvas engine. It is bundled. Its stylesheet is injected when the plugin loads. It is not a host external.

`Plugins/Canvas/Registry Screenshots` supplies the release-page capture. The banner is the open canvas and the gallery card is the note embed, both `visual-pending`. This slice does not publish the package and does not add it to a host profile.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CANVAS-001 | Canvas MUST live at `packages/canvas` as `@lapis-notes/canvas@0.1.0` with runtime id `lapis-canvas` and view type `lapis-canvas`. The plugin class MUST receive `App` from its constructor and MUST NOT read or assign `globalThis.app`. It MUST register the file view with `{ kind: "file" }`, an exclusive `*.canvas` association, `registerExtensions(["canvas"], "lapis-canvas")`, a Create new canvas command that uses `fileManager.getAvailablePathForAttachment`, and `embedRegistry.register("canvas", ...)` mounting the read-only embed. The file view MUST parse JSON Canvas and save it back. Text, file, link, and group nodes, connectors, and pane clipping MUST stay on the copied board. Snap to grid MUST default off and snap to objects MUST default on, on the plugin class. `@xyflow/svelte` MUST be bundled and MUST NOT be a host external. Markdown previews and editors inside a node MUST use a transparent surface so the node fill shows through, and MUST keep compact block spacing rather than a full note column. |
| LN-CANVAS-002 | `Plugins/Canvas/Panels` MUST open the legacy feature board in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. That board MUST include a colored text note, two file notes, a link, a group, and three labeled connectors. Middle (Top Tabs) MUST also show `![[Sample.canvas]]` through the copied read-only embed, fitted so the board stays readable. The stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CANVAS-004 | `Plugins/Canvas/Features` MUST show a separate story for a text node, a whole-file node, a heading-section file node, a link node, a group, labeled connectors including an arrow end, and the note embed. The stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CANVAS-003 | `Plugins/Canvas/Registry Screenshots` MUST capture the open canvas as the banner and the note embed as the gallery card, with `registry-media` and `visual-pending` tags. This slice MUST NOT publish the package or add it to a host profile. |

## Verification

Package tests cover JSON Canvas parse and save helpers, the runtime id, the exclusive `*.canvas` association, and the `canvas` embed registration. `Plugins/Canvas/Panels` opens the legacy feature board in every placement and, in Middle (Top Tabs), shows the note embed. `Plugins/Canvas/Features` checks each node kind, a heading section, labeled connectors, and the note embed.
