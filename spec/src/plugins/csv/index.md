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

The file view and the embed render one table component. The first row is the
header. A comma-separated file splits on commas, and a tab-separated file
splits on tabs. A quoted field keeps its comma, its line break, and a doubled
quote as one cell. The parser lives in the package. This slice does not add
Papa Parse.

Source rainbow highlighting, lint, row and column drag, selection editing,
undo, settings, `--csv-*` tokens, and registry screenshots stay deferred.
Web and native viewing stay a later host check. This slice does not publish
the package and does not add it to a host profile. Registry media selection
omits CSV until that screenshot slice.

## Requirements

| ID         | Requirement |
| ---------- | ----------- |
| LN-CSV-001 | CSV MUST live at `packages/csv` as `@lapis-notes/csv@0.1.0` with runtime id `lapis-csv` and view type `lapis-csv`. The plugin class MUST receive `App` from its constructor and MUST NOT read or assign `globalThis.app`. It MUST register the file view, an exclusive `*.csv` and `*.tsv` association, `registerExtensions(["csv", "tsv"], "lapis-csv")`, an Open CSV command, and `embedRegistry.register` for both `csv` and `tsv`. The file view and both embeds MUST render one table component. The first row MUST be the header. Comma-separated text MUST split on commas and tab-separated text MUST split on tabs. A quoted field MUST keep an internal comma, a line break, and a doubled quote as one cell. |
| LN-CSV-002 | `Plugins/CSV/Panels/Table` MUST open `packages/csv/assets/sample.csv`, seeded as `Sample.csv`, in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. The story MUST show the header, the quoted comma cell as one cell, and both sidebars for that placement. Closing or leaving the view MUST remove that table. Middle (Top Tabs) MUST also open a Markdown note containing `![[Sample.csv]]` and show the same table inside the embed frame with the filename caption. An ordinary note embed in that note MUST stay a Markdown preview. The table stories MUST stay `visual-pending` and MUST NOT create Visual Delta baselines. |
| LN-CSV-003 | Source rainbow highlighting, lint, row and column drag, selection editing, undo, settings, `--csv-*` theme tokens, registry screenshots, and web or native viewing MUST stay deferred. This slice MUST NOT publish the package, add it to a host profile, or add it to registry media selection. |

## Verification

Package tests cover the runtime id, the exclusive `*.csv` and `*.tsv`
association, both embed registrations, the Open CSV command, quoted commas,
quoted line breaks, escaped quotes, and the seeded sample. `Plugins/CSV/Panels/Table`
asserts the header, the quoted cell, the placement sidebars, and removal of
the table after the view closes. Middle (Top Tabs) also asserts the filename
caption on `![[Sample.csv]]` and keeps `![[Welcome.md]]` as a Markdown
preview. The sample is `packages/csv/assets/sample.csv`.
