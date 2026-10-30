# PDF

## 0.2.0

### Minor Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`dfecd23`](https://github.com/lapismd/lapis-plugins/commit/dfecd238090c53985a9d0cd6c0dfaa47f244d664) Thanks [@stevejuma](https://github.com/stevejuma)! - Add a Storybook PDF file view and note embed for a seeded sample.

### Patch Changes

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`3d0bfb2`](https://github.com/lapismd/lapis-plugins/commit/3d0bfb2aa26b91b9cae40a32eb44b15d14fdeafc) Thanks [@stevejuma](https://github.com/stevejuma)! - Build the PDF package from its actual source root so clean installs contain the declared runtime and type entrypoints.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c7ba8de`](https://github.com/lapismd/lapis-plugins/commit/c7ba8de804899193e606b21ee188f0dcda75005c) Thanks [@stevejuma](https://github.com/stevejuma)! - Resolve the PDFium WASM asset through the public `@embedpdf/pdfium` package export (`@embedpdf/pdfium/pdfium.wasm`) instead of a hard-coded `node_modules/.pnpm` path, so the portable package and archive builds complete.

- [#28](https://github.com/lapismd/lapis-plugins/pull/28) [`c9febb1`](https://github.com/lapismd/lapis-plugins/commit/c9febb1c8b431db30ecdcf7507cfff8f727bc4ed) Thanks [@stevejuma](https://github.com/stevejuma)! - Consume the published Notes next packages, Mira 0.1.2, and Design Core 0.7.0 through the existing semver floors. Markdown dependents accept ^0.2.0. History keeps its public repository entrypoints, and Bases keeps the file-icon contract on API 0.2.0.

## 0.1.0

### Minor Changes

- Add a Storybook PDF file view and note embed for a seeded sample.
