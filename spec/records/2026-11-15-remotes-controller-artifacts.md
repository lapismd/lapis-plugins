# Remote controller immutable-source artifact qualification

Source `b6dfab44176c43fdd85a39aae0d4da18034829f642` closes the artifact gate
left explicit in the [controller receipt](2026-11-15-remotes-controller-recovery.md).
No product, contract, story or assertion changed after that source checkpoint.

With an empty Jujutsu working-copy commit, `pnpm ci:release` passed end to end:
audit under the existing two-low-advisory policy; package/registry boundaries;
specification/mdBook/spec-first; App ownership and no-Tailwind audits; 228 release
tooling cases; all 51 package build/check/test tasks; public npm packs/publint;
all 17 unsigned plugin payload verification/reproduction checks; and a fresh
static Storybook build. The existing Vite chunk-size, unused external import and
browser externalization notices remain warnings, without new suppressions.

The local History 0.3.0 candidate payload is SHA-256
`fa368e7c98906aac13633ef20ed476b57166495c550fcf2285a3126d7c330f6d`.
It is an unpublished source-validation payload, not a replacement for the
immutable published 0.3.0 archive. The patch Changeset supplies the next release
version. Actual release signing and publication stay in protected GitHub CI.

The separate cold full catalog lane passed 392 cases with 57 existing skips
across 76 files, with interaction and accessibility failures enabled. Visual
baselines remain unchanged. Native host adoption, actual credential/network
acceptance and Desktop/Server releases remain outstanding under LN-HIST-020.
