# History changelog

## 0.2.1

### Patch Changes

- [#49](https://github.com/lapismd/lapis-plugins/pull/49) [`bb3a6a4`](https://github.com/lapismd/lapis-plugins/commit/bb3a6a4526a7eb5826b2b8763d18c61142248ea5) Thanks [@stevejuma](https://github.com/stevejuma)! - Admit Design Core 0.9 alongside 0.7.4 so History's settings page shares the host API's controller types. Preserve existing History behavior and native-service contracts.

## 0.2.0

### Minor Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1) Thanks [@stevejuma](https://github.com/stevejuma)! - Share the existing repository-history views and controllers through injected host services. Preserve the legacy file-history plugin and provide public repository entrypoints for desktop and hosted applications.

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`9c21eb6`](https://github.com/lapismd/lapis-plugins/commit/9c21eb6038363c2398231e04b318c1d5ff9568f7) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose an App-owned observer for acquired replacement guards so hosted services can coordinate existing protection without reacquiring the same guard.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`b1cdd70`](https://github.com/lapismd/lapis-plugins/commit/b1cdd70ae9444cb8de28c46bbba23b3b0eb54534) Thanks [@stevejuma](https://github.com/stevejuma)! - Separate explicit persisted backup selection from passive native observation
  while preserving legacy backup-service behavior and retained settings/status UI.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design Core 0.4.0 with prepared browser CSS and bundled font assets through normal npm ranges.

  Restore Bases picker input/list accessibility relationships and name property actions.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.4, and Design Core 0.7.4. The semver floors require those published versions. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

## 0.1.4

### Patch Changes

- [#6](https://github.com/lapismd/lapis-plugins/pull/6) [`03b483c`](https://github.com/lapismd/lapis-plugins/commit/03b483c89f4e3d9b8ce9af2919903ad42e9b66ad) Thanks [@stevejuma](https://github.com/stevejuma)! - Center comparison actions between revision timestamps and diff statistics on one
  row, wrapping the actions below on narrow workspace panes.

## 0.1.3

### Patch Changes

- Add official author avatars and deterministic split, light, and dark registry media for plugin banners, overviews, and galleries.

## 0.1.2

- Initial independent public package extracted from Lapis Notes without changing
  the runtime plugin ID.
