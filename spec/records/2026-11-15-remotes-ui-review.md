# Repository remotes approved UI review

The reviewed production components remain mounted only in the shared catalog.
The user approved this UI and authorized continuing host adoption and releases.
All 40 remotes stories retain `visual-pending`; no baselines were changed.

The full shell has no description banner or extra History toolbar. JJ Log and
Op Log omit their dropdowns and show configured-target circular Fetch/Push
actions. Multiple operation heads remain selectable from the empty log body.
The collapsed Git split button opens working-copy details; a centered double
chevron expands saved-local, diff and incoming/outgoing status. The themed
compact details header aligns Fetch, Push and Settings on the right. Settings
retain independently scoped backup/original connections. GitHub handoff has its
artwork and copies the current code before opening its approved URL; expired
codes remain disabled.

Validation on Node 24.10.0, native runtime and isolated browser API port 63431:

- Focused History family: 68 interaction/accessibility cases passed. Two initial
  recovery-action failures belonged to API optional-state projection; the
  upstream source fix is qualified separately in Notes PR #118.
- Full standard eight-shard `pnpm test:storybook`: 392 passed, 57 existing skips,
  76 files, zero failures/errors. The earlier Kanban/Canvas failures and their
  exact repairs are recorded in the catalog keyboard receipt.
- `pnpm check` and `pnpm test`: 18 tasks each passed, zero failures. Check
  includes audit, package boundaries, App ownership and style audit.
- `pnpm build`: 17 tasks passed, including public packaging/publint.
- `pnpm packages:pack -- --already-built`: all public package archives packed;
  History SHA-256 is `c627e75b7e2386b02ec2cc4c6bf0228d5797163e6b8ceddae31d5a0c3986b596`.
- `pnpm test:release`: 227 passed, zero failed.
- `pnpm build-storybook`: passed with existing dependency/chunk warnings.
- `pnpm spec:check`: passed after mapping checkout-local API-port configuration
  to distribution; doctor and QMD discovery are source tooling evidence only.

The API consumer archive is the built public API 0.6.0 validation artifact,
SHA-256 `1912572d28ba92e402033c11ad33bcf1efb171d7c410f4539615229c7c932641`.
Its ignored pnpm hook does not change committed registry ranges or lockfiles.
The plugin archive builder refuses a dirty JJ source commit; archive reproduction
and verification follow this source checkpoint before push. Live native custody,
network transports, host registration and packaging remain separate work.
