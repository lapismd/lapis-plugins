# Native Markdown YAML parity prerequisite

R3.2.1.2.12 is Source complete for the private Rust boundary.
Last updated **2026-10-25 23:42:47 UTC**.
This qualifies the existing metadata extractor; both host adoptions and the
complete R3 indexed-vault gate remain separate.

## Retained source and corpus

The unchanged TypeScript `extractMetadata` is captured at Plugins `5031f9bb`.
The native comparison calls public Rust `markdown::extract_metadata`. Fifty-five complete JSON metadata outcomes combine the 18
frozen Tasks Unicode documents, 21 Tasks scalar cases, four Docs literal-NEL
frontmatter cases and twelve Markdown-specific scalar/root/alias/error cases.
The six historical fixtures remain unchanged. Positions, links, headings and
tags are compared together with frontmatter rather than selecting only fields
that match. Capture uses the retained JSON persistence boundary, so nonfinite
numbers use JSON null and undefined properties are absent.

Capture `lapis-markdown-yaml-capture-44ced935-49fb-49b4-8d53-a30e9a7bf4a9`
passes with all 55 outcomes and the eight original extractor tests. The earlier
`0a36e0bf` attempt failed dependency installation on the retained Bits 2.19.5
patch, executing no cases. Final-source Bits 2.20.2 validation omits only that
superseded patch during temporary installation, then restores every tracked
manifest/configuration/lock byte. No source alias or consumer patch is added.
The isolated source checkout preserves all four unrelated dirty main files.

## Exact native reproduction

```sh
cargo test --manifest-path crates/lapis-plugin-services/Cargo.toml --locked --test markdown_yaml -- --nocapture
```

Run `lapis-markdown-yaml-before-08a3d781-0c1f-444d-a442-bfb58b5cc0d2`
fails the exact native test: zero passes, one failure. It compares all 55
complete outcomes; 38 match and 17 differ. The retained actual/expected report
shows literal NEL folding/rejection, plain U+2028/U+2029 rejection, duplicate-key
acceptance, leading-01 scalar typing, null mapping keys and unknown tags. Product
parser bytes are unchanged at this failing source snapshot.

The repair uses pinned typed Saphyr 0.3.0 YAML 1.2 nodes and a private JSON
projection, with no code-point substitution, copied YAML engine or JavaScript
runtime. Unknown tags unwrap to values; the reader rejects invalid/multiple YAML
documents. The retained outer frontmatter matcher still consumes its first
closing separator. Nonfinite values and scalar keys follow the retained serialized
JSON boundary. The public parser identity advances to `markdown-native-v2`;
UTF-8 source MD5 stays unchanged. Notes must separately adopt the qualified
source to invalidate old metadata and Search projections.
All results retain source, actual archive and pinned image/input receipts under
`.local/validation/runs/`. The independent source/package/specification
results are summarized below; every failed command remains recorded.

## Exact repair and narrow source qualification

Run `lapis-markdown-yaml-after-8bccee8a-6beb-4d92-a0a1-494039faeaa3`, source
`77309632eea904e657441e2db081f586b987fd40`, passes the exact native comparison
and separate parser-version regression (two cases). All 55 complete retained
metadata outcomes match, changing 17 mismatches to zero. All 63 extractor
cases pass: eight original plus the 55 added frozen outcomes. Complete native
tests (four), strict Clippy for all targets, fmt and build also pass.

The reader uses typed Saphyr 0.3.0 with default features disabled and Ryu JS
1.0.2 for the retained JSON numeric/key coercion boundary. It removes this
crate's serde_yaml dependency. All existing retained Cargo package versions
stay unchanged; only the new reader graph is admitted. Runtime and published
npm plugin code remain unchanged. Independent source qualification is complete;
the explicitly separated owner audit/CSV gates below remain open.

## Existing audit boundary

The first full owner attempt `8af04a6f-f18a-4bc1-b3f6-85f0253c1969` repeats all
native and 63 exact extractor passes, then `pnpm check` stops on the unchanged
high Zod advisory `GHSA-mrhx-c7xc-m3w5` through published
`@lapis-notes/api > zod@3.25.76`. The repository already records this finding in
its prior audit receipt; this slice changes no npm dependency or lock byte.
Exact parent audit run `69a7b6e3-127a-4f78-b0dc-19dc9ed124ec` checks out
committed `5031f9bb` and reproduces the same one high advisory. Its full JSON
report is retained. Remaining owner commands run separately. Root check remains failed, and no ignore, major-version override or
assertion is changed. The coordinator explicitly applies the human's previously
accepted unchanged parser-owner baseline to this source-only parity follow-up;
that decision does not cover publication, release or new dependency findings.

The frozen input provenance is Tasks reader `9131b27d` (18 Unicode and 21 scalar
inputs) and Docs reader `781b2847` (four literal-NEL frontmatter inputs). Some
Tasks literal-block variants are malformed-input rejection cases, not positive
literal-block coverage. The complete Docs block case independently preserves
its literal Unicode value. All 55 expected metadata outcomes are freshly
captured from this owner's unchanged TypeScript extractor.

## Existing CSV metadata boundary

After the strict inventory repair, `3f0d9e65-67e3-4de8-bec0-d35f55b288e8`
passes the 57-family composition guard and all 47 tooling regressions, plus
native and exact retained extractor checks. `pnpm packages:check` then reports
that the unrelated CSV package manifest is not synchronized. Exact parent run
`017b7592-0dc9-4378-a703-5d40a366adb0` checks out `5031f9bb` and reproduces that
same failure. The source manifest is unchanged in this slice. No metadata
generator is run and no unrelated CSV manifest is rewritten to hide the gate.

The coordinator explicitly keeps this demonstrably unchanged parent metadata/
release finding non-blocking for the private Rust parity follow-up under the
human's latest instruction to finish routine backlog decisions without further
confirmation. Root aggregate check and package/release qualification remain
failed/open; the native source and independently executed check/test/build/spec
lanes retain their own evidence. The tiny strict CSV coverage inventory repair
is tracked separately in its [record](2026-10-25-csv-registry-parity.md).

The independent style command in `18d8a5ff-49b7-47a7-ba9d-3242a9e28208`
reports four unchanged utility strings in the two CSV table components. Parent
`1ce36868-fa9e-49a5-9680-a2dff0497e01` checks out `5031f9bb` and reproduces all
four findings. They remain with CSV ownership/release qualification under the
same explicit private-source scope decision; this slice changes no CSV styling,
product implementation or style guard. Remaining independent lanes execute
without hiding the failed commands.

## Final independent qualification

`lapis-markdown-yaml-finish-d1100209-e9c4-4bfd-b29f-0d78b3ec5704` passes all
16 package check tasks, with zero Svelte errors/warnings; all 16 test tasks
(943 Vitest plus 84 History Node cases = 1,027 unique package passes); and all
15 builds. Markdown's 126 cases include the 63 exact extractor cases, so these
counts overlap. Complete native tests/check/build and canonical specification
validation, mdBook, spec-first and App-ownership checks pass independently.
The worker remains failed: CSV metadata/style checks and the first browser
attempt are retained as failures, not relabelled as a green aggregate.

That browser attempt recorded 37 passes, seven failures and two suite-import
failures, registering 44 cases. Its ignored worker had omitted the canonical
standalone Sync frozen install, causing dependency-scan failures, optimizer
reloads and invalid module/axe imports. The repair copies the exact existing
canonical install step into the ignored harness. No tracked runner, assertion,
timeout or product implementation changes for this correction.

Fresh `lapis-markdown-yaml-browser-final-41f7dfa8-800b-46c9-a1e6-738549b616c8`,
source `5d250a5a692664ef97d8c03f21d0c68e38edd119`, passes all 54 cold Markdown
and CSV interaction/accessibility cases across ten files, with zero XML
failures/errors. It also repeats all 63 exact extractor cases, all four native
cases, strict Clippy/fmt/build and complete canonical specification gates.
The cache-identity regression now couples corrected literal-NEL metadata to a
different identity than the same source bytes with parser v1; it does not pin a
future implementation to one version string. Product bytes equal the earlier
qualified source; this test and evidence refinements are recorded separately.

The temporary source cohort contains 13 actual checksum/identity-verified
archives: the retained Notes framework and jj-history prerequisites plus final
Design Core, Agent UI, Mira and Bits candidates. Owned plugin implementations
are never replaced by archive overrides. Image
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`,
four CPUs and 12 GiB are pinned. The worker verifies source pack/checkout and
every actual archive, then restores tracked manifests/configuration/lock bytes.

`.local/validation/source-equality.json` records actual source/archive equality,
the 55 frozen retained outcomes, all original failures and their hashes, all
unchanged npm inputs and original fixtures, and the independent package/native/
XML receipts. Final evidence changes run their own specification closure. The
normal root aggregate remains blocked by the recorded unchanged owner findings;
no publication, release, baselines, host adoption or installed-app claim follows.
Notes must separately pin this commit, refresh its Cargo graph and prove parser
v2 cache/metadata/Search admission; the live renderer and host defaults stay put.
