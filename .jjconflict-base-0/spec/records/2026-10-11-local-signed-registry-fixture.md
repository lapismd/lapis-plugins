# Local signed registry fixture

The ignored `.local/static-registry-acceptance/` directory contains a test-only
V2 catalog and all 12 active static plugin releases. Community is absent. Slides
is active in this fixture so its first archive can be qualified; the ordinary
source-preview site still marks its unindexed production release pending.

## Construction and verification

The fixture uses the verified payloads from
`.local/unblock-committed-archives/`, bound to source commit
`3e8980a8443e9e9c0e6b6d1bdc11769653ac1cc9`, and the matching 12 npm candidates.
The production release helper `prepareStaticReleaseCandidate` signs each archive
with an ephemeral local key, builds it twice, compares the exact bytes, verifies
the signature/file inventory, and validates npm checksums and source coordinates.
The fixture release plan explicitly has `production: false`.

Registry's `previewReleasePlan` accepts all 12 signed candidates and reports 11
existing-entry updates plus a new Slides entry. The local source-preview builder
supplies current source-owned presentation and media. Each latest release is
replaced with its verified fixture archive coordinates, all entries are active,
and the shared Community V2 index/detail schemas validate the result. A second
ephemeral fixture key signs the index, details, and empty revocation index.
Production generated files, trust pins, keys, and public assets are untouched.

Notes' actual `PluginRegistryClient` then refreshes the signed V2 catalog with
the explicit fixture public keys and reads all 12 details. The API's
`verifyPluginBundlePayload` verifies each catalog-referenced archive, expected
size/hash, signed inventory, plugin ID, version, and source commit. All 12 pass;
the client reports no stale fallback. Local file-backed fetch transports are
used only for this metadata/artifact qualification.

## Reviewable artifacts

- `.local/static-registry-acceptance/.release/release-plan.json`: versions,
  source coordinates, archive/npm hashes, and explicit nonproduction status.
- `.local/static-registry-acceptance/registry-preview.json`: generated-registry
  change summary, including the new Slides entry.
- `.local/static-registry-acceptance/catalog/v2/`: signed catalog/details,
  source-owned media, and exact signed archive bytes.
- `.local/static-registry-acceptance/fixture-trusted-keys.json`: public fixture
  keys for the next real-host acceptance stage.
- `.local/static-registry-acceptance/api-verification.json`: per-plugin verified
  version, file count, and source commit.

This does not prove plugin execution, installation persistence, actual host asset
routes, or production trust. Those remain the next stage of the
[release readiness plan](2026-10-11-static-release-readiness-plan.md). Ephemeral
fixture keys must never be added to production pins or used for public releases.
