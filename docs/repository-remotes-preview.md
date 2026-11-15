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

All 41 examples carry `visual-pending`. Each shows the full WorkspaceShell with
the repository status bar, without a description banner or a remote toolbar
above History. All actions use memory services. No visual baselines are created
or approved by this work.

## State inventory

| Story                                     | Review surface                                                       |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Desktop / Server                          | Separate backup/original settings, credentials and host custody copy |
| Dark / Narrow / Server Narrow Dark        | Theme, pane width, scrolling and dialog layout                       |
| Disconnected                              | Empty connections; save without transfer; anonymous HTTPS            |
| Public HTTPS / Read Only                  | Fetch available, push unavailable                                    |
| Missing Credentials                       | Retained connection with reconnect guidance                          |
| Locked Server Store                       | Encrypted custody unavailable; credential writes disabled            |
| SSH Unavailable / SSH Connected           | Host identity availability and connection; no private-key upload     |
| Fetching                                  | Busy action controls; last fetched observation remains visible       |
| Push Review                               | Exact remote, branch, bookmark, full commit and outgoing count       |
| Locked Review Cannot Publish              | Retained review loses Push authority when storage locks; Cancel works |
| Rejected Push                             | Failure toast; no claim that publication succeeded                   |
| Unknown Push / Observe Does Not Republish | Retained request and explicit observation/stop                       |
| Device Sign In / Expired Device Sign In   | Device code, cancellation, expiry and restart                        |
| Save Is Not Transfer                      | Save only; backup connection and auto-sync remain unchanged          |
| Automatic Sync Requires Opt In            | New backup connections retain manual transfer mode                   |
| Unknown Push Keeps Connection             | Uncertain publication prevents connection changes                    |
| Sign In Completes                         | Scoped account completion without transferring vault data            |
| Manual Fetch And Push                     | Explicit test/fetch, then review before publication                  |
| Save Credential / Forget Credential       | Secret-free inventory and scoped missing-credential state            |
| Keyboard Credential Dialog                | Keyboard activation, Escape, restored focus and cleared token        |
| History Entry / History Needs Connection  | Existing footer icons, target labels and Manage remotes entry        |
| Footer Fetch And Push / Footer Summary    | Split control, inline expansion/collapse, stats and reviewed push    |
| Narrow Footer                             | Split Git entry remains focusable; dismissal restores focus          |
| Existing Status Controls                  | Original controller-based fetch/pull/push popover remains functional |

The review uses the package's real RepositoryPanel and RepositoryOperations
inside WorkspaceShell. Both log headers omit their dropdowns and show the same
circular Fetch/Push controls when their displayed target has a remote. Multiple
operation heads remain selectable from the empty log body.

The existing working-copy status widget supplies the Git icon and details
popover. Its header places Fetch, Push and Settings on the right. The footer is one split control: Git opens details; double-right chevrons expand
Saved locally, diff stats and available counts/actions, and opposite chevrons
collapse them. It starts collapsed and offers no backup/original chooser.
Registration uses the public status API with a single center contribution. Connection
Settings keeps the two independently scoped connections.

Settings and status/log actions share RepositoryUpstreamActions. There is one
incoming Fetch action, following native JJ tracked-bookmark reconciliation, and
one reviewed Push action. The old controller-based sync path remains covered
separately. The GitHub sign-in dialog uses the existing GitHub artwork and a
Copy code and open GitHub button; expired codes cannot be handed off. Catalog
clipboard/browser effects are memory records, with no real authentication.

Additional state inventory:

| Story                                                         | Review surface                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| Log Remote Actions / Log Needs Connection                     | Connected and disconnected JJ Log headers                   |
| Operation Log Remote Actions / Operation Log Needs Connection | Same header behavior in Op Log                              |
| Copy Code And Open Git Hub / Expired Code Cannot Open Git Hub | Current-code handoff and expired-code guard                 |
| Backup Settings Fetch                                         | Independent backup fetch through matching Settings controls |

The existing repository-panel family additionally covers both multiple-head
recovery paths. Application service adoption remains a later slice.

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
- Fetch is the single incoming JJ operation. A separate Git-style pull is not
  presented. Live bookmark, conflict and working-copy behavior needs native proof.
- Native operations and shared orchestration belong to jj-store and
  lapis-app-core, with admitted Tauri/HTTP adapters and generated protocol DTOs.
- Unknown pushes retain exact request identities; observation never republishes.

The user has approved this UI for subsequent host adoption. Live native custody,
network transport, server encryption, consumer acceptance and release are not
qualified by these fixtures.
