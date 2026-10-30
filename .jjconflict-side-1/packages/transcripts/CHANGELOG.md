# Transcripts

## 0.2.0

### Minor Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`b721696`](https://github.com/lapismd/lapis-plugins/commit/b72169628453c4592d367e00cd5f6d3fc204f3c0) Thanks [@stevejuma](https://github.com/stevejuma)! - Add the transcript reading view, with note parsing, front matter comments, and optional vault audio. Hidden message actions stay clear of the turn-preview markers.

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.2, and Design Core 0.7.0 through the existing semver floors. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`09596a4`](https://github.com/lapismd/lapis-plugins/commit/09596a430bccc432afeda31a46eec868a1910a12) Thanks [@stevejuma](https://github.com/stevejuma)! - Build the transcript package from its actual source root so clean installs contain the declared runtime and type entrypoints.

  Declare the host-supplied Markdown plugin as a peer dependency and retain a development dependency for building and testing Transcripts.

- Updated dependencies [[`d27467e`](https://github.com/lapismd/lapis-plugins/commit/d27467ee80c273011b7eb6ae792fa8e0330a11c1), [`f4b9136`](https://github.com/lapismd/lapis-plugins/commit/f4b9136e4f47965700e06f52f82e8e2bc884eb11), [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62), [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62), [`ae5b5d9`](https://github.com/lapismd/lapis-plugins/commit/ae5b5d9bf7d8f84296280581a8f95fd198265e62), [`56b5d6c`](https://github.com/lapismd/lapis-plugins/commit/56b5d6c1a016ef9bca43703b5fecf57f8234d1af)]:
  - @lapis-notes/markdown@0.2.0

## 0.1.0

### Minor Changes

- Add a Storybook preview of speaker turns in the design-core transcript shell.
