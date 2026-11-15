# History 0.5.0 publication

The user approved GitHub release delivery and required workflow approvals.
Feature PR #138 and version PR #139 are merged. GitHub release run
`43754851292`, attempt 1, passes every blocking validation lane and publishes
only History 0.5.0 from exact source
`57d420831bc38f4dbe874699a05431125ab4e9ee`. No existing assets are replaced.

The npm registry reports 0.5.0 as latest. The downloaded registry tarball's
SHA-512 matches its published integrity:
`sha512-zHGeeT4jRNkaHmvmbl//b615qY3gxYQYebAJgkoSAqjKT86+nEOt0pMpfsP45dLlZUJAWFsq3XdNVzcDB8B/Nw==`.
Its SHA-256 is
`984d81c8902caf9b378176a45c1bae2c369ac249414cd23424cf8900c41223d0`.
The CI candidate npm archive has identical integrity. Published SLSA provenance
identifies the same source commit, `release.yml`, and GitHub run/attempt.
Registry metadata becomes visible before the tarball; initial normal installs
refuse the temporarily unavailable version/archive. Once delivery propagates,
normal frozen Notes installation succeeds without an archive overlay.

The GitHub `history@0.5.0` release contains the signed plugin and checksum.
The downloaded 190854-byte archive's SHA-256 is
`324d09b19f4cf7bd8fc1a7db42ddb36f47b742a42325e03399a60d1ca1e37019`.
The public release key verifies its Ed25519 envelope, exact signed file list,
file sizes/hashes, manifest identity and source commit using
`verifyPluginBundle`.

Registry submission PR #159 merges as
`93ea6434f2b14b9931191cc7345d50f36a04f846`; the separate generated publication
PR #160 passes checks and merges as
`2a777f6e2a6dc2ef4676116e14643ac2eba92dbc`. Publish run `43759777635`
succeeds. Live `https://registry.lapis.md/v2/plugins/history.json` reports
latest 0.5.0 and the same immutable release target. Its inline/sidecar signatures
match; the registry trust key verifies the canonical document with inline
signatures excluded, following the registry verifier's contract.

No visual baselines change. Shared source and publication are qualified; final
App Profile/Server/Desktop registry intake, cold application acceptance and
their releases remain independent outstanding gates.
