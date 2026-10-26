# Link Previews

Editable link previews remain Markdown-owned full-file surfaces. Registered
domain contributions may enrich rendered content while Mira retains serialized
writes, dirty-buffer protection, blur return, and Escape handling.

Backlinks and Outgoing Links share one app-bound preview and editing contract.
Ordinary internal links rendered by Mira use the same adapter and appearance but
remain Mira-owned. Public `MarkdownEmbed` uses the same App adapter and the
current Mira editor-extension resolution for standalone Markdown strings.
Those embed surfaces retain their explicit default-collapsed frontmatter input;
the document default in LN-MD-108 applies only to workspace note surfaces.

Backlinks and Outgoing Links retain this preview behavior when a legacy
view-type alias is restored. Canonicalization changes only persisted workspace
identity, not link resolution or preview ownership.

Portable image rendering uses Mira's public `readAssetUrl` and
`releaseAssetUrl` hooks. The owning App's vault acquires and revokes each asset
URL; missing files return no URL. The existing registered-embed path remains
available without a desktop-specific loader or resource workaround.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-MD-118 | Every writable Mira preview MUST bind its captured source session to the original App's editing registry. Pending, failed and retired writes MUST participate in flush and protection. Changing files or owners MUST NOT redirect an earlier write, and failed detached sessions MUST remain discoverable until persistence or explicit recovery succeeds.                                                                |
| LN-MD-119 | On conditional-capable vaults, bound previews MUST use public API FileTextPersistence with the source session's acknowledged text as their independent baseline. Background reads and another preview's state MUST NOT advance that baseline. Missing portable text authority MUST reject binding, and conditional failure MUST NOT fall back to unconditional writes.                                                    |
| LN-MD-120 | Bound-preview recovery MUST compose public API conflict actions with the original Mira text session's recovery lease. Each operation MUST retain its own acknowledgement, reset and release callbacks. External snapshots MUST be revalidated before a draft is discarded or overwrites disk; a superseded decision MUST remain unresolved.                                                                               |
| LN-MD-123 | On an App selecting native editor intents, bound previews MUST hold input through the public Mira synchronous input lease before native admission. The binding MUST expose captured acknowledged text, report newer dirty generations and retain its existing writer. Guarded mutation MUST yield only after protected persistence and rearm before editing resumes; uncertain admission or rearm MUST retain protection. |

Native admission uses only the input lease's release action. It does not
accept local content, select external content or add a persistence callback.
Mira constructs and immediately binds its source writer before user input;
dirty and in-flight retained sessions remain fenced through the same public
lease. Native Tasks stays inside the App registry guard.

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-MD-026 | The Markdown package MUST adapt the Lapis vault, metadata cache, workspace navigation, and `EmbedRegistry` to Mira's public `MiraFileAdapter`. One App MUST reuse one adapter instance so preview effects do not churn.                                                                                                                                                                                                     |
| LN-MD-027 | Ordinary internal links rendered by Mira in reading and live-preview modes MUST retain the Lapis `MiraFileAdapter` resolution, lazy preview, and navigation path while delegating timing, safe pointer handoff, owner-document mounting, collision placement, appearance, and topmost cross-pane paint to Mira's portable Bits UI `LinkPreview`. Lapis MUST NOT add a portal wrapper, source alias, or clipping workaround. |
| LN-MD-028 | The Lapis MiraFileAdapter MUST reject missing or non-Markdown write targets. Hosts without conditional text writes MAY retain ordinary writeMarkdown through app.vault.modify. Conditional hosts MUST reject unbound writes instead of silently using unconditional persistence.                                                                                                                                            |
| LN-MD-029 | Ordinary Mira note previews and link-panel `FileEmbed` previews MUST share minimal content-first chrome without a visible filename or path header. Rendered Markdown receives disclosure-safe inset, and editing uses a two-pixel focus-ring border.                                                                                                                                                                        |
| LN-MD-030 | Ordinary Mira note previews and link-panel `FileEmbed` previews MUST resolve the same Lapis-aligned Mira appearance.                                                                                                                                                                                                                                                                                                        |
| LN-MD-054 | Reading mode and live preview MUST receive the Lapis Mira adapter so ordinary internal note links and embeds use Mira's portable preview surfaces.                                                                                                                                                                                                                                                                          |
| LN-MD-055 | Backlinks and Outgoing Links previews MUST compose the public app-bound `FileEmbed` inside Design Core Hover Card and Scroll Area instead of maintaining a private full-document preview. Their viewport-capped width defaults to 26rem.                                                                                                                                                                                    |
| LN-MD-056 | The complete link-panel mention row MUST remain the clickable and focusable Trigger child. Bits UI owns open/close timing, keyboard focus, pointer corridors, collision placement, and owner-document behavior; Lapis MUST NOT duplicate those mechanisms. The overlay remains topmost and interactive across constrained editors and floating panes.                                                                       |
| LN-MD-057 | The Lapis Mira adapter MUST resolve source-relative links, read and watch Markdown, list files and headings, open workspace files, render registered embeds and images with cleanup, and decline unowned types for portable fallback.                                                                                                                                                                                       |
| LN-MD-058 | Generic and direct embeds MUST preserve `internal-embed`, `markdown-preview-surface--embedded`, `markdown-embed-surface`, and `data-markdown-embed`. Editable panel cards use embedded Markdown identifiers without fabricating the generic guided wrapper.                                                                                                                                                                 |
| LN-MD-059 | Ordinary Mira internal-link previews MUST become editable automatically. Backlinks and Outgoing Links MUST opt their public `FileEmbed` into the same `EditableMarkdownPreview` lifecycle and pin their Hover Card while editing.                                                                                                                                                                                           |
| LN-MD-060 | Editable previews MUST enter toolbar-free live preview from a plain non-interactive click, debounce writes for 500ms, and flush on configured exits. Escape closes after a successful flush; failed writes retain an accessible dirty editor.                                                                                                                                                                               |
| LN-MD-061 | Direct document `![[file]]` embeds MUST remain read-only. Lapis owns storage and Hover Card composition but MUST NOT copy Mira's editor, persistence coordinator, click filtering, or CodeMirror pipeline.                                                                                                                                                                                                                  |
| LN-MD-062 | Editable panel `FileEmbed` MUST omit the embedded-note guide and retain a sticky top-right open-note action that stays visible while content scrolls and reserves normal-flow content space.                                                                                                                                                                                                                                |
| LN-MD-063 | In edit mode, the preview viewport MUST constrain `FileEmbed` so CodeMirror owns vertical scrolling. The outer Scroll Area MUST NOT clip an unconstrained editor or introduce a second scrollbar.                                                                                                                                                                                                                           |
| LN-MD-064 | Editing cards MUST ignore hover departure and focus movement. Outside pointer dismissal flushes and closes only after successful persistence; Escape remains keyboard dismissal, and failed saves keep the dirty editor open.                                                                                                                                                                                               |
| LN-MD-065 | Mira-owned portaled previews and Lapis full-file Markdown surfaces MUST resolve the effective `obsidian` theme. Editable `FileEmbed` and full-file surface roots MUST establish that theme explicitly so Mira descendants consume Lapis semantic appearance tokens instead of the portable fallback palette.                                                                                                                |
| LN-MD-066 | The local Obsidian alias layer MUST map Mira accent, focus, soft-accent, selection, and accent-foreground variables to design-core's Lapis semantic tokens. Preview-only inset MUST NOT affect nested live-edit frontmatter widgets.                                                                                                                                                                                        |

The shared link sidebar rebuilds mention groups under `LN-MD-098` after late
metadata load or a new followed path, then applies this preview contract to those rows.
Linked rows come from indexed incoming or outgoing link queries plus async
per-file metadata. Unlinked candidates come from bounded Search queries, so
the panel never walks the vault-wide synchronous cache or every note body.
Outgoing candidate discovery tokenizes the active indexed Search document,
limits query and result counts, and reuses returned Search content. It MUST NOT
reread the active or candidate Markdown body when those documents are already
indexed.

Panel browser acceptance waits for preview entrance geometry before asserting
the unchanged 400px minimum width. Visibility can precede the end of Hover Card
animation; that intermediate frame does not define the settled card size.
