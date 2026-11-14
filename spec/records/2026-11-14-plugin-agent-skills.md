# Packaged agent skills qualification

Bases, Canvas and Markdown own `lapis-bases`, `lapis-json-canvas` and
`lapis-markdown`. Each package exports `skills.json` as immutable host data and
includes its authored `skills/` resources in npm and plugin payloads. Adapted
instructions retain the upstream Obsidian skills MIT license. Runtime classes
consume their own public package export, which also works after compilation.

## Before and after

- The pre-change AI seed regression passed 1/1 while explicitly expecting a
  legacy update to overwrite a user's edit. The replacement regression passes
  1/1 and preserves that edit. Missing-only bootstrap remains intact.
- The authored Bases example initially failed one case because global filters
  use `filters`, whereas normalized per-view data uses `filter`. The exact
  parser regression now passes 1/1; the complete Bases suite passes 278 cases.
- The package staging fixture initially failed one case for missing styles;
  the complete asset/staging suite now passes four cases. It compares every
  authored file with the packaged data, payload file list and SHA-256.
- Consumer acceptance exposed a relative JSON import that broke the built
  Markdown export. The owning source now imports its public `./skills.json`
  export. After rebuilding and installing an immutable archive filename, both
  affected Server targets pass (eight cases), followed by its complete suite.

## Executed checks

- Docker `pnpm check`: 18/18 package lanes pass; `pnpm test`: 18/18;
  `pnpm build`: 17/17. Public package builds and package lint pass.
- Release-tool suite: 227 cases pass. Skill asset suite: four cases pass.
- Full cold Docker Storybook interaction/accessibility suite: 335 pass, with
  the 57 existing configured Sync skips unchanged. No visual baseline changes.
- `pnpm audit` exits successfully using the existing two low-severity ignored
  findings; no vulnerability exception is added.
- Spec-validator 0.2.0 doctor/QMD discovery and all specification gates pass.

Actual plugin archives are built only from committed source, as required by
the provenance guard. Archive construction and verification are recorded in a
follow-up qualification receipt. No package publication is performed.
