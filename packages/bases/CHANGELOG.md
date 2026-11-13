# Bases changelog

## 0.3.1

### Patch Changes

- [#86](https://github.com/lapismd/lapis-plugins/pull/86) [`569b6c9`](https://github.com/lapismd/lapis-plugins/commit/569b6c90cbd46b1f78d9c9c9f55f913fdfeaa126) Thanks [@stevejuma](https://github.com/stevejuma)! - Correct typed-list query overloads and lexical collection callbacks while retaining explicit parser gaps.

- [#86](https://github.com/lapismd/lapis-plugins/pull/86) [`569b6c9`](https://github.com/lapismd/lapis-plugins/commit/569b6c90cbd46b1f78d9c9c9f55f913fdfeaa126) Thanks [@stevejuma](https://github.com/stevejuma)! - Correct date helper semantics and share strict Bases syntax validation with filter drafts.

- [#83](https://github.com/lapismd/lapis-plugins/pull/83) [`8c199eb`](https://github.com/lapismd/lapis-plugins/commit/8c199eb17116ac1226c58aef6bbccc0ef81c3bc9) Thanks [@stevejuma](https://github.com/stevejuma)! - Compile filter and formula expressions consistently, preserve bracketed note keys and arithmetic precedence, sort evaluated formulas, and report cyclic or invalid formulas without freezing the view.

- [#83](https://github.com/lapismd/lapis-plugins/pull/83) [`dce054c`](https://github.com/lapismd/lapis-plugins/commit/dce054c8931198b443db21acefacaa7a6f16b50c) Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve imported global string and per-view filters across layouts, reject malformed groups, and apply candidate limits only after all remaining filters can be evaluated safely.

- [#83](https://github.com/lapismd/lapis-plugins/pull/83) [`eabd95f`](https://github.com/lapismd/lapis-plugins/commit/eabd95f1830f55b6e1a933a362e114e02c746d6f) Thanks [@stevejuma](https://github.com/stevejuma)! - Correct empty-value and list-constructor semantics, accept documented date/duration constructors and split limits, convert dates to epoch milliseconds, and expose extension-free basenames. Preserve established case-insensitive matching and native extensions.

- [#76](https://github.com/lapismd/lapis-plugins/pull/76) [`7590f94`](https://github.com/lapismd/lapis-plugins/commit/7590f949cff2b4403f5c5bdf49e9ad4696f15e2d) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

## 0.3.0

### Minor Changes

- [#66](https://github.com/lapismd/lapis-plugins/pull/66) [`e6263f6`](https://github.com/lapismd/lapis-plugins/commit/e6263f6d8fa4f24de9af42b5b701fbfd55972299) Thanks [@stevejuma](https://github.com/stevejuma)! - Modernise compact List records with on-demand editing, use bounded Shadcn scrolling and body-surface Cards, add shared file-link hover previews and hover/focus underlines, improve unsupported views, and add populated Kanban and Activity registry examples.

- [#62](https://github.com/lapismd/lapis-plugins/pull/62) [`fe8e1d7`](https://github.com/lapismd/lapis-plugins/commit/fe8e1d757b51a15118983727880343042f0c07d3) Thanks [@stevejuma](https://github.com/stevejuma)! - Add configurable Markdown Kanban and Activity layouts, inline file editing, property grids, generic stamp badges, column filters and optional anchoring. Derive summaries from Markdown bodies or mapped properties, preserve the host background in embedded editors and start embedded editing with collapsed properties. Keep dated Activity headings sticky with visible column borders. Admit the released Core 0.12 cohort in History so its settings component shares the host controller type.

### Patch Changes

- [#68](https://github.com/lapismd/lapis-plugins/pull/68) [`5a54841`](https://github.com/lapismd/lapis-plugins/commit/5a54841a08814a8ead6bc6c55adc01cb174e72a6) Thanks [@stevejuma](https://github.com/stevejuma)! - Give file and fenced Markdown embeds a bounded host, compact Bases toolbar, working Search and Filter controls, and a filename chip on hover or focus. Preserve read-only behaviour, present invalid content in a Shadcn error alert, name read-only dates for assistive technology, and add Kanban/Activity embed examples. Keep Table/List edges flush and table scrollbar tracks on the body surface. Wrap additional List properties within the available width, retain label/value alignment, and keep group counts and full-width separators visible.

  Require Design Core ^0.12.3 so repeated Kanban and Activity embeds retain independent accessible landmarks and IDs.

- [#72](https://github.com/lapismd/lapis-plugins/pull/72) [`bb8229a`](https://github.com/lapismd/lapis-plugins/commit/bb8229abead6278c12f15b4708810120af3387de) Thanks [@stevejuma](https://github.com/stevejuma)! - Inset embedded grouped List headings before the expand chevron while preserving full-width separators and visible counts.

  Show automatic Table column sizing in the ordinary Embed example while retaining realistic data and narrow-pane scroll acceptance.

- [#61](https://github.com/lapismd/lapis-plugins/pull/61) [`9210719`](https://github.com/lapismd/lapis-plugins/commit/921071900dc14f6ffdcd09080a33cf330135955f) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

## 0.2.1

### Patch Changes

- [#54](https://github.com/lapismd/lapis-plugins/pull/54) [`91d0014`](https://github.com/lapismd/lapis-plugins/commit/91d001499930e7c4ea2c9ea622e3f5ed2d956ab3) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

## 0.2.0

### Minor Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`964ecbb`](https://github.com/lapismd/lapis-plugins/commit/964ecbb28d31430028eb9aaaa826e51711c9a5f5) Thanks [@stevejuma](https://github.com/stevejuma)! - Contribute the Bases file icon for .base and .bases files through the public Plugin.registerIcon lifecycle and editor-view metadata.

  Before publication, raise the API peer minimum to the release containing the file-icon contract. Development qualification uses its explicitly checksummed public archive.

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1) Thanks [@stevejuma](https://github.com/stevejuma)! - Align shared presentation dependencies with the Design Core 0.6 public boundary used by current Notes hosts.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`75be47e`](https://github.com/lapismd/lapis-plugins/commit/75be47e24af491ffc0226e923ea79825493e31c4) Thanks [@stevejuma](https://github.com/stevejuma)! - Name filter, grouping, sorting, summary and view-settings comboboxes explicitly
  for assistive technology, including the selected property in operator and sort
  direction names.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design Core 0.4.0 with prepared browser CSS and bundled font assets through normal npm ranges.

  Restore Bases picker input/list accessibility relationships and name property actions.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.4, and Design Core 0.7.4. The semver floors require those published versions. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

## 0.1.4

### Patch Changes

- Restore property-picker accessibility with unique search/result associations, named independent visibility/edit controls in grid rows, and readable hidden-property labels. Preserve keyboard activation without toggling visibility while opening an editor.

- [#16](https://github.com/lapismd/lapis-plugins/pull/16) [`a6f080e`](https://github.com/lapismd/lapis-plugins/commit/a6f080e9e09197dc883968bbd8e15cbec55a6b8e) Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve theme contrast for the results-limit label in the query menu.

## 0.1.3

### Patch Changes

- Add official author avatars and deterministic split, light, and dark registry media for plugin banners, overviews, and galleries.

## 0.1.2

- Initial independent public package extracted from Lapis Notes without changing
  the runtime plugin ID.
