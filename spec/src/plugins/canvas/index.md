# Canvas Plugin

`@lapis-notes/canvas` opens a JSON Canvas file in a file view and in a read-only note embed. `Plugins/Canvas/Panels` is the governed surface. It loads the legacy feature board: a colored text note, two file notes, a link, a group, and three labeled connectors, in every placement. Middle (Top Tabs) also opens a Markdown note that embeds that same file. `Plugins/Canvas/Features` isolates text, whole-file, heading-section, link, group, connector, and note-embed examples. The stories stay `visual-pending`. They do not create Visual Delta baselines.

The package lives at `packages/canvas` as version `0.2.3` with runtime id `lapis-canvas`. Its Markdown peer and development dependency both accept `^0.2.0`. The published bundle inlines `@lapis-notes/markdown/embed`. It shares `@lapis-notes/api`, including the editor core and language-service entries, with the host. The view type is `lapis-canvas`. `App` is received by the plugin constructor and passed into the file view. The canvas nodes do not read or assign `globalThis.app`.

A file named `*.canvas` is associated exclusively with that view, and `registerExtensions(["canvas"], "lapis-canvas")` agrees. The embed registry entry `canvas` mounts the read-only `CanvasEmbed`, so `![[Sample.canvas]]` shows the board without writing it back. The embed fits that board into its frame after layout, so the nodes stay readable. Create new canvas asks `fileManager.getAvailablePathForAttachment` for `Untitled Canvas.canvas`, creates an empty document, and opens it. Snap to grid defaults off and snap to objects defaults on. Those settings stay on the plugin class.

The copied board keeps text, file, link, and group nodes, connectors, pane clipping, and the JSON Canvas parse and save path. Markdown previews and editors inside a node use a transparent surface, so they show the node fill, including a colour preset. Block spacing inside those cards stays compact: reading-view margins do not open a full note column inside the node. `@xyflow/svelte` is the canvas engine. It is bundled. Its stylesheet is injected when the plugin loads. It is not a host external.

`Plugins/Canvas/Registry Screenshots` supplies the release-page capture. The banner is the open canvas and the gallery card is the note embed, both `visual-pending`. This slice does not publish the package and does not add it to a host profile.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CANVAS-001 | Canvas MUST live at `packages/canvas` as `@lapis-notes/canvas` with runtime id and file view type `lapis-canvas`. Its constructor MUST receive `App` and MUST NOT read or assign `globalThis.app`. It MUST register the file view with `{ kind: "file" }`, an exclusive `*.canvas` association, and matching extension registration. |
| LN-CANVAS-002 | `Plugins/Canvas/Panels` MUST open the legacy feature board in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. That board MUST include a colored text note, two file notes, a link, a group, and three labeled connectors. Middle (Top Tabs) MUST also show `![[Sample.canvas]]` through the copied read-only embed, fitted so the board stays readable. The stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CANVAS-004 | `Plugins/Canvas/Features` MUST show a separate story for a text node, a whole-file node, a heading-section file node, a link node, a group, labeled connectors including an arrow end, and the note embed. The stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CANVAS-003 | `Plugins/Canvas/Registry Screenshots` MUST capture the open canvas as the banner and the note embed as the gallery card, with `registry-media` and `visual-pending` tags. This slice MUST NOT publish the package or add it to a host profile. |

| LN-CANVAS-005 | Editable and embedded boards MUST reject malformed JSON Canvas before mounting. Validation MUST check collection shapes, supported node types, unique IDs, integer coordinates, positive integer dimensions, required content fields, optional field types, valid endpoint enums, and existing edge references. Unsupported content MUST remain untouched on disk; recovery MUST NOT silently remove nodes or edges. |
| LN-CANVAS-006 | Ordinary edits MUST preserve unknown document, node, and edge extension fields, imported positive dimensions even below editor resize minima, and the node array's stacking order. Removing a node or connector MUST remove that entity rather than resurrecting it from the original document. |
| LN-CANVAS-007 | Omitted connector endpoints MUST render the JSON Canvas defaults: no source arrow and an arrow at the target. Rendering MUST NOT insert endpoint fields into persisted data. Explicit `none` and `arrow` values MUST take precedence. |
| LN-CANVAS-008 | The plugin MUST create an empty canvas using `fileManager.getAvailablePathForAttachment`, expose Create new canvas as a command and ribbon action, and persist snap-to-grid (default off) and snap-to-objects (default on) settings on the plugin class. |
| LN-CANVAS-009 | Text, file, link, and group nodes and connectors MUST render within the pane. Markdown node previews and editors MUST use transparent surfaces and compact block spacing. |
| LN-CANVAS-010 | The published Canvas bundle MUST inline its Markdown embed dependency and bundle XYFlow and its foundation stylesheet. Shared App and editor runtime contracts MUST use approved public host modules. |
| LN-CANVAS-011 | Debounced saves MUST stay bound to their original App and file, serialize concurrent writes, retain failed changes for retry, flush before file transitions and teardown, and surface external-write conflicts without overwriting newer disk content on hosts advertising conditional text writes. |
| LN-CANVAS-012 | A new empty board MUST support adding text, vault-note, media, URL, and empty-group cards through accessible controls and context actions. Vault drag/drop and URL drops MUST create cards at the drop position. |
| LN-CANVAS-013 | Board mutations MUST support undo and redo, including edits, creation, movement, resizing, grouping, connectors, and deletion. Duplicate, copy, cut, and paste MUST remap entity IDs and internal connector references. Text editing MUST retain normal editor shortcuts and coalesce a completed editing session into a useful board history entry. |
| LN-CANVAS-014 | Read-only note embeds MUST resolve vault file cards through public App contracts, update when source files change, and dispose asynchronous work and subscriptions. Views and embeds MUST share card presentation, support responsive frames and open-original navigation, and bound nested rendering with cycle detection. |
| LN-CANVAS-015 | Both light and dark Canvas presentations MUST provide at least 4.5:1 normal-text contrast and 3:1 contrast for meaningful connectors and control indicators. Presentation adjustments MUST preserve stored JSON colours, resolve theme overrides, cover custom colours, and remain consistent between views and embeds. Keyboard descriptions, announcements, focus states, and controls MUST remain accessible. |
| LN-CANVAS-016 | Multiple selected cards MUST support alignment, spacing distribution, row/column/grid arrangement, and equal-width or equal-height justification as undoable board mutations. |
| LN-CANVAS-017 | Groups MUST render vault-image backgrounds with cover, aspect-ratio and repeat modes, and expose replace/remove background controls. |
| LN-CANVAS-018 | Connectors MUST support reconnecting either end, following the opposite card, and creating a new card when a connection is dropped on empty space. |
| LN-CANVAS-019 | Canvas MUST provide documented navigation shortcuts, zoom-to-fit, zoom-to-selection, jump-to-group, and keyboard-accessible help. |
| LN-CANVAS-020 | Touch users MUST be able to pan, pinch zoom, open a long-press creation menu, select, move, resize, edit, group and connect cards without requiring hover. |
| LN-CANVAS-021 | URL cards MUST support sandboxed web previews with validated HTTP(S) URLs, an open-external action and a useful fallback when a site disallows framing. |
| LN-CANVAS-022 | Desktop-capable hosts MUST support PNG export of the full board or current viewport with quality and privacy options. Empty boards and unavailable export capabilities MUST show a clear disabled state or explanation. |
| LN-CANVAS-023 | Text cards MUST support conversion into a vault note through the owning App, retain their position and connections, and surface failed creation without deleting the original text. |

| LN-CANVAS-024 | Each opened Canvas file MUST own a destination-bound save queue. Writes MUST serialize, explicit flush MUST drain the latest queued value, background failures MUST be handled, and an older failed write MUST NOT replace a newer queued draft. |
| LN-CANVAS-025 | Loading, unloading, reloading and closing a Canvas file MUST await its existing queued board saves before changing the binding or destroying the view. Failed flush MUST reject the transition and retain the current draft for retry. The pane MUST block input during a transition. A stale asynchronous read MUST NOT replace or keep blocking the newer binding; board changes delivered during a read MUST drain before publication. |
| LN-CANVAS-026 | Canvas file views MUST use the public reactive mounting contract for live settings and save-state updates. Own-save acknowledgements MUST NOT replace the active board document or reset its selection. A save failure MUST leave the board mounted and expose an accessible Retry save action. |

| LN-CANVAS-027 | Each opened Canvas board MUST register a destination-bound writer with its owning App before publication and await native admission when present. App guards MUST protect its input and flush queued board writes. Hosts advertising conditional text writes MUST use the public persistence contract against acknowledged bytes, without falling back after a conditional failure. Other hosts MAY retain their existing persistence under the public API capability contract. External changes MUST publish App-owned conflicts supporting reviewed keep-local, use-external, merged-text and refresh actions. |
| LN-CANVAS-028 | Unexpected synchronous teardown MUST unregister the board writer while retaining failed changes in the App registry. The protected board and its recovery callbacks MUST remain available until the retained writer is clean; successful retry or reviewed conflict recovery MUST release the component. |

| LN-CANVAS-029 | Pending virtual Mira text-card buffers MUST contribute to the parent Canvas file's dirty state before debounce. Parent flush MUST drain those editors before graph persistence. A text editor MUST acknowledge a bound write only after the complete JSON document is durable; failed writes MUST retain its draft for App retry. Virtual editors MUST NOT register synthetic vault paths as independent file writers. |
| LN-CANVAS-030 | Canvas input protection MUST synchronously hold its virtual text editors. Reviewed local, external and merged conflict recovery and protected native saved-text refresh MUST synchronize the parent JSON and all affected editor buffers before releasing protection. Removed cards MUST release their old draft only after the reviewed document is accepted. |
| LN-CANVAS-031 | Guarded file rename MUST flush pending text-card edits before moving the file and rebind the existing Canvas view's writer to the new path. Unexpected teardown MUST retain pending editor buffers and their component until complete JSON persistence or reviewed recovery succeeds. |

## Alignment sequence

Implement and qualify these independently reviewable slices in order:

1. File validation, lossless round trips, and JSON Canvas endpoint defaults.
2. File-bound persistence and conflict handling, then basic authoring and history.
3. Live read-only embeds and shared view/embed presentation.
4. Theme contrast, keyboard and screen-reader accessibility.
5. Remaining layout, group, connector, mobile, web, and export workflows.

Lapis note embeds intentionally retain readable card text; Obsidian's documented
shape-only embed is not the target. Canvas remains an installed plugin rather
than an addition to the application-owned static profile. Cross-repository fixes
belong to their source owners and consumers use registry semver releases or an
explicitly documented temporary packed-package acceptance setup. Publication
remains a separate release gate. All changed stories stay `visual-pending`.

## Verification

Package tests cover JSON Canvas parse and save helpers, the runtime id, the exclusive `*.canvas` association, and the `canvas` embed registration. `Plugins/Canvas/Panels` opens the legacy feature board in every placement and, in Middle (Top Tabs), shows the note embed. `Plugins/Canvas/Features` checks each node kind, a heading section, labeled connectors, and the note embed.

`src/lib/json-canvas-safety.test.ts` verifies rejection without data loss, imported geometry and stacking, extension retention after editing, and omitted arrow defaults. Full authoring, live embedding, theme, and parity requirements remain planned until their focused acceptance lands.

## Writer lifecycle qualification

LN-CANVAS-024 through LN-CANVAS-031 qualify the delivered board queue, App
registration, virtual text buffers, protected recovery, native producer
admission and saved-text refresh, guarded rename, and retained synchronous
teardown. Source contracts are qualified through the public App registry and
real Mira/workspace plays. The API peer floor is 0.2.4. Conditional conflicts
follow the host's advertised optional capability; existing persistence remains
available on OPFS and legacy Desktop hosts without that capability, as required
by the public API contract. An attempted conditional write never falls back.
Installed native Desktop release qualification and publication remain separate
from these producer/source tests. Reload is not an implicit discard of a failed
draft; explicit retry or reviewed recovery must succeed first.
