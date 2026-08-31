# Source Editor Plugin

The package-owned `registry.json` is the source for curated categories,
highlights, and registry-only Overview content under LP-SPEC-021 and LP-SPEC-033. Manifest and package
metadata remain authoritative for the fields defined by LP-SPEC-022.
Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. The governed `Registry Screenshots` story covers
the JSON editor filling a focused workspace and stays `visual-pending` until
separate visual approval.
Capture readiness MUST assert the populated JSON document and focused workspace
instead of relying only on shell startup.

`@lapis-notes/source-editor` owns host-neutral source editing policy. The API
owns the generic editor and file-view contracts, while applications own the
static profile and Markdown owns Markdown-specific associations and rich
rendering.
The Lapis API host module is peer-provided by the application so the packed
plugin shares the host's App and framework identity.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-SRC-001 | The repository MUST publish `@lapis-notes/source-editor` from `packages/source-editor`, beginning at independent version `0.1.0`, while preserving runtime ID `lapis-source-editor`. |
| LN-SRC-002 | Source Editor MUST own the shared Editor settings and text, JSON, YAML, and YML source associations through public API and Design Core contracts. It MUST NOT claim Markdown or AI JSONL associations. |
| LN-SRC-003 | The public package MUST export `SourceEditorPlugin`, its manifest metadata, public view-definition type, and lifecycle-owned `styles.css`. |
| LN-SRC-004 | Applications that include Source Editor and Markdown in a static profile MUST register Source Editor first so Markdown may exclusively override Markdown associations. |
| LN-SRC-005 | Source Editor MUST receive App explicitly through plugin construction and lifecycle. It MUST NOT read or assign `globalThis.app`. |
| LN-SRC-006 | Package tests MUST cover its runtime ID, registration order assumptions, source associations, settings, unload behavior, and public export surface. |
| LN-SRC-007 | The npm tarball and signed runtime archive MUST carry the same package version, runtime ID, manifest, source commit, and lifecycle CSS as the other extracted first-party plugins. |
