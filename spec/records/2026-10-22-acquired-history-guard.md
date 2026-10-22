# Acquired History guard observation

The public History controller exposes an App-owned observer after its existing
editor/transcript guard has been acquired. Hosted admission can reuse that
protection without recursively acquiring the same guard. The observer grants
no write authority and cannot replace the existing protection callback.

Three exact cases failed before the export existed and pass afterward. They
cover entry after protection, settlement and rejection, App isolation, duplicate
binding and stale disposal. History check has zero diagnostics; its 15 Vitest
and 84 copied controller cases pass.

Complete source check and test lanes pass all 13 tasks each; all 12 builds and
publint pass. Release fixture tests pass 119 cases. All 257 catalog interaction
and accessibility cases pass across four sequential shards. Specification,
App ownership, package metadata and audit gates pass.

The first static build exhausted Node 26's default 4 GiB heap. A cold retry
with Node 24 and a process-local 8 GiB heap passes. No global runtime setting,
warning suppression or visual baseline changed. Archive reproduction requires
the source checkpoint `b678caa8`. After that checkpoint all 12 npm archives pack,
all 12 plugin payloads reproduce and all 12 payloads verify. The History npm
archive has SHA256 `d4b3a360621972d408079f836fb8a0d3a9edfdf1e1b633e8a728f6c3bb273db9`.
Hosted consumer integration and distribution remain separate gates.
