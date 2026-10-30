# Native Canvas Search source intake

R3.2.2 stages the retained Canvas provider in the owning private plugin crate.
The TypeScript built-in provider, published package inputs and Markdown parser
remain unchanged. Application scheduling/configuration, source publication,
custom providers and both application selections remain separate gates.

## Retained oracle and exact source boundary

Immutable capture `99416756-1187-4f89-b019-686282f3fe7c`, source `5e60e90c`,
calls the unchanged `CANVAS_SEARCH_DOCUMENT_PROVIDER.extract` directly under
Node in the pinned Docker image, with no copied extractor or application boot.
All 37 complete string outcomes are frozen in the shared `search-canvas.json`.
The normal Search package suite also calls that provider for each frozen case.

The exact native target is:

```sh
cargo test --manifest-path crates/lapis-plugin-services/Cargo.toml --locked --test search_canvas -- --nocapture
```

Before run `3cd26a27-8bb7-46ac-813b-e6ee97620754`, source `c1d951a3`,
rechecks all 37 unchanged oracle outcomes, then records one unresolved-import
compile error: no native Search module exists. It executes no native test.
Initial implementation run `2e5b4233-bcd4-4040-aa18-f3936c281146`, source
`5554d71b`, executes the native target with zero passes/one failure. The retained
provider falls back to original source for numeric/boolean fields, including
zero/false, because optional `.trim()` excludes only null/undefined. The repair
retains that behavior rather than weakening the frozen output.

Exact after run `f81760bd-5476-4d1b-b990-73dd3ba73623`, source `6dc7faa4`,
passes one native case/zero failures and all 37 retained outcomes. All five
native cases, formatting, strict all-target Clippy and native build pass.
The extractor preserves field order, duplicates, original nonblank whitespace,
Unicode, missing/null fields, malformed source fallback and ECMAScript trim's
NEL/BOM distinction. It does not add dependencies or a JSON/JavaScript runtime.

## Complete source qualification

Immutable run `73e6c499-c671-4b5d-b01a-d961dbd76aa0`, source
`e1c01c829e6faf9bde2da717401ad93a20853de4`, passes all native, retained-provider,
Search package and specification commands:

- All 37 focused retained-provider cases and all 87 complete Search cases;
  these counts overlap. Complete native tests pass five cases with zero failures.
- Locked native build, formatting and strict all-target Clippy.
- Search Svelte/types checks (zero errors/warnings), public build, publint and
  npm pack. The packed output remains separate from publication/release.
- App-ownership audit and all three canonical specification lanes.

The actual 13 prerequisite archives and source pack are checksum/identity
verified before temporary installation, with tracked manifest/lock/workspace
bytes restored before tests. No production TypeScript, npm input or existing
parser implementation changes. Since this adds a private pure native leaf and
its retained-oracle test, unchanged UI/catalog/runtime-release lanes are not
repeated; both host adoptions remain unqualified.

`audit.json` retains the same previously accepted high Zod advisory
`GHSA-mrhx-c7xc-m3w5` through the published API; the worker fails on any new
advisory. The [prior source receipt](2026-10-25-native-markdown-yaml.md) includes
its exact committed-parent reproduction. That source-only exception covers no
publication or release. Aggregate owner CSV metadata/style findings remain
open independently. Final evidence prose runs its own specification closure;
all native/fixture/TypeScript test bytes must match this qualified snapshot.
