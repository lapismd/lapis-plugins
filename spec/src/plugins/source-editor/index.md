# Source Editor Plugin

The package requires Design Core `^0.7.0` for prepared browser CSS
and bundled fonts through public exports. Application state and existing plugin
behavior retain their owning contracts.

The manifest-owned author avatar uses the SHA-256 Gravatar for `dev@lapis.md`
with size 256 and initials fallback, as governed by LP-SPEC-041.

Version 0.1.3 consumes published API 0.2.0 through its portable peer range.
Shared shell qualification uses UI 0.1.4, File Explorer 0.2.0 and Workspace 0.3.0.

Release qualification uses `@lapis-notes/api@^0.2.0` for the shared renderer,
diagnostics invalidation and selected metadata fingerprint contracts. Portable
consumers must resolve this prerequisite from npm before plugin publication.

Earlier dependency acceptance used Design Core `0.3.2` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.

Source Editor presentation resolves Design Core through the repository's
current published semver range and committed lockfile.

The package-owned `registry.json` is the source for curated categories,
highlights, and registry-only Overview content under LP-SPEC-021 and LP-SPEC-033. Manifest and package
metadata remain authoritative for the fields defined by LP-SPEC-022.
Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. The governed `Registry Screenshots` story covers
the JSON editor filling a focused workspace and stays `visual-pending` until
separate visual approval.
The generated card preserves the complete full-shell capture so the focused
editor remains visible before the shared dark right-edge gutter.
Capture readiness MUST assert the populated JSON document and focused workspace
instead of relying only on shell startup.
The fixed banner state uses that populated editor shell with both sidebars
closed. The plugin omits Overview media because its only full-screen state
would repeat the banner.

`@lapis-notes/source-editor` owns host-neutral source editing policy. The API
owns the generic editor and file-view contracts, while applications own the
static profile and Markdown owns Markdown-specific associations and rich
rendering.
The Lapis API host module is peer-provided by the application so the packed
plugin shares the host's App and framework identity.

## Requirements

| ID         | Requirement                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-SRC-001 | The repository MUST publish `@lapis-notes/source-editor` from `packages/source-editor`, beginning at independent version `0.1.0`, while preserving runtime ID `lapis-source-editor`.                   |
| LN-SRC-002 | Source Editor MUST own the shared Editor settings and text, JSON, YAML, and YML source associations through public API and Design Core contracts. It MUST NOT claim Markdown or AI JSONL associations. |
| LN-SRC-003 | The public package MUST export `SourceEditorPlugin`, its manifest metadata, public view-definition type, and lifecycle-owned `styles.css`.                                                             |
| LN-SRC-004 | Applications that include Source Editor and Markdown in a static profile MUST register Source Editor first so Markdown may exclusively override Markdown associations.                                 |
| LN-SRC-005 | Source Editor MUST receive App explicitly through plugin construction and lifecycle. It MUST NOT read or assign `globalThis.app`.                                                                      |
| LN-SRC-006 | Package tests MUST cover its runtime ID, registration order assumptions, source associations, settings, unload behavior, and public export surface.                                                    |
| LN-SRC-007 | The npm tarball and signed runtime archive MUST carry the same package version, runtime ID, manifest, source commit, and lifecycle CSS as the other extracted first-party plugins.                     |

Source Editor registry-media Autodocs use the shared full-workspace framing
governed by LP-SPEC-044, show public plugin setup under LP-SPEC-045, and
provide component and story descriptions under LP-SPEC-046.

The TypeScript-only package uses `tsc -p tsconfig.json --noEmit` for its
`check:types` gate. Svelte component checks apply to packages with Svelte source.

LP-SPEC-014 governs the signed runtime editor boundary. This package declares
`@codemirror/language`, `@lezer/common`, `@lezer/highlight`, `@lezer/lr`
as shared host modules and portable npm peers. Its bundled language grammars
reuse these host-owned editor and parser core instances.

The package test toolchain uses patched Vite 6.4.4 and Vitest 4.1.12
or newer within the existing major versions. Shared catalog qualification uses
the patched Storybook toolchain described in distribution; application behavior
and public package ownership remain unchanged.
