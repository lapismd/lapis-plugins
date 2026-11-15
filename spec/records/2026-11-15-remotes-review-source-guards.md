# Repository source and review guards

This source slice prepares the approved remote components for host adoption.
It does not register production remote services or qualify a live host.

Working-copy parsing retains the native source, defaults legacy omitted-source
frames to backup and rejects unknown/null sources. Controller-session dismissal
tracks one review identity per target, suppressing the same review on refresh
without modifying native authority. A new native review remains visible. The
review dialog follows current `canPush` capability, so locked storage cannot
leave its publication button enabled; Cancel remains available.

## Regression evidence

- `node --import tsx --test test/repository/repository-working-copy.test.mjs`
  initially passed three tests and failed one source-preservation regression.
  After correction all four pass, including legacy and invalid-source behavior.
- `pnpm exec vitest run src/lib/repository/controllers/remotes-service.test.ts`
  initially passed ten tests and failed the new dismissal/refresh regression.
  All eleven pass after the controller fix. Dismissal sends no native mutation.
- Cold `pnpm test:storybook stories/plugins/history/remotes/Remotes.stories.ts
-t 'Locked Review Cannot Publish'` initially failed once with an enabled Push
  button. Its first rerun still failed because the new assertion did not wait
  for Svelte to apply the fixture transition. After adding the ordinary reactive
  wait, the original product code again failed the exact enabled-button check;
  restoring the capability guard passes one story with zero failures.
- The initial root check found one missing `remoteCommit` in the new unit-test
  fixture. The complete fixture now uses null for an absent remote branch.
  Root `pnpm check` then passes all 18 tasks, including audit, App ownership and
  package boundaries. Root `pnpm test` passes all 18 tasks; `pnpm build` passes
  all 17 package builds and publint checks.
- Strengthening the new story to prove Cancel actually dismisses its review
  exposed a separate preview-lifecycle failure. Three diagnostic attempts
  retained the failing assertion and proved the callback had not run. The
  initial review had opened in the footer before Settings mounted, and was then
  unmounted beneath the new Settings dialog. The catalog owner now stages that
  initial review until Settings has mounted, preserving one correct modal
  order. The exact cold story passes, including one dismissal callback, absent
  review/dialog and zero publication. No Design Core workaround is introduced.
- Both complete catalog runs pass all 450 interaction/accessibility stories
  across 78 files/eight serial shards. The second run includes the corrected
  initialization and stronger Cancel assertions. The subsequent root check
  passes all 18 tasks. The static catalog passed before that fixture correction;
  the final rebuild also passes with its corrected opening order.
- `pnpm spec:check` passes. Frozen installation uses released dependencies.
  No source alias, package patch or visual baseline mutation is introduced.
- History npm pack succeeds; 22 archive/signature/release tests pass. The first
  archive preparation correctly refused a dirty working-copy source. The local
  qualification rerun explicitly names its immutable JJ snapshot through the
  supported `--commit` option and reproduces the payload deterministically. No
  public asset or package is published by that validation.

All commands use Node 24.10.0. Source validation runs with
`LAPIS_PLUGINS_VALIDATION_RUNTIME=native`. The added story remains
`visual-pending`; UI approval does not approve baseline replacement.

## Remaining gates

This source slice is qualified. Host adoption, credential adapters, live
transport acceptance and the feature release retain their
separate gates under LN-HIST-020. The intermediate specification run found
three missing LP-SPEC-002 chapter mappings after adding the patch Changeset;
Distribution, Native Services, Governance and the mapped verification row now
retain this slice, and the unchanged specification gate passes again.
