# Markdown changelog

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
