# Sync connection follow-up: named managed vaults

15 October 2026. This extends feature slice 1 for review; endpoint enrollment
and every content operation remain deferred.

## Delivered

- Sync Settings reads the configured server's existing authenticated
  `vault.list` query and displays active vault names in a dropdown.
- The selected name remains visible when closed. Reopening Settings or reloading
  the private app resolves the saved UUID to its current server-provided name.
- Only the UUID is persisted. Discovery never selects a vault or grants content
  authority. Viewer-only options are visibly unavailable; the source rejects
  viewer and unlisted choices even if invoked directly.
- Refresh uses a transparent ghost button and the public Settings control-height
  token. Live measurements give equal heights of approximately 30px and a
  transparent idle background.
- The existing shared CopyableValue shows a shortened UUID, copies the complete
  value, and provides its normal success/failure feedback.
- Loading, empty results, sign-in failure and retry are visible. URL changes,
  Settings close and plugin disposal cancel requests and reject late results.
- The ordinary Notes server chooser separately gains Copy vault ID in each
  vault action menu, including archived/viewer rows. That source change and its
  evidence are committed in Notes, not in this repository.

No shared API, server route, encryption protocol, dependency range, release or
visual baseline changed. Account authentication still uses the existing
HTTP-only Deno session through the development host's loopback proxy.

## Focused evidence

The initial discovery target had **2 failures and 9 passes** because the runtime
had no vault-list method. The focused adapter and Settings-source targets now
pass **14 tests**. They cover authenticated active-vault queries, invalid replies,
viewer restrictions, selected-ID persistence, stale results, cancellation,
empty lists, failure and retry.

- Sync package units: **198 passed**, 16 files.
- Sync Storybook: **54 passed**, 8 directly affected files, including interaction
  and accessibility assertions. The picker scenario checks the closed name,
  viewer rejection, complete copied UUID, and equal control geometry. A second
  scenario exercises sign-in failure, visible loading and empty success on retry.
- Sync `check`, `build`, `publint` and private-host check pass with no type or
  Svelte errors/warnings.
- Specification/App-ownership and dependency audit pass. Existing documented
  audit exceptions are unchanged.
- A fresh Vite process and built plugin at `http://localhost:6080/` load the real
  managed vault named Sync connection review from Deno at port 8797. Named
  selection, closed label, truncated UUID, copy success feedback and matching
  transparent refresh geometry were reviewed in the browser.

Screenshots: `/tmp/lapis-sync-managed-vault-picker.png` and
`/tmp/lapis-sync-managed-vault-options.png`. Diagnostic logs use
`/tmp/sync-vault-picker-*.log`. Both running review processes and ordinary
persistent note data are retained. The review fixture account is signed in.

The full catalog, container/platform matrix and release archive/signature lanes
remain deferred under the agreed incremental plan. No Sync publication or
activation occurred. Stop for review before endpoint enrollment.
