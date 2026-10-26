# CSV Plugin

`@lapis-notes/csv` opens a vault CSV or TSV as a table, in a file view and in
a note embed. `Plugins/CSV/Panels/Table` is the first governed surface. It
loads a seeded sample, including one cell whose value contains a comma, in
every placement. Middle (Top Tabs) also opens a Markdown note that embeds
that same file. The story stays `visual-pending` and does not create Visual
Delta baselines. `Plugins/CSV/Registry Screenshots` captures the release
cards.

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
column-actions menu, including Sort A–Z and Sort Z–A. Each column header
also has a sort button to the left of that menu. The menu icon is vertical.
The button cycles ascending, descending, and the original row order, and shows
an up-and-down icon, an up chevron, or a down chevron. Sorting writes the
reordered text back to the file. The table reads and writes the vault file
directly. Body rows are virtualized with TanStack Virtual, using the same
scroll-event window as Bases. The scrollport mounts the visible rows plus
overscan, and that window updates before the next paint so a fast scroll does
not run into an empty spacer. Spacer rows keep the scroll height. The seeded sample contains 2,500 data rows so that window stays
much smaller than the file. The header stays pinned while the body scrolls.
Hovering one header cell keeps that cell's opaque fill, a slightly darker
mix of the cell's own colour, so the rows underneath do not show through. The
other header cells stay on their own fill. That hovered column header also
draws the same inset ring a focused body cell uses, around the header border.
Editing the header label keeps that border and does not add a second ring on
the field. Holding the pointer on a body cell paints that cell immediately,
and dragging extends the selection as the pointer crosses cells. A press that
stays on one cell does not leave a selection behind.

The furthest-right header cell switches the current leaf to the raw CSV. Toggle
CSV source is the command for the same switch. A file view can also open the
same grid as a canvas sheet. Show CSV canvas is the command, and the footer
switches among the table, the canvas, and the source. The leaf keeps that
choice. With no leaf mode, the CSV setting `lapis-csv.defaultView` chooses
`table` or `canvas`, and `table` is the default. A note embed stays on the
DOM table. The canvas paints column letters, a shaded header from the first
row, a row-number gutter, hairline grid lines, a selected range, and an
active-cell border. The letter row, the CSV header, and the row-number rail
stay fixed while the body scrolls. The rail is one band with a single edge,
so scrolled grid lines do not show through it. It paints only the visible
rows of the sample. Cell text is clipped at the cell edge. Wrap text on the
toolbar wraps a long cell onto extra lines and grows that row to fit, up to
four lines. Dragging a column
boundary resizes that column for the session and does not write the width
into the file. Double-clicking that boundary sizes the column to its text.
The active cell is an editor over the painted cell. Enter commits, Escape
cancels, and the edit uses the same grid write as the table. Clicking a
column letter or header selects that column, and a sort button on the right
of the header cycles the sort. Clicking a row number selects that row.
Right-clicking a column letter, header, or sort button selects that column
and offers move left, move right, clear, and delete. Right-clicking a row
number selects that row and offers move up, move down, clear, and delete.
Right-clicking a cell selects that cell and offers clear and delete. Every
menu item shows an icon. A toolbar above the sheet shows the same actions as
icon buttons with tooltips for the selected column, row, or cell, and includes
Wrap text. Find and replace, and those menu actions, write the file. The
sheet menu and toolbar use the interface face. Row and column drag-reorder
stays on the DOM table. `Plugins/CSV/Panels/Canvas` opens that sheet on
`Sample.csv`, edits a cell, resizes a column, and checks the file text. It
stays `visual-pending`.

The source editor uses the Lapis markup editor, the same shell as the source
editor, with the CSV language layered on it, so the editor keeps the configured
monospace face and the host editor settings. Each column, including a quoted
cell, keeps `cm-csv-cell1` through `cm-csv-cell5`, and separators keep
`cm-csv-separator`.

The row-actions column stays pinned to the inline end of the scrollport,
including inside a note embed, so the hover menu stays visible when the table
is wider than the frame. Hovering a body row reveals that row's actions
button. Table and source text use the theme monospace face.

The file view and the embed show a footer with the column count, the data row
count, and find and replace. Footer icons use the transcript status size. The file view footer also switches among the table, the canvas, and the
source, and the header-cell switch stays. Find and replace uses
the transcript search bar: case, whole word, regular expression, previous,
next, replace, and replace all. The table searches cell text and writes
replacements back to the file. A non-empty valid table search hides body rows
that contain no match, and the footer then reports the shown rows against the
total, as in `4 columns · Showing 23 rows (filtered from 57 total rows)`.
Clearing or closing the search shows every row and the plain count again. The
header stays. The source searches the editor document and keeps every line.
Command-F or Control-F opens the bar. Middle (Top Tabs)
also leaves a tab on that source.
`Plugins/CSV/Registry Screenshots` supplies the release-page capture. The
banner is the open table, overview is the coloured source, and the gallery
cards are that source, the note embed, and find on the quoted cell. Those
stories stay `visual-pending`. Capture uses
`pnpm registry:media:capture --plugin csv`. Lint, delimiter and header
settings, and web or native viewing stay deferred. This slice does not
publish the package and does not add it to a host profile.

## Requirements

| ID         | Requirement |
| ---------- | ----------- |
| LN-CSV-001 | CSV MUST live at `packages/csv` as `@lapis-notes/csv@0.1.0` with runtime id `lapis-csv` and view type `lapis-csv`. The plugin class MUST receive `App` from its constructor and MUST NOT read or assign `globalThis.app`. It MUST register the file view, an exclusive `*.csv` and `*.tsv` association, `registerExtensions(["csv", "tsv"], "lapis-csv")`, an Open CSV command, and `embedRegistry.register` for both `csv` and `tsv`. The file view and both embeds MUST render the original CSV table. The first row MUST be the header. Comma-separated text MUST split on commas and tab-separated text MUST split on tabs. A quoted field MUST keep an internal comma, a line break, and a doubled quote as one cell. The table MUST show rainbow columns, row numbers, and a column-actions menu with Sort A–Z and Sort Z–A. Each column header MUST show a sort button to the left of that menu, the menu icon MUST be vertical, and the button MUST cycle ascending, descending, and the original row order. Editing a header label MUST keep the header border ring and MUST NOT draw a second focus ring on the field. Body rows MUST be virtualized so a large file mounts only the rows inside the scrollport, and scrolling MUST keep that window filled instead of showing an empty gap ahead of the next rows. The header row MUST stay visible while those body rows scroll. The row-actions column MUST stay inside the scrollport, including when the table is wider than an embed frame. Hovering a body row MUST reveal that row's actions button inside the scrollport. Table and source text MUST use the theme monospace face. Hovering one header cell MUST keep an opaque fill that is a darker mix of that cell's own colour, and the other header cells MUST keep their own fill. Hovering a column header MUST draw the same inset ring a focused body cell uses, around that header's border. The furthest-right header cell MUST switch the current leaf to the raw CSV, and Toggle CSV source MUST perform the same switch. The source MUST use the Lapis markup editor with the CSV language layered on it, so editor content keeps the configured monospace face and host editor settings, with rainbow classes `cm-csv-cell1` through `cm-csv-cell5` on each column, including quoted cells, and `cm-csv-separator` on the separators. The file view and the embed MUST show a footer with the column count, the data row count, and find and replace. The file view footer MUST also switch between the table and the source, and the header-cell switch MUST remain. Find and replace MUST use the transcript search bar, including case, whole word, regular expression, previous, next, replace, and replace all. The table MUST search cell text and write replacements back to the file. A non-empty valid table search MUST hide body rows that contain no match, keep the header, and the footer MUST report the shown row count against the total. Clearing or closing that search MUST show every row and the plain count again. The source MUST search the editor document and MUST keep every line. |
| LN-CSV-002 | `Plugins/CSV/Panels/Table` MUST open `packages/csv/assets/sample.csv`, seeded as `Sample.csv`, in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. The story MUST show the header, the row-number gutter, the column-actions control, the header sort button, the quoted comma cell as one cell, and both sidebars for that placement. Scrolling the table MUST show a later body cell and unmount the quoted cell, and scrolling back MUST show the quoted cell again. The header MUST stay in place while the body scrolls. The table MUST show the column count, the data row count, and find and replace in the footer, and a search for the quoted cell MUST report one match, hide the other body rows, and report that one shown row against the total. Closing the search MUST show the other rows again. Closing or leaving the view MUST remove that table. The play function MUST then restore the open file, and Middle (Top Tabs) MUST restore the note, so the settled story shows the table. Middle (Top Tabs) MUST also open a Markdown note containing `![[Sample.csv]]` and show the same table inside the embed frame with the filename caption, and MUST leave a tab whose CSV view state is `mode: "source"`. An ordinary note embed in that note MUST stay a Markdown preview. The table stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CSV-003 | `Plugins/CSV/Registry Screenshots` MUST capture the open table as the banner, the coloured source as overview, and gallery cards for that source, the note embed, and find on the quoted cell. Those stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. Lint, delimiter and header settings, and web or native viewing MUST stay deferred. This slice MUST NOT publish the package or add it to a host profile. |
| LN-CSV-004 | The file view MUST open as `table`, `canvas`, or `source`. `lapis-csv.defaultView` MUST be `table` or `canvas` and MUST default to `table` when the leaf has no mode. The footer and Show CSV canvas MUST switch the leaf, and a note embed MUST stay on the DOM table. The canvas MUST paint column letters, the header from the first row, row numbers, grid lines, the selected range, and the active cell, and MUST paint a window of a long file instead of every row. The letter row, the CSV header, and the row-number rail MUST stay fixed while the body scrolls, and scrolled grid lines MUST NOT show through the rail. Cell text MUST be clipped at the cell edge unless Wrap text is on, in which case a long cell MUST wrap onto extra lines and that row MUST grow to fit, up to four lines. Dragging a column boundary MUST resize that column without writing the width into the CSV, and double-clicking that boundary MUST size the column to its text. Clicking a column letter or header MUST select that column, a sort button on the right of the header MUST cycle the sort, and clicking a row number MUST select that row. Right-clicking a column letter, header, or sort button MUST select that column and offer move left, move right, clear, and delete. Right-clicking a row number MUST select that row and offer move up, move down, clear, and delete. Right-clicking a cell MUST select that cell and offer clear and delete. Every menu item MUST show an icon. A toolbar MUST show those same actions as icon buttons with tooltips for the selected column, row, or cell, and MUST include Wrap text. Editing a cell, sorting a column, find and replace, and those menu actions MUST write through the same grid as the table. The sheet menu and toolbar MUST use the interface face. `Plugins/CSV/Panels/Canvas` MUST open the canvas on `Sample.csv`, edit a cell, resize a column, and check the file text. It MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |

## Verification

Package tests cover the runtime id, the exclusive `*.csv` and `*.tsv`
association, both embed registrations, the Open CSV command, Toggle CSV
source, the CSV language cells, quoted-cell colours, and separator, the Lapis
markup editor shell, cell search and replacement, the original grid parser,
quoted commas, quoted line breaks, column sort, and drag-selection bounds.
`Plugins/CSV/Panels/Table` asserts the header, that the header stays in place
after the table body scrolls, that a later row replaces the quoted cell and
scrolling back restores it, the row-number gutter, the
column-actions control, the header sort button, the quoted cell, the row-actions column inside the
scrollport, the theme monospace face, the row-actions button revealed on
hover, the column-header ring, the footer counts, a find match for
that quoted cell that hides the other body rows and reports the one shown
row against the total, the placement sidebars, and removal
of the table after the view closes. The play function then restores the open
file, and Middle (Top Tabs) restores the note, so the settled story shows
the table. Middle (Top Tabs) also asserts the filename caption on
`![[Sample.csv]]` and keeps `![[Welcome.md]]` as a Markdown preview. The
sample is `packages/csv/assets/sample.csv`.
`Plugins/CSV/Registry Screenshots` asserts the open table, the coloured
source, the note embed, and find left open on the quoted cell, with both
sidebars closed. Sheet layout tests cover column letters, the minimum column
width, a column sized to its text, the visible row window of the 2,500-row
sample, and pointer hits for a header cell, a body cell, a column boundary,
the sort button, and the row gutter.
`Plugins/CSV/Panels/Canvas` edits a canvas cell, resizes a column, and reads
the new text back from the file. It stays `visual-pending`.
