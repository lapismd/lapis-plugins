# History 0.3.2 publication and live registry verification

History 0.3.2 is publicly released from main
`f3044ee22c0c9c5082a2d81e39dbbd7ccad4c725`. Source PR #131 and version PR #132
are merged. GitHub release workflow `43711743796` succeeds on attempt 2.
Attempt 1 stopped before publication after a browser connection closed loading
a Sync story; its final shard had 84 passing tests and one unhandled browser
infrastructure error. A cold local Sync-family rerun passes all six stories.
Only the failed hosted jobs are rerun, and the complete release workflow passes.

Release:
<https://github.com/lapismd/lapis-plugins/releases/tag/history%400.3.2>

## Published artifact evidence

The npm version endpoint and downloaded tarball verify publication even while a
cached npm packument initially reports E404. Published npm integrity is
`sha512-gMWjwzdUY5jR+4zeYisgxLOcyBEzUs6r5trQ+Hy1SrCSX+xAInzjPfbMc6n7XjZOpJcWwj2y3gBzk/5g1oEi/g==`.
The npm tarball SHA256 is
`7dd752fe5e044cc25f57f1316ade82095e5868965e47443ba82e019c011ddc08`;
npm provenance is present.

The signed `history-0.3.2.lapis-plugin` archive has 190858 bytes and SHA256
`58a99af69e5dab9189ebdf58aba9abcd739c111bb752c0211f05bacab303129c`.
Every ZIP entry, sorted signed file list, file size/hash and source coordinate is
verified. Its production Ed25519 signature verifies against the public release
key embedded in the API: key ID `lapis-plugin-release-2026-06`, public key
`bMPnlO7b+Xtthfk5wGUQAWWUV7NuIAhED4kX2EGzJqc=`.

Registry submission PR #137 checks
`b19e8151b1b6e056415d387cabd915985c6af1c9` and merges as
`6d99dd597f326073251a7c81540a5d1da7eb325f`. Separate publication PR #138 checks
`3526468f9c5d2b40d11a22afd58601114fdd6912` and merges as
`cdef112e43862f3aac5514bdc194c42490838577`. Its complete diff preserves old
versions/media hashes and changes only History plus regenerated signatures.
Production workflow `43717987401` succeeds without a pending environment gate.

Final live curl GET verification compares
<https://registry.lapis.md/v2/plugins/history.json> byte-for-byte with that
publication commit's generated metadata. The live download at
<https://registry.lapis.md/download/history/0.3.2> has the exact archive SHA256
above. A Python client received 403; ordinary curl GET succeeds. No signed
registry file or visual baseline is manually edited.

## Scope

This publication contains the qualified preview/contracts and controller work.
Production native UI adoption is a separate minor version: source PR #133 and
version PR #134 are merged, and History 0.4.0 publication remains separately
tracked. Neither release of the shared package alone qualifies Desktop/Server
custody, native scheduling, actual host composition or cold transport acceptance.
