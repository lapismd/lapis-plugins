# Markdown changelog

## 0.2.2

### Patch Changes

- [#54](https://github.com/lapismd/lapis-plugins/pull/54) [`91d0014`](https://github.com/lapismd/lapis-plugins/commit/91d001499930e7c4ea2c9ea622e3f5ed2d956ab3) Thanks [@lapismd-dependency-bot](https://github.com/apps/lapismd-dependency-bot)! - Refresh first-party Lapis dependencies to the published versions recorded in this pull request.

## 0.2.1

### Patch Changes

- [#49](https://github.com/lapismd/lapis-plugins/pull/49) [`2feb2be`](https://github.com/lapismd/lapis-plugins/commit/2feb2be5d28948d1afd9705efc46588993c7716d) Thanks [@stevejuma](https://github.com/stevejuma)! - Admit Design Core 0.8 and 0.9 in the Markdown dependency range for the Notebook canvas-table host cohort. Markdown behavior and CSV remain unchanged; integrated review and full qualification precede release.

## 0.2.0

### Minor Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62) Thanks [@stevejuma](https://github.com/stevejuma)! - Compose globally registered `registerMarkdownPostProcessor` callbacks into every Markdown surface, with the same mode, source, front matter, section, and surface context as per-contribution processors.

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1) Thanks [@stevejuma](https://github.com/stevejuma)! - Align shared presentation dependencies with the Design Core 0.6 public boundary used by current Notes hosts.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`f4b9136`](https://github.com/lapismd/lapis-plugins/commit/f4b9136e4f47965700e06f52f82e8e2bc884eb11) Thanks [@stevejuma](https://github.com/stevejuma)! - Accept Design Core 0.5.1 alongside the existing 0.4 release line so current local
  Desktop builds can use one compatible framework graph.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep the empty Outline explanation outside its heading list for valid accessible markup.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62) Thanks [@stevejuma](https://github.com/stevejuma)! - Resolve ordinary Markdown images through the owning vault's resource URL lease,
  including native desktop URLs, and release those leases when Mira disposes them.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design Core 0.4.0 with prepared browser CSS and bundled font assets through normal npm ranges.

  Restore Bases picker input/list accessibility relationships and name property actions.

## 0.1.6

### Patch Changes

- [#9](https://github.com/lapismd/lapis-plugins/pull/9) [`cafe5b0`](https://github.com/lapismd/lapis-plugins/commit/cafe5b084ff6579948b99226048691bf36fc7276) Thanks [@stevejuma](https://github.com/stevejuma)! - Require Mira 0.0.4 so replacing or disposing File Properties cancels pending
  overlay registration and focus work without reading destroyed Svelte effects.

## 0.1.5

### Patch Changes

- Refresh File Properties when the followed file receives a same-path metadata revision.

- Add official author avatars and deterministic split, light, and dark registry media for plugin banners, overviews, and galleries.

## 0.1.4

### Patch Changes

- [`8c23b79`](https://github.com/lapismd/lapis-plugins/commit/8c23b7911798fd73abba74e0ece91ef8745b49a2) Thanks [@stevejuma](https://github.com/stevejuma)! - Refresh File Properties when the followed file receives a same-path metadata revision.

- Allow compatible Mira patch releases so consumers can adopt the matching frontmatter refresh fix without another Markdown release.

## 0.1.3

- Initial independent public package extracted from Lapis Notes without changing
  the runtime plugin ID.
