# Bookmarks Plugin

The package requires published Design Core `^0.7.0` for prepared browser CSS
and bundled fonts through public exports. Application state and existing plugin
behavior retain their owning contracts.

The manifest-owned author avatar uses the SHA-256 Gravatar for `dev@lapis.md`
with size 256 and initials fallback, as governed by LP-SPEC-041.

Version 0.1.4 consumes published API 0.2.0 through its portable peer range.
Shared shell qualification uses UI 0.1.4, File Explorer 0.2.0 and Workspace 0.3.0.

Release qualification uses `@lapis-notes/api@^0.2.0` for the shared renderer,
diagnostics invalidation and selected metadata fingerprint contracts. Portable
consumers must resolve this prerequisite from npm before plugin publication.

Earlier dependency acceptance used Design Core `0.3.2` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.

Bookmarks presentation resolves Design Core through the repository's current
published semver range and committed lockfile.

The package-owned `registry.json` is the source for curated categories,
highlights, and registry-only Overview content under LP-SPEC-021 and LP-SPEC-033. Manifest and package
metadata remain authoritative for the fields defined by LP-SPEC-022.
Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. The governed `Registry Screenshots` story covers
the populated Bookmarks sidebar in the shared themed shell and stays
`visual-pending` until separate visual approval.
Its focused frame retains the shared dark right-edge gutter.
The fixed banner state places Bookmarks in the primary left sidebar beside an
empty main workspace with the right dock closed. The plugin omits Overview
media because its only full-screen state would repeat that banner.

`@lapis-notes/bookmarks` owns the movable Bookmarks panel and Obsidian-compatible
`.obsidian/bookmarks.json`. It does not own Explorer, Search, or Graph.

The package consumes the published Design Core semver contract and MUST NOT
assume a sibling-repository path or a workspace `link:` override.
Package acceptance resolves Bookmarks manifest metadata from the packed npm
package, independently of the repository source layout.
The Lapis API host module is peer-provided by the application so the packed
plugin shares the host's App and framework identity.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-BM-001 | The repo MUST ship `@lapis-notes/bookmarks` at `packages/bookmarks` with runtime id `bookmarks` and `distribution: "first-party-external"`. An application profile MAY enable it by default.                                                                                                   |
| LN-BM-002 | Bookmarks MUST persist `{ items }` to `.obsidian/bookmarks.json` through plugin data. Items MUST include `file` with optional `subpath`, `folder`, `group`, `search`, `url`, and `graph`. Unknown keys and item types MUST round-trip.                                                         |
| LN-BM-003 | The plugin MUST register the `bookmarks` view through `ViewAccess.command` with `open-bookmarks` / `Open Bookmarks`. The opener MUST reveal an existing instance or create, activate, and reveal the default left sidebar. The leaf title MUST be `Bookmarks` and the icon MUST be `bookmark`. |
| LN-BM-004 | The panel toolbar MUST offer bookmark the active file or Search query, new group, collapse/expand all, and show search filter. The palette MUST also offer Bookmark URL. Creating or removing a group MUST update the visible tree from persisted items.                                       |
| LN-BM-005 | Adding a bookmark MUST show a dialog with the type-specific target — path, query, or an editable URL — and an optional title. A CommandView MUST then list existing groups plus Root. An unmatched query MUST offer Create group.                                                              |
| LN-BM-006 | Activating an item MUST dispatch by type through `openFile` or registered commands. Missing file or folder paths and disallowed URLs MUST Notice and MUST NOT invent a leaf.                                                                                                                   |
| LN-BM-007 | The tree MUST allow dragging every item kind to reparent into a group, reorder siblings, or move to root, and MUST persist `items` order.                                                                                                                                                      |
| LN-BM-008 | The filter MUST match title, path, query, URL, and subpath while keeping ancestor groups. Collapse/expand all MUST be one toggle.                                                                                                                                                              |
| LN-BM-009 | Vault rename MUST update matching `file.path` and `folder.path`. Missing targets MUST stay listed.                                                                                                                                                                                             |
| LN-BM-010 | Storybook MUST demonstrate the real Bookmarks panel in all six governed placements. Docs source MUST use public `@lapis-notes/bookmarks` imports. New visuals MUST stay `visual-pending`.                                                                                                      |
| LN-BM-011 | Each known type MUST render its Lucide icon and fallback label. Graph rows MUST remain visible when Graph is unregistered.                                                                                                                                                                     |
| LN-BM-012 | The Bookmarks tree MUST inset rows from every panel edge using the public Explorer content-padding token. The ScrollArea MUST stay flush so the scrollbar rides the panel edge.                                                                                                                |
| LN-BM-013 | Bookmarks toolbar actions MUST use the public Explorer toolbar hover and pressed tokens so ghost-button muted hover stays visible on the panel. Pressed geometry MUST stay identical to idle.                                                                                                  |
| LN-BM-014 | Bookmarks nested lists MUST use Explorer indent, guide, folder-gap, and row-gap tokens so the guide centers on the expanded chevron tip. Rows MUST NOT add a second depth indent. Leaf rows MUST NOT reserve a disclosure column.                                                              |

### LN-BM-006 acceptance details

Activation verifies:

- A `file` item opens through `openFile`. A resolved `subpath` moves the text editor to that heading or block.
- A `folder` item runs `lapis-file-explorer:reveal-path`. A `search` item runs `search:open-search` with the stored query.
- A `url` item opens `http:` or `https:` only. Other schemes Notice.
- A `graph` item Notices unless a `graph` view is registered, then opens that leaf.
- Bookmarks MUST NOT import Search or Explorer implementation files.

### LN-BM-011 acceptance details

Row presentation verifies:

- Groups use a disclosure chevron and no folder glyph. Leaf rows omit the disclosure spacer so their icon starts after the guide.
- Files use `file`, folders `folder`, searches `search`, URLs `external-link`, and graph items `git-fork`.
- Labels fall back to basename, folder name, query, URL, or `Graph` when `title` is omitted. A file `subpath` remains visible on the row.

## Runtime flow

```text
toolbar / CommandView / drag
        ↓
BookmarksStore
        ↓
.obsidian/bookmarks.json
        ↓
typed tree rows
        ↓
openFile or registered command
```

The plugin owns bookmark persistence and presentation. Cross-panel navigation
uses registered commands. The canonical palette opener is
`Bookmarks: Open Bookmarks` (`bookmarks:open-bookmarks`).

Bookmarks registry-media Autodocs use the shared full-workspace framing
governed by LP-SPEC-044, show public plugin setup under LP-SPEC-045, and
provide component and story descriptions under LP-SPEC-046.

LP-SPEC-014 governs the signed runtime editor boundary. This package declares
`@codemirror/autocomplete`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/common`, `@lezer/highlight`, `@lezer/lr`
as shared host modules and portable npm peers. Its bundled language grammars
reuse these host-owned editor and parser core instances.

The signed runtime declares its compiled Svelte imports through the exact
compiler-versioned renderer contracts in LP-SPEC-014 and LP-SPEC-047. Host-owned
components and archived components share that renderer graph; npm package peers
remain portable.

The package test toolchain uses patched Vite 6.4.4 and Vitest 4.1.12
or newer within the existing major versions. Shared catalog qualification uses
the patched Storybook toolchain described in distribution; application behavior
and public package ownership remain unchanged.

Current shared-shell qualification uses the released Design Core 0.6
public boundary and matching Notes framework archives. Published dependency
ranges now admit that boundary directly; the Avatar repair remains a recorded
local candidate until the separate release gate.
