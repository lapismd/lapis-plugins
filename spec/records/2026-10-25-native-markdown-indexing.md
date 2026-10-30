# Native Markdown metadata source intake

Date: 2026-10-25. Selected changes are based on plugin `39ac7bd4`.
Unrelated CSV and Markdown asset work remains outside this slice.

## Source and scope

The private `crates/lapis-plugin-services` crate ports the retained lightweight
Markdown extractor: nested YAML, headings, wiki/Markdown links, heading context,
tags, UTF-16 positions and MD5 of the UTF-8 source. Notes owns normalization,
publication and unattended vault lifetime. The crate has no application,
database, renderer, Tauri or HTTP dependency. No npm manifest or lock changes.

Six fixtures are shared with the renderer test. Their SHA-256 is
`ab09ab88a6b98c22f70fc830dca635b371086783967a31ef07ffbc5403927de7`.
They cover Unicode/CRLF, invalid YAML, image exclusions, adjacent links,
empty text and nested frontmatter. Existing lightweight parsing semantics are
preserved rather than replaced with a richer parser.

## Qualification

| Lane                   | Command                                                                                                     | Result                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Before native          | `cargo +1.99.0 test --manifest-path crates/lapis-plugin-services/Cargo.toml --test markdown`                | 1 pass, 1 failing conformance test                    |
| Final native           | `cargo +1.99.0 test --manifest-path crates/lapis-plugin-services/Cargo.toml`                                | 2 pass; six retained outputs and known MD5 qualified  |
| Native check           | `cargo +1.99.0 clippy --manifest-path crates/lapis-plugin-services/Cargo.toml --all-targets -- -D warnings` | Pass                                                  |
| Native build           | `cargo +1.99.0 build --manifest-path crates/lapis-plugin-services/Cargo.toml --locked`                      | Pass                                                  |
| Native format          | `cargo +1.99.0 fmt --manifest-path crates/lapis-plugin-services/Cargo.toml --check`                         | Pass                                                  |
| Exact renderer         | `pnpm --dir packages/markdown exec vitest run src/lib/metadata/extract-metadata.test.ts`                    | 8 pass                                                |
| Complete Markdown unit | `pnpm --dir packages/markdown exec vitest run --maxWorkers=2`                                               | 71 pass in 21 files                                   |
| Markdown build         | `pnpm --dir packages/markdown build`                                                                        | Package and publint pass                              |
| Governance             | `pnpm spec:check`                                                                                           | Validation, mdBook, spec-first and App ownership pass |

The ordinary verification generator preserves native table ownership rather
than copying its requirement/evidence rows into the plugin matrix. The exact
`node --test scripts/sync-spec-verification.test.mjs` regression changed from
zero passes/two failures to two passes. It retains ordinary evidence and native
table bytes, including when the native table has not yet been authored.
The full script suite passes all 121 cases in the clean qualification workspace.
The dirty main tree reports 120 passes/one existing portable-lock failure from
its local pnpm hook/checksum. No assertion was weakened and that lock is unchanged.

The main working tree's check reports two existing errors at
`packages/markdown/src/lib/mira/file-adapter.ts:89`: the uncommitted
`releaseAssetUrl` callback needs a newer Mira public contract, and its parameter
has implicit `any`. This source is unchanged by this slice. Selected native and
fixture changes were copied into a separate JJ workspace based on `39ac7bd4`.
There, `pnpm --dir packages/markdown check` passes with zero errors/warnings
against the unchanged installed public dependency cohort. Temporary validation
links only reuse that cohort; dependency contents were not edited.
The inspected cohort is API 0.1.4, UI 0.1.3, Workspace 0.2.0, Design Core 0.6.0,
Mira 0.0.5 and Mira Editor 0.0.2, through their existing public exports.

The parent snapshot's frozen install separately fails on the existing CSV lock
entry (nine missing development specifiers). No npm lock repair is claimed.

## Existing mandatory audit failure

`pnpm audit --json` reports nine findings. The same audit against `39ac7bd4`'s
manifest and lockfile reproduces one critical, three high, two moderate and three
low findings. No dependency graph or advisory suppression changed here.

| Dependency owner                                | Findings                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Mira Mermaid → Mermaid → DOMPurify              | Critical GHSA-cg2g-xh64-v4q7; high GHSA-mrv2-3pqr-j5jr; low GHSA-c6gr-qvv4-5v3f                       |
| API → Zod                                       | High GHSA-mrhx-c7xc-m3w5                                                                              |
| API → AI Host → MCP SDK → Express → body-parser | High GHSA-27r3-jxmh-p828                                                                              |
| AI → AJV → fast-uri                             | Moderate GHSA-w74x-v6f9-j3xg and GHSA-wjr9-j795-jxcr; low GHSA-xhq7-xmqj-769h and GHSA-333x-w4r6-6crp |

The repository guide requires `pnpm audit` before committing. On 2026-10-25 the
user explicitly accepted these nine unchanged findings as non-blocking for this
verified private native parser slice. That limited exception does not qualify
npm publication, deployment, new findings or unrelated unfinished source work.
The unrelated dirty npm lockfile is preserved.

## Remaining gates

Task/custom projection processors, full plugin conformance, host selection,
Search/history scheduling and cross-platform acceptance remain open. This
qualification does not publish packages, change host defaults, qualify all
Markdown features or install an application.
