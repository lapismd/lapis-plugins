# API lifecycle intake artifact qualification

The clean-source `pnpm ci:release` continuation of
[the API 0.2.3 intake](2026-10-31-framework-api-intake.md) passes in isolated
Docker run `lapis-plugins-validation-c312b134-e1a6-4807-baa0-95c0795e9c13`.
Its normal empty JJ child `2a4fac364cac8f7b131c95a44a3ae5c9b6296c78` has
committed parent `26bd3df914510c400466b0e6ab61ffb0147e5cd7`; the source
guard is neither bypassed nor supplied a fabricated workflow revision.

The canonical lane completes the required source checks and tests, all 17
public package builds/publint and npm tarballs, all 17 runtime payload builds
and deterministic archive verification, and the complete static catalog build.
Every task exits zero. Runtime payload verification is source artifact evidence;
this run does not publish npm packages or create production-signed public
releases. The unchanged private Sync package stays outside the public selection.

The worker records Node 24.15.0, pnpm 10.34.5 and dependency image
`sha256:2016f18b9917179878d1d9be5e31ab3574424e5ddbb825ed716d608ce8435f7a`.
The source contains 2,211 files, snapshot pack SHA-256
`1246ac1d0eeb4cbff016d1f7ffb99ba1e740bb4e122e8a1270f2099b92718439`.
The result, complete log and 17-package tarball manifest remain under the
repository's ignored `.local/validation/runs/` directory for that run.

The graph still uses released Core 0.7.2. Final Core 0.7.3 registry intake,
source/version PR checks, versioned artifacts, actual npm/GitHub publication
and final Desktop/native acceptance remain required. Earlier failed attempts
and the source qualification counts remain in the linked intake receipt.
