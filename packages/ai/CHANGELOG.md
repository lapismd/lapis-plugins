# AI changelog

## 0.1.7

### Patch Changes

- [#54](https://github.com/lapismd/lapis-plugins/pull/54) [`91d0014`](https://github.com/lapismd/lapis-plugins/commit/91d001499930e7c4ea2c9ea622e3f5ed2d956ab3) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

- Updated dependencies [[`91d0014`](https://github.com/lapismd/lapis-plugins/commit/91d001499930e7c4ea2c9ea622e3f5ed2d956ab3)]:
  - @lapis-notes/markdown@0.2.2

## 0.1.6

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`9ce36d0`](https://github.com/lapismd/lapis-plugins/commit/9ce36d0a45ee2dcea4fd1a99261fc2a210de8dcb) Thanks [@stevejuma](https://github.com/stevejuma)! - Stop reserving the workspace status-bar height under the AI chat composer.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1) Thanks [@stevejuma](https://github.com/stevejuma)! - Align shared presentation dependencies with the Design Core 0.6 public boundary used by current Notes hosts.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design Core 0.4.0 with prepared browser CSS and bundled font assets through normal npm ranges.

  Restore Bases picker input/list accessibility relationships and name property actions.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.2, and Design Core 0.7.0 through the existing semver floors. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

- Updated dependencies [[`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1), [`f4b9136`](https://github.com/lapismd/lapis-plugins/commit/f4b9136e4f47965700e06f52f82e8e2bc884eb11), [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62), [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62), [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62), [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af)]:
  - @lapis-notes/markdown@0.2.0

## 0.1.5

### Patch Changes

- [#6](https://github.com/lapismd/lapis-plugins/pull/6) [`86f38d2`](https://github.com/lapismd/lapis-plugins/commit/86f38d211bd8beaf4e2e748e65aee8002409f77b) Thanks [@stevejuma](https://github.com/stevejuma)! - Refresh model catalogs when the harness changes in chat or Settings, distinguish native and ACP providers, and discard stale discovery results. Pass the owning vault when checking initial desktop controller readiness.

- Updated dependencies [[`cafe5b0`](https://github.com/lapismd/lapis-plugins/commit/cafe5b084ff6579948b99226048691bf36fc7276)]:
  - @lapis-notes/markdown@0.1.6

## 0.1.4

### Patch Changes

- Add official author avatars and deterministic split, light, and dark registry media for plugin banners, overviews, and galleries.

- Updated dependencies []:
  - @lapis-notes/markdown@0.1.5

## 0.1.3

### Patch Changes

- [`8c23b79`](https://github.com/lapismd/lapis-plugins/commit/8c23b7911798fd73abba74e0ece91ef8745b49a2) Thanks [@stevejuma](https://github.com/stevejuma)! - Refresh the AI catalog when the active workspace leaf changes its folder scope.

## 0.1.2

- Initial independent public package extracted from Lapis Notes without changing
  the runtime plugin ID.
