# Core 0.7.3 source artifact qualification

The canonical clean-source `pnpm ci:release` continuation of
[the Core intake](2026-10-31-core-073-intake.md) passes in Docker run
`lapis-plugins-validation-d06d350f-d55b-43e0-a2ec-524c923b37c4`.
The ordinary empty child `f36b9b302166ccc1657648fa4cffbf85825a8cad` has
committed parent `34d3a1a1ba6ad85d3abc702a7afe1036a9e9a5dd`. The normal
source guard runs unchanged, without a fabricated workflow revision.

All required source checks, tests and release tooling complete, followed by
all 17 public package build/publint/npm tarballs, 17 runtime payload builds
and deterministic archive verification, and the complete static catalog build.
Every task exits zero. The lane builds source candidates; it does not publish
npm packages or create production-signed public releases. Private Sync remains
outside the public selection.

The 2,213-file snapshot pack SHA-256 is
`f7a63419f78f583af8b138e61ff03a258767101e503f55ef87057e66fe0323bc`.
The dependency image is
`sha256:252ced7177c0056d751c87a801a99f4e74c38566feba16995279a7092e217c92`,
with Node 24.15.0 and pnpm 10.34.5. Complete result, log and tarball manifest
remain in the ignored validation directory for that run; the driver log is
`/tmp/lapis-plugins-core073-artifacts.log`.

This intermediate graph uses API 0.2.3, Core 0.7.3 and Mira 0.1.3 with the
existing explicit source security resolutions. The owning Mira math repair,
Core's required fixed Mira minimum, final consumer graph, source/version PRs,
actual Bases/History publication and Desktop/native qualification remain
separate required gates. No audit exception is added or transferred.
