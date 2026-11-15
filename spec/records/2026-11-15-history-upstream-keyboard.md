# History upstream action keyboard qualification

Desktop adoption exposed duplicate enabled-button tab stops in the shared
`RepositoryUpstreamActions.svelte` tooltip wrappers. The owning History patch
keeps one stable wrapper and one stable button per action. Enabled wrappers
leave the tab sequence; disabled controls retain an informational focus target.
Button focus opens the matching public tooltip without moving its event props
between elements. A late close cannot clear a newer action's tooltip.

## Failed attempts retained

- The original three keyboard regressions failed, then passed after removing
  redundant enabled-wrapper tab stops.
- The first dynamic-props implementation passed 41 remotes stories. Its full
  catalog completed 466 assertions but raised one unhandled Svelte event-handler
  teardown error in Footer Summary, so that lane failed.
- The strengthened Footer Summary regression reproduced the old implementation:
  one assertion completed with three unhandled teardown errors. Passing
  assertions did not qualify that attempt.
- The first stable implementation exposed four Svelte type diagnostics. Renaming
  the synchronization state and explicitly typing the active tooltip resolved
  them. One later exact attempt could not start because the host disk was full;
  it executed zero cases and is not test evidence.

## Final source qualification

Production/stories snapshot: `608df23e3989cb55df0aaef54fccdd632f6d5100`.
History executable/stories bytes remain unchanged after documentation and the
rebase onto main `b045e791`. That main adds independent Bases/Canvas/Markdown
version metadata and CI-image verifier policy. Both governance paragraphs are
retained when resolving the append-only prose conflict.

- The exact keyboard, log-header and busy-to-enabled Footer Summary regression
  run passes four selected cases, with 37 unselected and no unhandled errors.
- History package check passes without diagnostics.
- `pnpm check`: 18 successful tasks, including the audit, package boundaries,
  App ownership and Storybook parity gates.
- `pnpm test`: 18 successful tasks; `pnpm build`: 17 successful tasks.
- A cold complete `pnpm test:storybook -- --shard=N/8` passes all eight shards:
  54, 52, 71, 83, 33, 51, 32 and 90 cases, respectively. The union contains
  **466 distinct cases in 78 files**, with no failed cases or unhandled errors.
- Shards use three validation-only JJ workspaces with tree-identical empty
  children of the source snapshot: `f4b7f70f`, `8f0ba855` and `137ee703`.
  JJ tree comparisons and the eight JUnit reports verify identity and disjoint
  test membership. Their immutable receipts retain the exact source revisions.
- `pnpm build-storybook` completes successfully. Stories remain
  `visual-pending`; no visual baseline was created or replaced.
- `pnpm test:release` passes **234 tests**, including archive, signature-fixture
  and published-coordinate verification. This does not claim a production
  signing operation.
- A fresh public History build/publint and npm pack pass. The temporary
  pre-versioning `lapis-notes-history-0.5.0.tgz` SHA-256 is
  `41a6e87632f226b05ac518d1b6e722e3fb27667c9c237ab8267de3b0ac9364ba`.
- Two independent `build-plugin-release.mjs --plugin history` builds verify and
  byte-match. Their payload SHA-256 is
  `623fe0cc8b359bdbd5411a7a87cd021d58aeb3a78d406f33730ee5cd4f6de8a4`.

The source carries an independent History patch Changeset. Versioning, GitHub
publication/signing, npm and live registry delivery of that new patch remain
separate release steps. The earlier dynamic-props consumer archive is superseded
and must not ship. Desktop and Server must consume the released stable patch and
rerun their directly affected acceptance; these source results do not qualify
cold native host behavior or credential custody.

Local command logs use `/tmp/lapis-history-upstream-stable-*`; the exact final
regression log is `/tmp/lapis-history-upstream-tab-final-exact.log`. Failed
attempts remain in their earlier logs and are summarized above.
