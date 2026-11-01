# Search changelog

## 0.1.5

### Patch Changes

- [#54](https://github.com/lapismd/lapis-plugins/pull/54) [`91d0014`](https://github.com/lapismd/lapis-plugins/commit/91d001499930e7c4ea2c9ea622e3f5ed2d956ab3) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

## 0.1.4

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1) Thanks [@stevejuma](https://github.com/stevejuma)! - Align shared presentation dependencies with the Design Core 0.6 public boundary used by current Notes hosts.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`0ed680e`](https://github.com/lapismd/lapis-plugins/commit/0ed680ef409b9bb179312d1b06cee02af56b3e8a) Thanks [@stevejuma](https://github.com/stevejuma)! - Use an explicitly selected native indexing observer for Search configuration,
  refresh and progress while preserving standalone browser processing. Keep view
  teardown passive, fence late continuations and recreate the manager when the
  plugin is enabled again.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design Core 0.4.0 with prepared browser CSS and bundled font assets through normal npm ranges.

  Restore Bases picker input/list accessibility relationships and name property actions.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.2, and Design Core 0.7.0 through the existing semver floors. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`d463ee8`](https://github.com/lapismd/lapis-plugins/commit/d463ee8c5b48ee0f3a8992c7394f48124fb2cc1c) Thanks [@stevejuma](https://github.com/stevejuma)! - Send every Search command, background-indexing, settings-recovery and
  copy-feedback notice through the explicitly owned App so a concurrent
  compatibility host cannot receive delayed errors.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`5bb36e5`](https://github.com/lapismd/lapis-plugins/commit/5bb36e5e01b7e6fb928955edc41426c12c4e5d55) Thanks [@stevejuma](https://github.com/stevejuma)! - Await Search panel teardown before the owning view finishes closing.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c2d1149`](https://github.com/lapismd/lapis-plugins/commit/c2d11499114ec92a2c168c4ec9a1efd6cbc01eee) Thanks [@stevejuma](https://github.com/stevejuma)! - Refresh Search controls after settings recovery and preserve recovered values
  when saving another preference. Reconcile recovered native indexing settings
  through the existing host controls.

## 0.1.3

### Patch Changes

- Rebuild Search after its accepted metadata inputs or parsers change, including
  when metadata reconciliation clears derived documents. Retain warm checkpoints
  for metadata files without a registered Search provider.

- Add official author avatars and deterministic split, light, and dark registry media for plugin banners, overviews, and galleries.

## 0.1.2

- Initial independent public package extracted from Lapis Notes without changing
  the runtime plugin ID.
