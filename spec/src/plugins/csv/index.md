# CSV Plugin

`@lapis-notes/csv` opens a vault CSV or TSV as a table, in a file view and in
a note embed. `Plugins/CSV/Panels/Table` is the first governed surface. It
loads a seeded sample, including one cell whose value contains a comma, in
every placement. Middle (Top Tabs) also opens a Markdown note that embeds
that same file. The story stays `visual-pending`. It does not capture
registry media and it does not create Visual Delta baselines.

The package lives at `packages/csv` as version `0.1.0` with runtime id
`lapis-csv`. The view type is `lapis-csv`. `App` is received by the plugin
constructor. The preview does not read or assign `globalThis.app`.

Files named `*.csv` and `*.tsv` are associated exclusively with that view,
and `registerExtensions(["csv", "tsv"], "lapis-csv")` agrees. The embed
registry entries `csv` and `tsv` are the extension renderers, so
`![[Sample.csv]]` uses the same table. An ordinary Markdown embed stays a
Markdown preview. The filename caption stays on the CSV embed. Open CSV is
the command that opens the active CSV or TSV in this view.

The file view and the embed render the original CSV table. The first row is
the header. A comma-separated file splits on commas, and a tab-separated file
splits on tabs. A quoted field keeps its comma, its line break, and a doubled
quote as one cell. Parsing and serialization use Papa Parse through the
original grid. The table uses the original rainbow columns, row numbers, and
column-actions menu, including Sort A–Z and Sort Z–A. Sorting writes the
reordered text back to the file. The table reads and writes the vault file
directly. Body rows are virtualized with TanStack Virtual, using the same
scroll-event window as Bases. The scrollport mounts the visible rows plus
overscan, and that window updates before the next paint so a fast scroll does
not run into an empty spacer. Spacer rows keep the scroll height. The seeded sample contains 2,500 data rows so that window stays
much smaller than the file. The header stays pinned while the body scrolls.
Hovering one header cell keeps that cell's opaque fill, a slightly darker
mix of the cell's own colour, so the rows underneath do not show through. The
other header cells stay on their own fill.

The furthest-right header cell switches the current leaf to the raw CSV. Toggle
CSV source is the command for the same switch. The source editor uses the Lapis
markup editor, the same shell as the source editor, with the CSV language
layered on it, so the editor keeps the configured monospace face and the host
editor settings. Each column, including a quoted cell, keeps `cm-csv-cell1`
through `cm-csv-cell5`, and separators keep `cm-csv-separator`.

The file view and the embed show a footer with the column count, the data row
count, and find and replace. The file view footer also switches between the
table and the source, and the header-cell switch stays. Find and replace uses
the transcript search bar: case, whole word, regular expression, previous,
next, replace, and replace all. The table searches cell text and writes
replacements back to the file. The source searches the editor document.
Command-F or Control-F opens the bar. Middle (Top Tabs)
also leaves a tab on that source. Lint, the settings tab, and registry
screenshots stay deferred. Web and native viewing stay a later host check. This slice
does not publish the package and does not add it to a host profile. Registry
media selection omits CSV until that screenshot slice.

## Requirements

| ID         | Requirement |
| ---------- | ----------- |
| LN-CSV-001 | CSV MUST live at `packages/csv` as `@lapis-notes/csv@0.1.0` with runtime id `lapis-csv` and view type `lapis-csv`. The plugin class MUST receive `App` from its constructor and MUST NOT read or assign `globalThis.app`. It MUST register the file view, an exclusive `*.csv` and `*.tsv` association, `registerExtensions(["csv", "tsv"], "lapis-csv")`, an Open CSV command, and `embedRegistry.register` for both `csv` and `tsv`. The file view and both embeds MUST render the original CSV table. The first row MUST be the header. Comma-separated text MUST split on commas and tab-separated text MUST split on tabs. A quoted field MUST keep an internal comma, a line break, and a doubled quote as one cell. The table MUST show rainbow columns, row numbers, and a column-actions menu with Sort A–Z and Sort Z–A. Body rows MUST be virtualized so a large file mounts only the rows inside the scrollport, and scrolling MUST keep that window filled instead of showing an empty gap ahead of the next rows. The header row MUST stay visible while those body rows scroll. Hovering one header cell MUST keep an opaque fill that is a darker mix of that cell's own colour, and the other header cells MUST keep their own fill. The furthest-right header cell MUST switch the current leaf to the raw CSV, and Toggle CSV source MUST perform the same switch. The source MUST use the Lapis markup editor with the CSV language layered on it, so editor content keeps the configured monospace face and host editor settings, with rainbow classes `cm-csv-cell1` through `cm-csv-cell5` on each column, including quoted cells, and `cm-csv-separator` on the separators. The file view and the embed MUST show a footer with the column count, the data row count, and find and replace. The file view footer MUST also switch between the table and the source, and the header-cell switch MUST remain. Find and replace MUST use the transcript search bar, including case, whole word, regular expression, previous, next, replace, and replace all. The table MUST search cell text and write replacements back to the file. The source MUST search the editor document. |
| LN-CSV-002 | `Plugins/CSV/Panels/Table` MUST open `packages/csv/assets/sample.csv`, seeded as `Sample.csv`, in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. The story MUST show the header, the row-number gutter, the column-actions control, the quoted comma cell as one cell, and both sidebars for that placement. Scrolling the table MUST show a later body cell and unmount the quoted cell, and scrolling back MUST show the quoted cell again. The header MUST stay in place while the body scrolls. The table MUST show the column count, the data row count, and find and replace in the footer, and a search for the quoted cell MUST report one match. Closing or leaving the view MUST remove that table. The play function MUST then restore the open file, and Middle (Top Tabs) MUST restore the note, so the settled story shows the table. Middle (Top Tabs) MUST also open a Markdown note containing `![[Sample.csv]]` and show the same table inside the embed frame with the filename caption, and MUST leave a tab whose CSV view state is `mode: "source"`. An ordinary note embed in that note MUST stay a Markdown preview. The table stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CSV-003 | Lint, the settings tab, registry screenshots, and web or native viewing MUST stay deferred. This slice MUST NOT publish the package, add it to a host profile, or add it to registry media selection. |

## Verification

Package tests cover the runtime id, the exclusive `*.csv` and `*.tsv`
association, both embed registrations, the Open CSV command, Toggle CSV
source, the CSV language cells, quoted-cell colours, and separator, the Lapis
markup editor shell, cell search and replacement, the original grid parser,
quoted commas, quoted line breaks, and column sort.
`Plugins/CSV/Panels/Table` asserts the header, that the header stays in place
after the table body scrolls, that a later row replaces the quoted cell and
scrolling back restores it, the row-number gutter, the
column-actions control, the quoted cell, the footer counts, a find match for
that quoted cell, the placement sidebars, and removal
of the table after the view closes. The play function then restores the open
file, and Middle (Top Tabs) restores the note, so the settled story shows
the table. Middle (Top Tabs) also asserts the filename caption on
`![[Sample.csv]]` and keeps `![[Welcome.md]]` as a Markdown preview. The
sample is `packages/csv/assets/sample.csv`.
