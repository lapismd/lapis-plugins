# CSV

## 0.2.1

### Patch Changes

- [#54](https://github.com/lapismd/lapis-plugins/pull/54) [`91d0014`](https://github.com/lapismd/lapis-plugins/commit/91d001499930e7c4ea2c9ea622e3f5ed2d956ab3) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

## 0.2.0

### Minor Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`3b2e5df`](https://github.com/lapismd/lapis-plugins/commit/3b2e5df4a5753461a2561c67f9fc42d22e96a896) Thanks [@stevejuma](https://github.com/stevejuma)! - Add a Storybook CSV and TSV table view and note embed for a seeded sample.

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`8b06759`](https://github.com/lapismd/lapis-plugins/commit/8b067595fe863310e586566b1e99409fb4f79ae0) Thanks [@stevejuma](https://github.com/stevejuma)! - Mirror the workspace-host binding and the Svelte events/reactivity renderer
  modules that the CSV runtime already imports in the plugin archive's shared
  dependency metadata, so the packaged runtime resolves them from the host
  allowlist like every other Svelte component package.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.2, and Design Core 0.7.0 through the existing semver floors. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

## 0.1.0

### Minor Changes

- Add a Storybook CSV and TSV table view and note embed for a seeded sample.
