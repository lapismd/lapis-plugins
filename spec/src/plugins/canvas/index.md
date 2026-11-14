# Canvas Plugin

`@lapis-notes/canvas` opens a JSON Canvas file in a file view and in a read-only note embed. `Plugins/Canvas/Panels` is the governed surface. It loads an original coastal research board with grouped notes, vault files, a local field sketch, a checklist, a web reference and labeled connections, in every placement. Middle (Top Tabs) also opens a Markdown note that embeds that same file. `Plugins/Canvas/Features` isolates text, whole-file, heading-section, link, group, connector, and note-embed examples. The stories stay `visual-pending`. They do not create Visual Delta baselines.

The package lives at `packages/canvas` as version `0.2.3` with runtime id `lapis-canvas`. Its Markdown peer and development dependency both accept `^0.2.0`. The published bundle inlines `@lapis-notes/markdown/embed`. It shares `@lapis-notes/api`, including the editor core and language-service entries, with the host. The view type is `lapis-canvas`. `App` is received by the plugin constructor and passed into the file view. The canvas nodes do not read or assign `globalThis.app`.

A file named `*.canvas` is associated exclusively with that view, and `registerExtensions(["canvas"], "lapis-canvas")` agrees. The embed registry entry `canvas` mounts the read-only `CanvasEmbed`, so `![[Sample.canvas]]` shows the board without writing it back. The embed fits that board into its frame after layout, so the nodes stay readable. Create new canvas asks `fileManager.getAvailablePathForAttachment` for `Untitled Canvas.canvas`, creates an empty document, and opens it. Snap to grid defaults off and snap to objects defaults on. Those settings stay on the plugin class.

The copied board keeps text, file, link, and group nodes, connectors, pane clipping, and the JSON Canvas parse and save path. Markdown previews and editors inside a node use a transparent surface, so they show the node fill, including a colour preset. Block spacing inside those cards stays compact: reading-view margins do not open a full note column inside the node. `@xyflow/svelte` is the canvas engine. It is bundled. Its foundation stylesheet is leased by each mounted board in its owning document and released when the last board is destroyed. It is not a host external.

`Plugins/Canvas/Registry Screenshots` supplies the release-page capture. The banner is the open canvas and the gallery card is the note embed, both `visual-pending`. This slice does not publish the package and does not add it to a host profile. The 0.3.0 registry source ships a bounded `releases["0.3.0"].changelog` override. Changesets history remains intact; published registry notes fail closed when the version section exceeds 4000 characters.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CANVAS-001 | Canvas MUST live at `packages/canvas` as `@lapis-notes/canvas` with runtime id and file view type `lapis-canvas`. Its constructor MUST receive `App` and MUST NOT read or assign `globalThis.app`. It MUST register the file view with `{ kind: "file" }`, an exclusive `*.canvas` association, and matching extension registration. |
| LN-CANVAS-002 | `Plugins/Canvas/Panels` MUST open the coastal research board in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. That board MUST include grouped notes, two vault notes, an offline local image, a checklist, a web reference and labeled connections. Middle (Top Tabs) MUST also show `![[Sample.canvas]]` through the copied read-only embed, fitted so the board stays readable. The stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
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

| LN-CANVAS-032 | Empty and populated boards MUST expose accessible text, vault-file, media, HTTP(S) and group creation controls, plus pointer-positioned context creation. Creation dialogs MUST share App input protection, and queued creation commands MUST NOT mutate a protected board. |
| LN-CANVAS-033 | Canvas MUST retain bounded document undo/redo history for its mutations, coalescing geometry gestures and each text editing session. Board shortcuts MUST leave focused editor and form shortcuts intact. Undo/redo MUST persist the restored document and retain extension fields and imported geometry. |
| LN-CANVAS-034 | Selection copy, cut, duplicate and paste MUST retain group contents and internal connectors, allocate fresh pasted node/edge identities, remap references and preserve extension fields. Clipboard snapshots MUST include pending virtual text without acknowledging it. Plain Markdown paste MUST create a text card; editor paste MUST remain native. Clipboard-permission fallback MUST follow the owning App across its boards and be cleared on plugin unload. |
| LN-CANVAS-035 | Canvas drop handling MUST resolve existing vault paths and HTTP(S) URLs at the pointer, support standard URI-list comments and multiple targets, and ignore unsafe URL schemes. One drop MUST form one undoable document mutation. A receiver alone MUST NOT be presented as File Explorer drag-source integration. |

| LN-CANVAS-036 | Mounted Canvas embeds MUST track matching source modifications, file and folder renames, deletion and recreation. Stale reads and work finishing after disposal MUST NOT publish. Source failures and malformed documents MUST remain visible without writing the source. |
| LN-CANVAS-037 | Both board surfaces MUST resolve file cards through the explicit owning App, including Markdown subpaths and other registered file embeds. Virtual text-card links MUST resolve relative to the owning Canvas, while their writes and editing bindings remain owned by the parent document. Explicit public fileContents previews, including empty strings, MUST take precedence over vault reads. |
| LN-CANVAS-038 | Nested rendering MUST detect repeated canonical Canvas paths within the same App's parent chain, including chains through Markdown, and MUST stop after six ancestor boards. Sibling instances and equal paths in different Apps MUST remain independent. Detached Markdown fragments MUST be checked after attachment; stopped previews MUST offer open-original navigation. |
| LN-CANVAS-039 | Read-only Canvas embeds MUST provide bounded responsive frames, a read-only label and open-original navigation. They MUST fit after public viewport/node readiness, source changes and frame resizing, without delayed startup fits resetting an explicit zoom choice. Mounted surfaces MUST lease foundation CSS independently across Apps and documents. |

| LN-CANVAS-040 | Views and embeds MUST use the same computed card palette. Text, metadata, group labels and links MUST meet 4.5:1 against their effective card surface; borders, selection indicators, connectors and minimap indicators MUST meet 3:1. CSS preset overrides, custom JSON hex colours, inherited transparent backgrounds and live theme changes MUST resolve in the owning document without modifying stored colours. Connectors crossing other surfaces MUST retain a contrasting halo. |
| LN-CANVAS-041 | Screen-reader descriptions and announcements MUST remain in the accessibility tree while visually hidden. Read-only descriptions MUST NOT claim that cards can be moved or deleted. Editable cards MUST expose a separate focusable edit action outside rendered Markdown controls; host-controlled Markdown previews MUST NOT add an inactive button wrapper. Canvas story accessibility checks MUST include card content rather than excluding the node shell or label. |

| LN-CANVAS-042 | Selection layout MUST expose left/center/right and top/middle/bottom alignment, horizontal/vertical equal-gap distribution, row/column/grid arrangement and equal width/height. Each command MUST flush pending editors, form one undoable mutation and preserve identities, connectors, extensions and unaffected dimensions. Selected groups MUST move contained descendants once; selection inside a selected group MUST NOT become a second layout unit. Distribution MUST retain outside anchors and require three independent cards. Layout controls MUST support keyboard activation and Escape dismissal. |
| LN-CANVAS-043 | Editable card previews MUST expose a separate focusable edit action outside rendered Markdown controls. Card selection and pointer editing MUST remain available without nesting interactive controls inside a button wrapper. |
| LN-CANVAS-044 | Group background images MUST resolve through the owning App relative to the Canvas source. Views and embeds MUST support cover, aspect-ratio and repeat presentation, recover from matching vault changes and show missing-image failures. Each mounted background MUST release its resource leases and subscriptions, including stale asynchronous reads. |
| LN-CANVAS-045 | Group background controls MUST validate existing vault images, preserve unrelated document data and support undo/redo. Background dialogs MUST share App input protection and retain the existing background when validation or persistence fails. |
| LN-CANVAS-046 | Selected connectors MUST expose source and target drag anchors and keyboard-accessible endpoint editors. Reconnection MUST preserve connector identity, label, arrows, colour and extension fields, retain cancelled connections and participate in board undo/redo. Protected boards MUST reject reconnection. Connector controls MUST remain reachable beside fixed board panels. |
| LN-CANVAS-047 | Connectors MUST offer navigation to either attached card. A new connection dropped on empty board space MUST create one text card and connector in one undoable mutation, honour its starting handle direction, flush pending editors and preserve unrelated content. Cancelled reconnection and drops on controls or cards MUST NOT create cards. |
| LN-CANVAS-048 | Views and embeds MUST offer fit-all, named-group jumps, reset and zoom controls with keyboard help; editable boards MUST also offer fit-selection. Shortcuts MUST belong to the focused board, leave form and editor input intact, respect reduced motion and preserve stored document bytes. Read-only help MUST omit editing instructions, and modal help MUST share owning App input protection. |
| LN-CANVAS-050 | Editable boards MUST retain their camera when the first card is added or dropped onto an empty board. A user camera interaction MUST cancel a pending automatic startup fit. Native File Explorer drops MUST retain the source note and remain undoable. |
| LN-CANVAS-049 | Embedded boards MUST expose named widget groups without duplicate region landmarks when a note embeds the same Canvas more than once. |

| LN-CANVAS-051 | Touch panning and pinch zoom MUST retain native gesture handling. A stationary empty-pane hold MAY open creation after 500ms; movement beyond 10px, a second contact, release, cancellation, App protection and disposal MUST cancel pending creation. Mouse selection MUST remain available. |
| LN-CANVAS-052 | Touch users MUST have explicit multi-card selection and visible connection, resize and edit targets without hover. Selection MUST use public Command View search and explicit checked state, keyboard toggling and focus return. Its icon-only trigger MUST live in navigation on the right rail. Selection controls MUST share App input protection, preserve document bytes, and enable existing grouping and connector actions. |

| LN-CANVAS-053 | Mouse and touch resize dimensions MUST flow through public node width/height fields into persistence, bounds, grouping and navigation. Imported positive dimensions MUST remain intact before resizing; undo/redo MUST restore complete geometry and preserve unrelated fields. Presentation styles MUST NOT override resized dimensions. |

| LN-CANVAS-054 | Every URL-card navigation path in views and embeds MUST admit only absolute HTTP(S) addresses. Malformed and unsupported stored URLs MUST remain inert without rewriting the source. Opening a valid external link MUST isolate its opener and omit referrer information. |
| LN-CANVAS-055 | Web previews MUST load only after an explicit user action and close without changing Canvas data. Frames MUST omit same-origin and top-navigation permissions, deny sensitive browser capabilities and send no referrer. Supporting browsers MUST use credentialless frames to load within cross-origin isolated hosts without sending host credentials. The open-external action and a visible framing fallback MUST remain available when preview loading fails, the browser lacks support or a site refuses embedding. |

## Alignment sequence

| LN-CANVAS-058 | Editable boards MUST offer PNG export for the entire board, including connector curves and labels outside card bounds, or current viewport, with explicit 1x/2x/4x quality and transparent backgrounds on capable desktop/browser hosts. Export MUST preserve source bytes and camera state, bound image dimensions without silent quality reduction, and explain empty or unavailable cases. |
| LN-CANVAS-059 | PNG export MUST offer independent text, file-content/path, address and decoded-local-image privacy choices. File contents/paths, addresses and images MUST be omitted by default. Web frames, remote images, editing chrome including selected-connector controls, and newly fetched fonts MUST stay excluded. Private snapshot DOM and temporary resources MUST be disposed after success or failure; captured board ownership MUST prevent downloads after a source transition. |

| LN-CANVAS-056 | Text-to-note conversion MUST flush pending card Markdown, create a collision-free note through the owning App's public vault/file manager, preserve card identity, geometry, extensions and connectors, and record one undoable card-kind replacement. Undo MUST retain the created note. Creation failure MUST leave the original text card available for retry. |
| LN-CANVAS-057 | An asynchronous conversion MUST capture its board owner, source and document session before admission. A file/owner transition, disposal, protection or concurrent target edit MUST prevent stale replacement. A note already created when completion becomes stale MUST remain in the vault; failure reporting MUST identify that retained note. |

| LN-CANVAS-060 | Group backgrounds MUST paint beneath ordinary cards and connectors in views and embeds, including imported groups placed last in JSON. Presentation layering MUST retain stored node order and leave contained card content and pointer actions reachable. |

| LN-CANVAS-061 | The authoring and navigation toolbars MUST start collapsed in views and embeds, expand by keyboard, use the available Canvas pane width before wrapping and stay inside narrow panes. They MUST sit above and below the zoom/history groups on one right control rail. Collapse buttons MUST use double right chevrons. Collapsing MUST NOT disable board shortcuts. |
| LN-CANVAS-062 | Group selection and label editing MUST retain stable frame dimensions without overlapping inset selection strokes or generic input borders/backgrounds. The label MUST retain a visible focus indication. |
| LN-CANVAS-063 | Jump to group MUST use the public searchable Design Core Command View, support keyboard selection and no-results feedback, and return focus after navigation completes. Navigation MUST use uniformly sized compact icon buttons with touch targets and the same raised border/shadow when collapsed. |
| LN-CANVAS-064 | The custom node-colour action MUST render a circular rainbow swatch from Canvas preset variables with defined fallbacks, retain an accessible name, and open the native colour picker. |
| LN-CANVAS-065 | Canvas authoring, navigation, zoom/history, node, multi-selection and connector toolbar buttons MUST compose public Design Core Tooltip parts. Keyboard focus MUST expose their shared tooltip and accessible description. |
| LN-CANVAS-066 | Editable boards MUST expose a headerless settings popover for persisted Snap to grid and Snap to objects controls. It MUST share App input protection, show save failures, portal outside clipping surfaces, align to the settings button within the Canvas pane, and leave a 12px toolbar gap. The zoom group MUST put Zoom to fit immediately below Reset zoom. |
| LN-CANVAS-067 | URL cards in views and embeds MUST show a readable URL-derived title and host without fetching metadata. Website previews MUST be explicit opt-in sandboxed HTTP(S) iframes with no same-origin privilege and no referrer. Unsafe URLs MUST remain inert; changing the URL MUST discard the previous preview. A persistent browser-open fallback MUST explain that websites can refuse framing. No proxy or target-site changes are required. |

These alignment slices are implemented and independently qualified. Their
source and installed-host receipts live under `spec/records/`:

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

`src/lib/json-canvas-safety.test.ts` verifies rejection without data loss, imported geometry and stacking, extension retention after editing, and omitted arrow defaults. LN-CANVAS-036 through LN-CANVAS-039 qualify live embedding, file contents and bounded navigation. LN-CANVAS-040/041 qualify shared light/dark presentation and accessibility through measured browser colours, real controls and registry Mira 0.1.5. LN-CANVAS-032 through LN-CANVAS-035 qualify creation/history/clipboard; LN-CANVAS-050 qualifies native Explorer drops and empty-board camera preservation. Layout, groups, connectors, touch, web previews, note conversion and PNG export retain their independent source and installed-host receipts under `spec/records/`.

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

The combined first-party maintenance intake resolves the compatible Core
0.13 package line to released 0.13.2 alongside Mira 0.2. Package dependencies
remain registry semver ranges; runtime identity, App ownership and this
plugin's behavior contracts remain unchanged.

The public API peer admits the released `^0.4.0` host in addition to its
existing 0.2 range. Shared shell qualification uses API 0.4.0, UI 0.1.10,
Workspace 0.4.1, Core 0.13.2 and Mira 0.2 through registry exports. Runtime
identity, explicit App ownership and this plugin's behavior remain unchanged.

Camera-preservation acceptance MUST wait for Reset zoom to finish at its exact
inline camera pose before recording the pre-export transform. The fixed export
fixture MUST reach both scale 1 and the translation for its fitted bounds. Neither
a rounded computed CSS matrix nor scale alone proves animation completion.
The unchanged source and exact inline transform remain required after canceling
export options; no tolerance or additional browser budget replaces them.

### Packaged agent skill

This plugin contributes its packaged skill directory through `agentSkills`.
Installation is explicit at the vault root. Package upgrades supply new skill
content; skill updates preserve locally modified directories. `skills.json`
and signed archives MUST contain the same authored skill bytes. Qualification
is tracked separately from consumer adoption.
