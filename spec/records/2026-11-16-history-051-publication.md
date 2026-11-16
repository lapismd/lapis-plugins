# History 0.5.1 publication

Feature PR #146 and version PR #147 are merged. GitHub release run
[43776424438](https://github.com/lapismd/lapis-plugins/actions/runs/43776424438)
succeeds, publishing only History 0.5.1 from
`75c7190341d34210d62b20552c324b9bd12ef6f9`. The public
[GitHub release](https://github.com/lapismd/lapis-plugins/releases/tag/history%400.5.1)
contains the signed 190857-byte archive and checksum. Its SHA-256 is
`e64bc44b949e9c5844c05bf88540f95aab815741fe6fb1fea6eecc2be6477745`.
Fresh `verifiedPublishedCoordinates` verifies the immutable GitHub tag/source,
public Ed25519 signing key, complete sorted signed file list, manifest, runtime
metadata, sizes/hashes and checksum. No prior asset is replaced.

npm 0.5.1 resolves after an initial metadata-propagation E404, with integrity
`sha512-b8OoUsHZdlTyXlrFwhc4aPvgkU/XY6bPs+dWo/8lYHHBuVZEppqqZofkiEPbyH8ab/zK8tSajHOPW+LUGNZ1rg==`.
Desktop and Server frozen installations consume normal released ranges.

Registry submission PR #166 merges as
`e31ffa40da729a99c80533f61d73b6aa305fe25e`; generated publication PR #167
passes checks and merges as `11680335934b9240df79858dbe7bfe23ba5d8b12`.
Production publish run
[43781629735](https://github.com/lapismd/plugin-registry/actions/runs/43781629735)
succeeds. Live index/detail documents and both signature sidecars byte-match
that deployed commit. The detail reports latest 0.5.1, retains all prior versions
and binds the same archive size/hash and source. SHA-256 of live detail bytes:
`a5a5a4bb779199b70ffc2b8fc867fa829cb509a35117a61563c172a4772a9e88`.

The [keyboard source receipt](2026-11-15-history-upstream-keyboard.md) retains
failed attempts and final 466-case catalog, full quality/builds and 234 release
tests. This documentation-only receipt runs formatter, specification checks and
audit. Visual stories stay pending; no baselines change. Final host acceptance
and releases remain separately owned.
