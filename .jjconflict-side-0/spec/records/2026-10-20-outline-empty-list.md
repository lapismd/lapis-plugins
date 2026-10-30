# Empty Outline list semantics

Desktop's original seven Search cases reach their expected interactions with the
updated Search package, but all seven fail axe's `list` rule. The current
Markdown empty Outline places a paragraph directly inside `Sidebar.Menu`'s
`ul`. Move the empty explanation outside the heading list, preserving its
existing presentation, content, heading navigation and follow behavior.

LN-MD-022 gains a governed No headings review story using the real App, followed
note and public Vault modification path. Its interaction and axe checks are the
source regression; Desktop's seven exact Search cases remain the consumer gate.
No accessibility rule, assertion, deadline or visual baseline is relaxed.

Qualification:

- `pnpm exec vitest run --project storybook stories/plugins/markdown/panels/Outline.stories.ts -t 'No headings' --bail=1`:
  before 1 failure (axe `list`), after 1 pass and 6 skipped.
- Full Outline family: 7/7 interaction/accessibility cases pass in a fresh
  Vitest browser process. The first family command also included a nonexistent
  AI History path; Vitest selected Outline only. AI History was run separately.
- `pnpm --filter @lapis-notes/markdown check`, `test`, and `build`: zero
  errors/warnings, 62/62 unit tests and public build/publint pass.
- Desktop consumer qualification is recorded in its E-ARCHIVES-002 evidence.

Logs: `.local/desktop-current-core-outline-{before,after}.log` and
`.local/desktop-current-core-focused-stories.log`. Visual review remains pending.
