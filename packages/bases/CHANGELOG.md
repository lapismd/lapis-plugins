# Bases changelog

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
