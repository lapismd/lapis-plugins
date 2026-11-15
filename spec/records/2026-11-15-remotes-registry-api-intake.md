# Remotes registry API intake

The catalog now consumes released `@lapis-notes/api@0.6.2` through `^0.6.2`
and the portable registry lock. No local package hook or archive participates.
Notes PR #118 fixes optional-state projection; version PR #119 and GitHub
publication run 43667516695 establish the released source.

Hosted Plugins run 43667871489 failed two History recovery scenarios against
API 0.6.0: Multiple Operation Heads and Multiple Operation Log Heads. On the
published API, all 68 History interaction/accessibility cases pass; the complete
eight-shard catalog passes 392 cases across 76 files, retaining 57 existing skips.
No assertion or baseline changed. The same two first-click recovery targets pass.

Node 24.10.0, native validation, bounded workers:

- `pnpm ci:packages`: 51 successful build/check/test tasks, zero failures.
- `pnpm test:storybook`: 392 passed, 57 skipped, zero failures.
- `pnpm ci:release`: audit, metadata, spec/App ownership, 228 release-tool tests,
  all 51 package tasks and public packs/publint pass. The artifact phase refuses
  the nonempty JJ working copy as designed. Commit this verified dependency
  slice before rerunning artifact reproduction and static build on its source.

Real host adoption and native remote acceptance remain separate unfinished
gates. Stories remain visual-pending; no visual baseline changed.
