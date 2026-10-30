# Desktop Mira dependency compatibility

Markdown admits the Mira 0.1 public-export line and corresponding 0.0.3 editor,
AI and Mermaid plugins alongside existing portable dependency ranges. Plugin
identity and implementation stay unchanged. This resolves the exact Desktop
first-party cohort refusal without changing installed packages or publication.

The default checkout's Markdown source is byte-identical to this isolated
workspace: package build/publint pass; 21 test files / 62 tests pass.
The required audit reproduces three pre-existing DOMPurify findings through
Mermaid (critical GHSA-cg2g-xh64-v4q7, high GHSA-mrv2-3pqr-j5jr and low
GHSA-c6gr-qvv4-5v3f). On 2026-10-23 the user explicitly accepted tracking these
separately as non-blocking for this local UI migration. No ignore was added and
no audit success or release qualification is claimed.

Lapis Desktop owns isolated archive compatibility and native consumer evidence.

The isolated workspace also passes Markdown check (0 errors/warnings), build
and publint, all 62 tests, App ownership, specification validation and spec-first.
Only importer dependency ranges change in the portable registry lockfile.
