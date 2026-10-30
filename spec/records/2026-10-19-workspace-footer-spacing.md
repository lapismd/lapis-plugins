# Workspace footer composer spacing

LN-AI-027 follows the approved Design Core footer design: the shell now reserves
a full-width footer track. The AI composer keeps its ordinary 0.75rem spacing
and no longer adds the status height. This source slice is for the updated host;
portable ranges, runtime identity, storage, commands and agent behavior are unchanged.

Validation:

- `pnpm --filter @lapis-notes/ai check`: pass, no Svelte errors or warnings.
- `pnpm --filter @lapis-notes/ai test`: 77 files, 376 tests pass.
- `pnpm --filter @lapis-notes/ai build`: pass, public dist and publint.
- `pnpm exec vitest run --project storybook stories/plugins/ai/panels/Chat.stories.ts --maxWorkers=1`: six real-shell placement interaction/axe stories pass.
- `pnpm audit`: exit 0; existing approved moderate/high ignores remain reported;
  no new ignore or dependency change.
- `pnpm spec:check` and `pnpm check:app-ownership`: pass.
- `pnpm test:release`: 119 release/archive/signature regression tests pass.
- Archive preparation rejected the dirty working-copy source, as designed;
  archive/reproduction/signature checks follow the source commit.

No publication, signing with production credentials or baseline update.
The enclosing Jujutsu change owns this evidence. Package handoff and desktop
qualification remain separate; no AI provider or native gate is promoted.
