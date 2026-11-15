# Current-API application profile prerequisite publication

GitHub release workflow `43724959367` passes on qualified source
`1e7cda3d5eae672a66695bd577f7fa9939519240`. It selects only Markdown 0.3.1,
Search 0.1.12 and Source Editor 0.1.11. These already-versioned packages admit
the API 0.6 cohort needed by the shared Notes application profile. No package
version or release asset is replaced.

## npm and signed artifacts

Exact npm metadata, tarball integrity and SLSA provenance verify all three.
Initial metadata and Markdown tarball requests return cached 404s; normal
canonical downloads subsequently succeed without a source or registry override.
Notes' normal registry installation and subsequent frozen install pass.

| Package              | npm tarball SHA256                                                 | Signed archive SHA256                                              | Archive bytes |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------- |
| Markdown 0.3.1       | `4f7fa23a37afb3e3292645a5ecd194af4902cd1cff47bbe0d51aeb92625b62e4` | `2294f5e63f15831e2552e1229f61a1b5d7b9f5d5ed18ec70e95a937a3099ec77` | 6005931       |
| Search 0.1.12        | `65318227e515707f9b66f13673488fa1a5079fe63871eaab1bd7cb157d84fea6` | `d80f46e83fcae2ebf647a71938cf68cf16cc6a6db5eb2417405926c2f3e7e370` | 170074        |
| Source Editor 0.1.11 | `60fd66258bffc191e099407d6a57292b9cc7cf6b0a9cddcf9420bfc2855c906f` | `8230b525aa5b0cf5190c5c05ab6b7858568e80b4c32c6a93e65f343e06c97597` | 11396         |

The source-owned verifier validates every file, sorted signed list, runtime
manifest, production Ed25519 signature and exact source/version coordinate.
The production key ID is `lapis-plugin-release-2026-06`. The archives contain
180, three and three signed payload files respectively. Package-scoped GitHub
releases carry these source coordinates and archive checksums.

## Production registry

Separate submission PRs #141, #142 and #143 pass and merge as
`4d8edb5e275f26127bc7867a633fa0b019c2b1b8`,
`599b6848110a6e02e0ffd9f8456513b04a0a88e1` and
`cca76405d38f087fcf38bc452d2a7d3b7e468826` respectively.
Their one-file submissions identify source 1e7cda3d and the exact signed assets.

Combined publication PR #144 passes on
`3aacd2db60a55e1d5dcd3c118e02a213883462ad` and merges as
`fc0b88e4a26ee9f61d63a8478bf83c7a4c76ba98`. Its diff includes only the three
entries, regenerated downloads/metadata/signatures and consumed submissions.
All eight prior Markdown, seven Search and seven Source Editor version records
compare equal. Production registry workflow `43730324077` succeeds.

Live metadata GETs for `markdown`, `search` and `lapis-source-editor` byte-match
the merged candidate. Their production download GETs match the signed archive
hashes and sizes above. No signed registry file or visual baseline is edited.

## Scope

These prerequisite publications do not qualify the new public App Profile,
Desktop/Server adoption, native automatic synchronization or cold applications.
Those retain their independent owner and consumer gates.
