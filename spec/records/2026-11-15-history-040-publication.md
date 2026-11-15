# History 0.4.0 publication and live registry verification

The native remotes production UI is released from qualified main
`1e7cda3d5eae672a66695bd577f7fa9939519240`, after source PR #133 and version
PR #134. Exact-main CI `43721053805` and History-only GitHub release workflow
`43721112319` pass. The PR workflow that required approval was explicitly
approved; no environment gate remains pending.

Release:
<https://github.com/lapismd/lapis-plugins/releases/tag/history%400.4.0>

## Artifact and registry evidence

The exact npm version endpoint reports 0.4.0 and SLSA provenance. The downloaded
npm tarball SHA256 is
`8aae55ca0a0418388f61538dfc755f504d1c345fc0b781624dbd42f48599f824`;
its published integrity is
`sha512-IyZOWT/gvZFD8gwMBrYt55Z/TivSXUTzLfvzPPx0PpVfyztEJjniK/9B9vSRlgU3WVBVoBbFB/VU+Ke65D4RCw==`.

The GitHub archive has 190854 bytes and SHA256
`af2f734b5e0ecbe62d0cb4f2d9d68b6904b66ceadb5ce43d86978e0270caf537`.
The owning verifier checks every archive entry, sorted signed file list,
size/hash, runtime manifest and exact source coordinate. The Ed25519 signature
verifies with production public key ID `lapis-plugin-release-2026-06`, key
`bMPnlO7b+Xtthfk5wGUQAWWUV7NuIAhED4kX2EGzJqc=`.

Registry submission PR #139 passes on
`2a77b827a995b1ec0c78de5bcdcdf0c02e045573` and merges as
`8bd461f6689a3cfa835b452ca03283561cf0a97e`. Separate signed publication PR #140
passes on `bde32ba14edffc8cfc47cefbc5d1eabc52b00e47` and merges as
`ec579c0b20bf311e5d90bcc2918b0425e44c647f`. Its complete diff changes History,
regenerated metadata/signatures and the consumed submission. All ten prior
version records compare equal; media content hashes remain unchanged.

Production registry workflow `43725482316` succeeds. Live curl GET of
<https://registry.lapis.md/v2/plugins/history.json> byte-matches the merged
candidate metadata, and <https://registry.lapis.md/download/history/0.4.0>
byte-matches the signed GitHub archive. No signed file or visual baseline is
manually edited.

## Remaining host work

This package publication qualifies shared native settings, log actions and the
existing Git split footer composition. It does not qualify Desktop/Server host
adoption, credential custody, native automatic scheduling or cold native/browser
transport acceptance. Those remain in the owning host plans and evidence.
