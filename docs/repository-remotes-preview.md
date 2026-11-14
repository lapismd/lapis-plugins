# Repository remotes and credentials preview

This is slice 1: shared production components mounted by memory-backed catalog
adapters. Desktop and Server do not register these screens yet. The catalog
never tests a real connection, fetches, pushes or saves a real credential.

## Review

Run `pnpm storybook -- --port 6017 --host 127.0.0.1` from this workspace, then open:

- [Desktop settings](http://127.0.0.1:6017/?path=/story/plugins-history-repository-remotes-and-credentials--desktop)
- [Server settings](http://127.0.0.1:6017/?path=/story/plugins-history-repository-remotes-and-credentials--server)
- [History entry](http://127.0.0.1:6017/?path=/story/plugins-history-repository-remotes-and-credentials--history-entry)
- [Narrow dark Server](http://127.0.0.1:6017/?path=/story/plugins-history-repository-remotes-and-credentials--server-narrow-dark)

All 33 examples carry `visual-pending`. Each shows the full WorkspaceShell with
the repository status bar, without a description banner or a remote toolbar
above History. All actions use memory services. No visual baselines are created
or approved by this work.

## State inventory

| Story                                      | Review surface                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- |
| Desktop / Server                           | Separate backup/original settings, credentials and host custody copy |
| Dark / Narrow / Server Narrow Dark         | Theme, pane width, scrolling and dialog layout                       |
| Disconnected                               | Empty connections; save without transfer; anonymous HTTPS            |
| Public HTTPS / Read Only                   | Fetch available, push unavailable                                    |
| Missing Credentials                        | Retained connection with reconnect guidance                          |
| Locked Server Store                        | Encrypted custody unavailable; credential writes disabled            |
| SSH Unavailable / SSH Connected            | Host identity availability and connection; no private-key upload     |
| Fetching                                   | Busy action controls; current files and history pin preserved        |
| Push Review                                | Exact remote, branch, bookmark, full commit and outgoing count       |
| Rejected Push                              | Failure toast; no claim that publication succeeded                   |
| Unknown Push / Observe Does Not Republish  | Retained request and explicit observation/stop                       |
| Device Sign In / Expired Device Sign In    | Device code, cancellation, expiry and restart                        |
| Save Is Not Transfer                       | Save only; backup connection and auto-sync remain unchanged          |
| Automatic Sync Requires Opt In             | New backup connections retain manual transfer mode                   |
| Unknown Push Keeps Connection              | Uncertain publication prevents connection changes                    |
| Sign In Completes                          | Scoped account completion without transferring vault data            |
| Manual Fetch And Push                      | Explicit test/fetch, then review before publication                  |
| Save Credential / Forget Credential        | Secret-free inventory and scoped missing-credential state            |
| Keyboard Credential Dialog                 | Keyboard activation, Escape, restored focus and cleared token        |
| History Entry / History Needs Connection   | Existing footer icons, target labels and Manage remotes entry        |
| Footer Fetch And Push / Footer Backup Pull | Target-isolated footer actions and reviewed publication              |
| Narrow Footer                              | Existing status overflow menu retains repository actions             |
| Existing Status Controls                   | Original controller-based fetch/pull/push popover remains functional |

The review presentation uses the package's real RepositoryPanel inside the
WorkspaceShell. Its existing RepositoryWorkingCopyStatus, RepositoryBackupStatus
and RepositoryUpstreamActions components supply the footer actions through the
public status-bar registration API. The same fetch/pull/push icons gain target
labels, last-fetched counts and a Manage remotes entry. Original pull remains
unavailable. Narrow layouts use the shell's existing status overflow menus.
Settings retains fetch/push controls in both target sections and uses the real
Settings surface with a catalog-only section registration. The optional remote
binding is not adopted by either application; existing controller behavior is
covered separately.

## Decisions retained for subsequent slices

- Managed backup and existing Git-backed JJ originals are separate targets.
- Save never transfers. Test connection, fetch and reviewed push are explicit.
- Original fetch/push stays manual and publishes one committed bookmark.
- Automatic backup synchronization requires a separate opt-in.
- Desktop tokens use OS custody. Server tokens require authenticated encrypted
  storage protected by a separate operator-mounted 32-byte key.
- SSH uses identities/agents configured on the executing host, preserving
  host-key verification. Private-key upload and generation are deferred.
- Stored secrets never return through inventory. Replace and forget operate on
  opaque host-owned references. Browser token drafts clear on submit/close.
- Native operations and shared orchestration belong to jj-store and
  lapis-app-core, with admitted Tauri/HTTP adapters and generated protocol DTOs.
- Unknown pushes retain exact request identities; observation never republishes.

Review this UI before proceeding with host adoption. Live native custody,
network transport, server encryption, consumer acceptance and release are not
qualified by these fixtures.
