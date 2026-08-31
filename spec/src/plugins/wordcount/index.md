# Word Count Plugin

The package-owned `registry.json` is the source for curated categories,
highlights, and registry-only Overview content under LP-SPEC-021 and LP-SPEC-033. Manifest and package
metadata remain authoritative for the fields defined by LP-SPEC-022.
Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. The governed `Registry Screenshots` story covers
a simple Markdown note in the complete shell with both sidebars closed and its
Word Count status bar visible, and stays `visual-pending` until separate visual
approval.
The capture MUST assert both the active editor content and the settled status
item before declaring the registry surface ready.
Its full-shell frame preserves both window edges before the shared dark
right-edge gutter. The same settled state drives split, light, and dark banner
media; Overview media is omitted because it would repeat the banner.

Canonical daily notes use the same Markdown word-count pipeline as other
notes. Word Count does not participate in daily-document resolution or Tasks
occurrence state.

`@lapis-notes/wordcount` owns the status-bar word and character count for the
active text editor. Presentation stays on the API status-bar contract and the
Design Core status item. It does not contribute a default sidebar leaf; an
empty vault still seeds File Explorer, Search, Bookmarks, Outline, File Properties, and
Tags.
The Lapis API host module is peer-provided by the application so the packed
plugin shares the host's App and framework identity.
Desktop and web startup report the Word Count name on the plugins task while
that plugin enables, then restore layout before starting metadata cache load.
Those host manifests MAY declare sibling `@lapismd/ai-host` without moving Word
Count ownership. The same hosts register Spell Check after Markdown Lint; that
does not change Word Count registration or status-bar ownership. Merged
language-service diagnostics (LN-WS-076) also MUST NOT change Word Count
ownership. Workspace-wide provider and plugin startup Problems (LN-WS-077,
LN-WS-078) also MUST NOT change Word Count ownership. Web Harper WASM
`application/wasm` responses (LN-WEB-030) and Harper Problems rows
(LN-SPL-009) also MUST NOT change Word Count ownership. Markdownlint and
Spell Check Problems action titles (LN-MDL-005, LN-SPL-010) also MUST NOT
change Word Count ownership. Web
agent-server URL and token Settings stay on the web host and MUST NOT change
Word Count registration or status-bar ownership. The token
field uses password presentation on that host Settings surface. Desktop
terminal vault cwd binding (LN-DENO-028) and web `--workspace` Settings copy
(LN-WEB-037) also MUST NOT change Word Count ownership. Web vault copy
progress (LN-WEB-042, LN-WEB-043) and App rebuild-cache commands
(LN-PKG-097, LN-PKG-098) also MUST NOT change Word Count ownership.
Desktop and web Tasks index-only load (LN-DENO-006, LN-WEB-044) also MUST
NOT change Word Count ownership.
Browser vault transfer error reporting through session-owned notifications also
MUST NOT change Word Count ownership.
Deno WASM database revisions and direct-SQL metadata startup are host
infrastructure and MUST NOT change Word Count registration, active-editor
counting, or status-bar ownership.

## Requirements

| ID        | Requirement                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-WC-001 | The repo MUST ship `@lapis-notes/wordcount` at `packages/wordcount` with runtime id `wordcount` as an independently versioned first-party external plugin. An application profile MAY enable it by default. |
| LN-WC-002 | Word Count MUST report words and characters for the active `TextFileView`. A non-empty selection MUST replace the document count. Other leaves MUST hide the status item.                                   |
| LN-WC-003 | Word Count MUST update `app.statusBar` with optional segments and a reading-time command. Clicking the status item MUST show reading time. It MUST NOT use compatibility status DOM.                        |
| LN-WC-004 | Deno desktop, web, editor-demo, and audited Storybook hosts MUST register Word Count as `enabledByDefault: true` and load it before metadata and layout restoration.                                        |

Word Count registry-media Autodocs use the shared full-workspace framing
governed by LP-SPEC-044.
