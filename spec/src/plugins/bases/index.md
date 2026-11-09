# Bases Plugin

The authorized registry Bits UI 2.20.2 cohort exposes Select triggers as
`combobox`. Catalog role queries follow that public accessibility contract while
retaining each purpose name, selected value, action flow and geometry assertion.
The composed lifecycle/focus patch and its independent host registrations are
recorded in [the intake receipt](../../../records/2026-10-31-bits-focus-patch.md).

A standalone Bases patch carries the picker accessibility repair before the
Design Core 0.4.0 framework refresh. Search inputs explicitly reference unique
result lists and property icon actions expose accessible names. The property
popup uses grid rows with independent visibility/edit controls in grid cells,
preserving search and keyboard actions without buttons nested in options.

The package now requires the published API `^0.2.0` and Design Core `^0.7.4`
floors.

The package requires published Design Core `^0.7.4` for prepared browser CSS
and bundled fonts through public exports. Application state and existing plugin
behavior retain their owning contracts.

Bases Command search inputs explicitly reference their result lists with stable
per-instance IDs; property actions expose accessible names. Workflow acceptance
waits for opening popovers and suggestions before checking visibility or
geometry, retaining existing assertions and accessibility gates.
Filter group and operator select triggers carry explicit purpose names
independently of their selected option text; operator names include the current
property.
Grouping and sorting directions, column summaries, layout and data-driven view
options follow the same purpose-name contract across the complete Select surface.

The manifest-owned author avatar uses the SHA-256 Gravatar for `dev@lapis.md`
with size 256 and initials fallback, as governed by LP-SPEC-041.

This candidate consumes published API 0.2.0 through its portable peer range.
Shared shell qualification uses UI 0.1.4, File Explorer 0.2.0 and Workspace 0.3.0.
Mobile shell acceptance uses the published count-bearing dock label, opens the
workspace tab chooser and returns with Done. It retains real-App plugin and
collapsed-sidebar assertions; this repairs a stale story selector.

Release qualification uses `@lapis-notes/api@^0.2.0` for the shared renderer,
diagnostics invalidation and selected metadata fingerprint contracts. Portable
consumers must resolve this prerequisite from npm before plugin publication.

Earlier dependency acceptance used Design Core `0.3.2` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.

Bases presentation requires released Design Core `^0.12.3` through the
committed registry lockfile. Repeated Board and Activity embeds retain independent
landmarks and instance-scoped IDs under the public Core contract.
The configurable view-control closure includes the existing shared
`@codemirror/lint` host runtime. Its generated runtime manifest and npm peer
declaration must agree with emitted bare imports.

The result-limit label retains Design Core Label typography and theme color;
plugin opacity must not reduce its accessible contrast.

The package-owned `registry.json` is the source for curated categories,
highlights, and registry-only Overview content under LP-SPEC-021 and LP-SPEC-033. Manifest and package
metadata remain authoritative for the fields defined by LP-SPEC-022.
Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. Governed `Registry Screenshots` stories cover
focused Filter options, Cover cards with real artwork, a Grouped List with
its grouping controls open, Kanban, and Activity; all stay `visual-pending`
until separate visual approval.
Every Bases registry screenshot MUST seed both sidebars closed and retain
the real application shell, giving the selected Bases view the full available
workspace width. Story interactions MUST assert the closed left sidebar and
its accessible reopen control. Ordinary shell stories retain their Explorer
layout. The manifest summary names the table, card, and grouped Markdown
property views instead of repeating the plugin name.
The fixed banner state uses the populated cover-card workspace with real
artwork. The separate Overview image uses the Grouped List story so the body
does not repeat the hero.

The package consumes the published Design Core semver contract. Runtime and
tests MUST NOT depend on a sibling-repository path or a workspace `link:`
override; local source overrides remain an optional development concern.
Package acceptance resolves Bases manifest metadata from the packed npm
package, independently of the repository source layout.
The Lapis API host module is peer-provided by the application so the packed
plugin shares the host's App and framework identity.

Read-only file and fenced embeds under LN-BASE-008 MUST establish a nonzero,
viewport-bounded host in ordinary Markdown flow. The selected view's Shadcn
viewport remains its single data scroller, and disposal removes the owned host.
Embeds MUST show the shared Bases toolbar with the view selector at the inline
start and Search/Filter controls aligned at the inline end, with compact vertical
padding. File-backed embeds MUST show their filename in a bottom-right Shadcn
badge on hover or keyboard focus rather than repeat it in the toolbar. The badge
MUST meet the right and bottom edges and round only its top-left corner. Fenced
views MUST NOT invent a filename. Table and List content MUST have no outer
inline padding; embedded List rows retain internal start padding, and grouped
records retain their hierarchy indentation inside full-width row separators.
Embedded group headings MUST retain internal start padding before the expand
chevron while their separators span the pane.
Group headings and counts MUST stay within the visible viewport even with long
or wrapped record properties; long group labels yield space to counts. Table
scrollbar tracks MUST use the body surface so no alternate surface leaks at the
bottom or right edge. Lists with no explicit property order MUST search their
displayed filename identity. Query controls MUST work without persisting embedded source or frontmatter; file creation and view
editing actions remain unavailable in read-only mode. Invalid YAML and failed
embed reads MUST use the released Shadcn destructive Alert with an icon,
readable title and the original error details, and dispose that mounted alert.
Read-only date fields MUST retain an accessible name from their property label.
Governed Markdown embed acceptance MUST verify populated,
read-only file and fenced views, the invalid-YAML error, and render cleanup.
It MUST finish with those populated views restored for interactive review,
including after a fresh mount; cleanup acceptance must not leave the story blank.
Kanban and Activity MUST each have governed file and fenced embed examples.
The ordinary Markdown Embed example MUST use automatic Table column sizing
that fits a wide pane and overflows a constrained pane. Registry screenshot
fixtures MAY retain explicit wider columns to demonstrate both scroll directions.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-BASE-001 | `@lapis-notes/bases` MUST preserve the extracted package behavior at `packages/bases`, use runtime ID `bases`, and ship as an independently versioned first-party external plugin. Applications MAY statically include it in an app-owned profile and MUST retain user-disableable lifecycle semantics when they do.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-BASE-002 | The plugin MUST associate `.base` and `.bases` files with `BasesViewType`. A file view MUST switch between preview and YAML source, persist configuration edits, reopen through the editor association, and MUST NOT create a default Bases leaf.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-003 | Bases documents MUST normalize supported YAML into a stable document model while preserving unknown custom-view configuration. Writes MUST be serialized so rapid edits cannot reorder vault state, and the latest pending write MUST flush when a view or plugin unloads.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| LN-BASE-004 | Query execution MUST push supported candidates into paginated `AppDatabase` metadata queries, apply final PEaQL evaluation, and invalidate results from revisioned metadata changes. Memory injection MAY satisfy the same database contract in tests; first-party runtime MUST NOT enumerate the synchronous metadata cache.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| LN-BASE-005 | The renderer MUST provide table, cards, list, kanban, activity, explicit map-unavailable, unknown-view, and API-registered custom layouts. Unknown layouts and unsupported map configuration MUST remain inspectable without silently changing the document's selected view type.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-006 | Bases workflows MUST support search, filters, sorting, grouping, property visibility, formulas, summaries, limits, view add/rename/duplicate/delete and layout changes, new-file creation, and CSV export. Custom view options MUST preserve text, multitext, toggle, slider, dropdown, file, folder, formula, property, and grouped option contracts. Edit current view MUST use consistent field spacing across the view name, layout, grouping and custom options. Its popover MUST keep a fixed, viewport-bounded height with a stationary editor header and a named, keyboard-accessible Shadcn Scroll Area for overflowing fields. Geometry checks MUST observe the settled overlay before comparing fixed spacing and header position. Mapped-property pickers MUST retain Bases text typography; property IDs are secondary metadata rather than keyboard shortcuts. |
| LN-BASE-007 | Text, number, checkbox, date, tags, and supported metadata cells MUST edit the target file's frontmatter and refresh query results. Text-like cells MUST use normal autocomplete controls without search icons, offer existing metadata values, and paint an opaque table-cell surface. Tag and multivalue controls MUST wrap their values and expand the owning table row. File-derived and formula-derived fields MUST remain immutable, while file links MUST navigate through the injected App. File links across Table, Cards and List MUST underline only on hover or keyboard focus and show a bounded Markdown hover preview through the owning App’s public surface provider, disposing it on dismissal.                                                                                                                                                                                                                                                                     |
| LN-BASE-008 | Markdown integration MUST render `.base` file embeds and `base` or `bases` fenced YAML blocks through a read-only Bases surface. Invalid YAML MUST render a bounded error state, and teardown MUST revoke created image URLs and dispose query resources.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| LN-BASE-009 | The package MUST export default and named `BasesPlugin`, `BasesViewType`, `BasesViewSurface`, `parseBasesDocument`, `serializeBasesDocument`, and consumer document/view types. Its source and built entrypoints MUST import without changing static query-type metadata. `BasesViewSurface` MUST accept `app`, `document`, optional `onChange`, `readOnly`, `showHeader`, and optional `BasesViewRegistration` mappings.                                                                                                                                                                                                                                                                                                                                               |
| LN-BASE-010 | Production presentation MUST compose public Design Core primitives with Bases-owned semantic classes, `data-ui-component` or `data-ui-part` markers, native CSS, and `--ui-bases-*` tokens. The packaged stylesheet MUST NOT redefine host root typography tokens such as `--font-sans` or `--font-mono`. Runtime code MUST receive `App` explicitly and MUST NOT read a global application singleton.                                                                                                                                                                                                                                                                                                                                                                  |
| LN-BASE-011 | Governed Storybook coverage MUST exercise public table, cards, grouped-list, kanban, map-unavailable, unknown-view, workflow, schema/settings, editable-cell, Desktop and Mobile real editor shells with Explorer visible and indexed Search retained collapsed, real file-view, Markdown-embed, and disable/restore scenarios. Standalone shell previews MUST fill the viewport without padding or page scrolling while Docs remain isolated at 700px. File-view, runtime, and pointer acceptance MUST wait for explicit preview readiness with enough bounded startup time for concurrent catalog execution before interacting with persisted layout controls. Every scenario MUST include interaction assertions and remain `visual-pending` until human review.     |
| LN-BASE-012 | The port MUST document real-map, Obsidian wrapper/formula, `this` binding, richer file/link, grouped-summary, duplicated runtime-model, stub-formula, and name-only parity gaps. It MUST NOT add Tasks-owned views or claim full Obsidian behavior.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-BASE-013 | Table and cards MUST retain their reference control density at the Bases boundary, while Lists MUST use compact record rows. All three MUST use current Design Core theme tokens and accessible contrast. Icon-only grouping and sort controls MUST expose stable accessible names. Editable table checkboxes MUST be centered 1rem squares. Table headers, rows, and summaries MUST share one ordered width model and remain aligned before, during, and after column resizing and horizontal scrolling. Wrapped variable-height rows MUST preserve shared cell boundaries and measured virtual and sticky-group offsets.                                                                                                                                                                 |
| LN-BASE-014 | The plugin MUST register the complete legacy surface: the `bases` view, `.base` and `.bases` editor association, extension aliases, read-only embeds and fenced blocks, preview/source toolbar actions, and Table, Unknown, Cards, List, Kanban, and Map view items. It MUST NOT invent palette, ribbon, status, or settings commands absent from the legacy plugin.                                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-BASE-015 | Bases source mode MUST register and apply a CodeMirror YAML language pack through the `bases` editor view. The source editor host MUST expose `data-language="yaml"`, highlight YAML syntax for both `.base` and `.bases`, and restore the same extensions after mode changes without changing the file-view association.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| LN-BASE-016 | A focused editable table cell MUST paint one continuous inset active boundary at all four corners. The boundary MUST be owned by the outer cell, MUST NOT be duplicated by nested editor wrappers, and MUST NOT alter the row's shared height or column geometry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-017 | An autocomplete suggestion popover MUST close when focus leaves its field or an outside interaction dismisses it. Dismissal MUST NOT restore focus to the trigger and reopen the list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-BASE-018 | Every cell in a wrapped variable-height row MUST align its primary content to the row start. Text, number, date, checkbox, file, folder, tag, and multivalue cells MUST share that vertical origin while checkboxes remain horizontally centered.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-019 | An open Bases autocomplete suggestion popover MUST imply an active editing input. Opening a field with an existing value MUST focus and select that value, initially expose alternative suggestions, and allow pointer or keyboard replacement without an extra activation click. Clicks targeting the cell surface or rendered value text MUST establish the same editing state.                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-020 | The table viewport MUST fill the available vertical Bases surface and compose Design Core's public shadcn Scroll Area for horizontal and vertical overflow. Its styled horizontal scrollbar MUST remain visible at the bottom edge of that full-height container, and the Scroll Area viewport MUST remain the single scroll element that drives row and column virtualization. Cards and Lists MUST also own one bounded Shadcn viewport. Card virtualisation and resize measurement MUST use that viewport, with at least one responsive column. Summaries MUST remain clear of sticky group headings. |
| LN-BASE-021 | Selected property, sort, and group indicators plus checked editable booleans MUST use the Bases accent fill with a white on-accent glyph. Unchecked controls MUST retain an opaque white surface and visible boundary in the Lapis light theme.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-BASE-022 | The filter popover MUST preserve the legacy 45svw width while remaining bounded by the available viewport. Its panel and segmented filter row MUST use the opaque workspace surface rather than sidebar paint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| LN-BASE-023 | All-views and this-view filter disclosure triggers MUST place their indicators at the inline start through the public Design Core Accordion contract. Indicators MUST point right when collapsed and down when expanded. Disclosure semantics and keyboard behavior MUST remain unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| LN-BASE-024 | Filter-builder value editors MUST vertically align with their segmented row. Group and operator selects MUST retain a visible selected label and paint their option content above the parent filter popover at the trigger anchor. Advanced filter expressions MUST apply syntax-token colors to parsed CodeMirror spans.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| LN-BASE-025 | The table MUST omit an outer bottom and inline-end container frame while retaining its internal row and column grid. The last row MUST retain its bottom separator. Scrollbar tracks MUST meet the container edge without reintroducing the outer frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| LN-BASE-026 | An initial blank filter row MUST count as the first predicate. The first Add Filter activation MUST preserve that predicate and append a second visible row rather than replacing the placeholder with an indistinguishable placeholder.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| LN-BASE-027 | The sticky table header MUST remain above scrolling table rows but below portaled filter panels. Opening Filter MUST produce an opaque hit-tested panel over every intersecting header cell, while its nested Select portals remain above the panel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-BASE-028 | The Sort and Filter outer popovers MUST resolve the same 45svw width and the same viewport maximum. Sort's internal Scroll Area MUST fill that shared width rather than retaining the former 25svw constraint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| LN-BASE-029 | Advanced filter expressions MUST use the shared Lapis CodeMirror completion popover chrome in Storybook and production hosts. Focusing the inline query editor MUST NOT paint CodeMirror's default dotted outline; the surrounding segmented filter row remains the visible focus boundary.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| LN-BASE-030 | Advanced filter source mode MUST validate non-empty expressions without preventing correction. Invalid drafts MUST mark the CodeMirror textbox invalid, show a destructive error label beneath it, and MUST NOT replace the last valid applied filter. Correcting the draft MUST clear the error and apply the valid expression.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-BASE-031 | Governed Bases Storybook coverage MUST start from persisted indexed rows, surface an async metadata query failure, and recover after a later committed invalidation without enumerating a MetadataCache snapshot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-032 | Filter group and operator selects MUST expose explicit accessible names identifying their purpose independently of selected option text. An operator's name MUST include the current property display name and update when that property changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-BASE-033 | Grouping and sorting directions, column summaries, layout and every data-driven view-option select MUST expose an explicit accessible purpose name. Property-specific sort names MUST include the current property display name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-BASE-034 | Kanban MUST render query-derived groups through Design Core, fill its bounded pane, and keep column headers and selection rings visible while card stacks use Shadcn Scroll Areas. Board and Activity embeds MUST preserve the workspace host’s single main landmark. Lane metadata and ordering persist in the view document; moves write typed values only to supported writable note properties.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-BASE-035 | Board and Activity MUST expose grouping, anchoring and card mappings in the existing Edit current view settings, including an independent card-chip property defaulting to the title, with hidden mapped properties included in query projection and metadata invalidation. Grouping and mapped fields MUST share the searchable, bordered property picker used by view settings. A missing description value falls back to a truncated Markdown-body excerpt. Inferred properties MUST use the same scoped identifiers as settings and query projection.                                                                                                                                                                                                               |
| LN-BASE-036 | File-backed cards MUST open shared inline details from board, activity, pins and maximized columns, with a rendered Markdown preview and the registered Markdown file editor. Close, move and card-switch requests MUST flush editing and retain dirty content on failed persistence. A writable mapped title MUST edit its source metadata, or rename the file when mapped to its name. Successful state changes MUST retain the detail and update its styling.                                                                                                                                                                                                                                                                                                        |
| LN-BASE-037 | Activity MUST be an independent Bases layout using one configured date property or the first typed date field in result-property order, with newest days first and invalid or missing values kept under Undated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-BASE-038 | Document and view filters MUST remain global, while independently persisted column predicates apply after grouping using the existing query language. Filtered-empty columns remain visible and show filtered/total counts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| LN-BASE-039 | Kanban MUST offer an always-open column setting with automatic, selected-column and None modes, scoped to the grouping identity without falling back from an unavailable explicit selection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| LN-BASE-040 | Cards MUST support an optional mapped badge with configurable label and colour, using type-aware value formatting that preserves zero and false without assuming follow-up or date semantics. Badge colour MUST use the shared colour picker.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| LN-BASE-041 | Every visible non-title property MUST occupy its own cell in an ordered two-column grid, filling left then right and retaining a placeholder for missing values rather than concatenating additional properties.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

| LN-BASE-042 | Card bodies MUST default to the themed body surface while preserving explicit card surface customisation. Registry examples MUST configure short cover headers through real view configuration and contain enough realistic records to demonstrate vertical scrolling. |
| LN-BASE-043 | Lists MUST render compact records with configured primary identity, a wrapping row of labelled secondary properties aligned on their first text baseline, and collapsible group headings with counts. Group values MUST be bold and tags MUST use the shared Lapis Tag List. Grouped records MUST be indented beneath their parent heading and start with a decorative Lucide bullet. Values MUST have usable minimum widths, with numbers kept on one line and long text bounded to two lines with ellipsis while retaining its complete accessible value and edit source. Writable properties MUST activate editors on click or keyboard; Escape MUST discard uncommitted drafts. Existing per-type commits, read-only values and file navigation MUST remain intact, and Table/Card editing MUST remain unchanged. |
| LN-BASE-044 | Unknown view types MUST retain their configuration and render a centred Shadcn Empty state with an icon, unsupported-view title, configured type and guidance to the existing view menu. |

## Public surface

`BasesViewSurface` is the focused rendering boundary. Consumers provide an
`App` and normalized document; file-view persistence, Markdown processors, and
managed-plugin lifecycle remain `BasesPlugin` responsibilities. Built-in view
registrations combine with App registrations unless an explicit mapping
overrides a matching type.
Focused view stories boot the external plugin against the canonical
Projects seed before mounting this public surface.

The port keeps query and TanStack-to-Svelte adapters private. Package evidence
retains the legacy 14-file / 142-test baseline and adds regressions for explicit
App flow, ordered and flushed writes, URL revocation, invalid read-only YAML,
and the published entrypoint without expanding the public surface.
Deno desktop, web, and the real-App catalog import the plugin and stylesheet from
the package, register it through a story-owned static profile, and load it
before metadata and persisted layout restoration.

## Presentation and workflow components

The table surface owns measured virtual rows, sortable and draggable columns,
wrapped multivalue editing, inline metadata editing, and summaries. Cards own
cover resolution and URL cleanup.
Card queries project the configured image property even when that property is
not displayed in the card field order.
List owns compact records, activation-based field editing and collapsible groups
with counts. Map is an explicit bounded fallback; unknown layouts use the shared
Shadcn Empty state. Header and settings compounds own query controls, schema visibility,
formulas, summaries, limits, view management, new-file, and CSV workflows.
The Bases stylesheet keeps control density local to these surfaces; current
Design Core remains the authority for theme colors and typography. Source mode
uses a Bases-owned YAML editor registration rather than treating `yaml` as a
file view or relying on an unregistered extension alias.
The Bases leaf declares `ViewAccess.file`: `.bases` and `.base` associations
remain its explicit file-backed opening path rather than a palette panel.

## Intentional parity gaps

This intake preserves the legacy package rather than expanding it. A real map
provider, complete Obsidian value wrappers and method-style formula semantics,
`this` binding, richer file/link behavior, deeper grouped summaries, removal of
the compatibility/runtime duplication, and behavioral parity beyond exported
name comparison remain future work tracked in `MIGRATION.md`.
The current query source lowers safe candidates into AppDatabase filters and
reads unbounded candidate sets in stable path pages. A fully lowered view limit
uses one bounded sorted page; final PEaQL evaluation remains authoritative.

Bases registry-media Autodocs use the shared full-workspace framing governed
by LP-SPEC-044, show public plugin setup under LP-SPEC-045, and provide
component and story descriptions under LP-SPEC-046.

LP-SPEC-014 governs the signed runtime editor boundary. This package declares
`@codemirror/autocomplete`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/common`, `@lezer/highlight`, `@lezer/lr`
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

Current App-backed catalog seeds and copyable host examples use `.lapis`
for application state, matching the Notes-wide default. Historical vault data
and the frozen Deno host are not migrated or edited.

## File artwork

<a id="lp-spec-056"></a>

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LP-SPEC-056 | Bases MUST register its custom file SVG through the owning Plugin icon helper and contribute that ID for `.base` and `.bases` editor-view patterns. Plugin unload MUST release its artwork through the API lifecycle. Source and consumer qualification MUST use the public API archive containing that helper until the corresponding registry release is available. |

## Markdown board reference catalog

Kanban reference stories load self-contained role, task and research Markdown files
through the real App. Their grouping property is `phase`, not a required `status`.
The reference is CV Studio sample content at `34486d1e`; fixed dates and extra
non-domain values keep the fixtures portable. The shared card renderer supplies summaries, generic badges and an ordered two-column metadata grid.

The catalog groups Board and Activity examples under `Plugins/Bases/Views/Kanban`.
Reference collections include multiple cards per lane; the scrolling scenario
uses 24 groups with 16 Markdown files each in a bounded pane. Its interaction
asserts actual horizontal board and vertical lane movement.

Activity lane headings retain their date, count and themed top border when
stuck in the owned scroll viewport, with one separator at the resting day edge.
