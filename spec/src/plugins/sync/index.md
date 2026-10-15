# Lapis Sync

Lapis Sync starts with the headless Nostr-compatible protocol foundation.
The package remains private and parked until the Deno destination, endpoint
security and consumer acceptance are complete. The UI may be previewed in the
shared catalog while Sync remains excluded from installation and releases. The existing Nostr
Sync plugin keeps its identity and installation behavior.

## Requirements

Stage 0C consumes released API 0.1.4, Design Core 0.3.3 and Mira 0.0.5
through npm. Sync's API and Design Core floors cover its required public
contracts. The shared catalog provides UI review while production runtime
wiring remains pending; landing these sources does not enable synchronization.

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-SYNC-001 | `packages/sync` MUST reserve `@lapis-notes/lapis-plugin-sync` and runtime identity `sync`, use Apache-2.0, and remain private/parked during foundation and UI qualification. Private UI MAY appear in the shared development catalog. Reused source MUST retain its source inventory and attribution.                                                                                                                   |
| LN-SYNC-002 | The `./engine` export MUST be usable in Node and Deno without loading UI, DOM, Svelte, host application modules or ambient App state. Non-host runtime dependencies MUST be bundled.                                                                                                                                                                                                                                    |
| LN-SYNC-003 | Signed events, current device/root attestation envelopes, revision/HEAD payloads, versions, tags, event IDs and archive references MUST retain the existing Nostr Sync wire format. Legacy reads MUST remain explicit.                                                                                                                                                                                                  |
| LN-SYNC-004 | Event filters MUST support exact outer IDs/authors, kinds, first `d`, any `p`/`v`, inclusive `since`, AND across fields and OR across field values or filters. Empty arrays MUST match nothing. Unsupported fields MUST fail explicitly.                                                                                                                                                                                |
| LN-SYNC-005 | Replaceable events MUST compare newest timestamp first and lowest lexical event ID on ties, only within kind/outer-author/first-`d` addresses. Independent device HEADs MUST remain independent.                                                                                                                                                                                                                        |
| LN-SYNC-006 | Attestation readers MUST verify event IDs and both signatures, enforce matching kind/timestamp/tags, and reject malformed envelopes. Verification MUST use fresh event data rather than trust cached library verification flags.                                                                                                                                                                                        |
| LN-SYNC-007 | Revision and HEAD writers MUST encrypt through opaque endpoint crypto before device and transport signing. Plaintext fallback MUST NOT exist. Private keys MUST NOT enter runtime protocol modules.                                                                                                                                                                                                                     |
| LN-SYNC-008 | Encryption and membership authority MUST remain separate from transport signature verification. Deno MUST NOT expose accepted publication until enrolled-participant authority and dependency validation are implemented.                                                                                                                                                                                               |
| LN-SYNC-009 | The plugin MUST export `SyncPlugin`, public UI/runtime types, manifest metadata and `styles.css`. It MUST retain the independently bundled `./engine` export and runtime identity `sync`.                                                                                                                                                                                                                               |
| LN-SYNC-010 | The plugin MUST register command views `sync`, `sync-history` and `sync-file-history`, plus internal `sync-compare` and `sync-merge` views. Open commands MUST reveal existing instances wherever placed. Devices MUST remain in declarative settings.                                                                                                                                                                  |
| LN-SYNC-011 | Sync MUST retain the compact status badge and icon-only checkpoint/sync toolbar, inset pending-file listing and merge-required action. Busy or unavailable operations MUST be disabled; empty disconnected or error states MUST NOT claim successful sync.                                                                                                                                                              |
| LN-SYNC-012 | History MUST retain the lane-based revision DAG, device tips and Column Canvas. Revision selection MUST expand its inline changes; selecting it again MUST collapse changes and comparison. File History MUST filter changes and reconnect retained ancestors.                                                                                                                                                          |
| LN-SYNC-013 | Comparison MUST use public Design Core FileDiff with unified/split and wrap controls. History comparison MUST use one wrapping header row with title, action controls, then diff counts and Close, spaced with justify-between without a second action row before the diff. Restore MUST invoke the active runtime, surface failure and produce pending local work. Binary changes MUST NOT be presented as empty text. |
| LN-SYNC-014 | Merge MUST use public Design Core MergeEditor and runtime-owned drafts. Explicit local/remote/base/delete/keep-both or resolved-text choices MUST invoke runtime actions. Publish MUST stay disabled until every conflict is resolved; stale drafts and failures MUST remain reviewable.                                                                                                                                |
| LN-SYNC-015 | Status MUST register through the owning App, show a green icon when synced, and open a keyboard-dismissable, focus-managed popover using application theme tokens, compact typography, Lapis Server health and copyable revision identifiers. Subscriptions, views, status items, settings and popover MUST be disposed on plugin unload.                                                                               |
| LN-SYNC-016 | Settings MUST use one declarative controlled source with Sync services, This device, Active devices, Pair a device and Recovery groups. Persist only versioned provider configuration and enablement; keys, decrypted snapshots, pairing state and recovery files MUST NOT enter plugin data.                                                                                                                           |
| LN-SYNC-017 | Lapis Server MUST be the first destination choice, with HTTPS URL and managed-vault ID. Encryption MUST be shown as mandatory without a toggle. Account authorization and enrollment MUST remain distinct; unavailable, locked or unenrolled runtimes MUST fail closed for sync and content mutations.                                                                                                                  |
| LN-SYNC-018 | Pairing, membership and recovery UI MUST delegate to the host/runtime. Owner actions MUST respect authority; revocation MUST retain the pre-revocation access warning. QR, paste, camera, SAS and recovery-preview controls MUST retain their current presentation without accepting private-key text.                                                                                                                  |
| LN-SYNC-019 | UI MUST receive App explicitly and use public host/Design Core contracts. Production defaults MUST contain no demo history or simulated connection success. An explicitly injected runtime MAY supply a host integration; Storybook fixtures MUST remain outside npm artifacts.                                                                                                                                         |
| LN-SYNC-020 | The shared Storybook MUST cover each command view in six real WorkspaceShell placements, shell Desktop/Mobile, settings states, compare/merge and disconnected/dirty/busy/offline/error/conflicted/restored states. Plays MUST verify meaningful actions and accessibility. New stories MUST remain visual-pending without baseline approval.                                                                           |
| LN-SYNC-021 | Recoverable runtime failures MUST be published through the owning App Problems collection and cleared after recovery.                                                                                                                                                                                                                                                                                                   |
| LN-SYNC-022 | Private Sync UI MUST provide a fixed banner and up to five gallery cards under Plugins/Sync/Registry Screenshots. registry.json MUST declare fixed story IDs and light/dark image variants. Default and explicit Sync capture/check selection MUST include these previews without admitting Sync to activation, metadata dispatch, packaging or release selection. Capture/check MUST NOT approve visual baselines.     |

## Durable local runtime

| ID          | Requirement                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-SYNC-023 | Checkpoints MUST persist encrypted objects, signed revisions and an encrypted outbox locally before provider calls. Offline history MUST survive restart without relying on disposable search indexes.                   |
| LN-SYNC-024 | Retry MUST reuse persisted ciphertext, event IDs and HEADs. All objects and the revision MUST be durably accepted before publishing its HEAD; staged publication MUST remain pending.                                    |
| LN-SYNC-025 | Local state MUST use authenticated, purpose-separated encryption bound to the logical vault and device. Durable state updates MUST compare versions and reject competing writers without overwriting history.            |
| LN-SYNC-026 | Snapshot creation MUST use stable file identities and verify file generations before committing. Ambiguous content equality MUST NOT invent rename identity.                                                             |
| LN-SYNC-027 | Object graph readers MUST verify ciphertext hashes, authenticated decryption, manifest sizes and path safety before use. Streaming MUST preserve the existing chunk format and bounded memory target.                    |
| LN-SYNC-028 | Local state and encrypted objects MUST remain available when publication fails. Locked, unenrolled or revoked endpoints MUST fail closed before checkpoint or publication.                                               |
| LN-SYNC-029 | Reconciliation MUST preserve independent participant tips and resolve divergence through ancestry and explicit merge decisions. Persisted merge decisions MUST remain encrypted and stale generations MUST reject apply. |
| LN-SYNC-030 | Encrypted file/tree manifests and chunk formats MUST remain compatible with Nostr Sync. Frozen objects emitted by the original source MUST materialize to their original bytes and stable file identities.               |

## Incoming history and recoverable apply

| ID          | Requirement                                                                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-SYNC-031 | Incoming HEADs and archived ancestors MUST verify both signatures, vault scope, supported payloads and authenticated ciphertext. An explicit endpoint membership policy MUST authorize incoming records; transport signatures alone MUST NOT grant authority.                   |
| LN-SYNC-032 | Incoming objects and ancestry MUST be locally durable before a discovered tip is persisted. Missing, corrupt or cyclic dependencies MUST preserve the prior accepted state. Traversal MUST be bounded.                                                                          |
| LN-SYNC-033 | Discovery MUST retain independent device tips and use ancestry for fast-forward or conflict planning. Older same-address HEADs MUST NOT regress accepted tips. Uncheckpointed local files and unrelated histories MUST require explicit reconciliation.                         |
| LN-SYNC-034 | Apply MUST persist an encrypted intent before any working-file mutation and record each operation's progress. Host mutations MUST use captured identity/generation guards and durable idempotent receipts. Applied state MUST advance only after the complete plan is verified. |
| LN-SYNC-035 | Restart MUST resume pending apply work without duplicating completed mutations. Edits after planning or after an unrecorded mutation MUST remain intact; ambiguous or stale recovery MUST stop with the intent available for review.                                            |
| LN-SYNC-036 | Apply MUST preserve protocol file identity, avoid excluded configuration paths and stream file content from authenticated local objects. Checkpoint/publication MUST NOT capture a partially applied vault.                                                                     |

## Enrolled history authority

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-SYNC-037 | History authority MUST use an owner-authorized membership snapshot supplied by the enrolled host for the expected vault and owner. Missing membership, unknown devices, future generations and unavailable key epochs MUST fail closed.                                                                                                                                                                 |
| LN-SYNC-038 | Revoked-device revisions MUST require ancestry at or before their owner-approved cutoff; revoked-device HEADs MUST NOT become current tips. Retired Sync Identities MUST require their authorized generation interval and device cutoff ancestry. Legacy records MUST require their explicit activation cutoff after a Sync Identity exists.                                                            |
| LN-SYNC-039 | Incoming records MUST remain unaccepted until authenticated ancestry is available for membership cutoff proofs. A valid shared outer signature MUST NOT authorize a missing or revoked device attestation. Cached history MUST be rechecked under current membership when used for planning or apply.                                                                                                   |
| LN-SYNC-040 | Checkpoint and incoming acceptance MUST reject a changed membership generation or key epoch between planning and durable commit. Rejection MUST preserve prior history, queued publication and working files.                                                                                                                                                                                           |
| LN-SYNC-041 | State commits, guarded mutations and receipt recovery MUST forward the operation's captured vault, device, key epoch and membership generation to the host. Asynchronous admission MUST NOT upgrade that authority. Apply progress commits MUST retain the same captured authority as their mutation/recovery operation. These fences MUST remain outside signed events and encrypted protocol objects. |

## Delivery status

The foundation implements protocol codecs, event filtering and replaceable
ordering. UI qualification adds the plugin class, views, status and settings against an
explicit runtime interface. The headless engine now adds encrypted local checkpoints,
object graphs and a version-guarded persistent publication queue. Incoming history,
ancestry planning and recoverable guarded fast-forward are qualified against an
explicit authority policy and fixture host. Production membership and filesystem
integration, merge/restore and automatic scheduling remain pending. The reusable
history-authority policy now implements enrolled membership, revocation and
Sync Identity cutoff rules; a packed-engine check uses actual host membership
and identity rotation. Production capability wiring remains pending.
The owning host also qualifies a guarded native filesystem kernel with durable
receipts and real paired-device/packed-engine acceptance in Node and Deno.
Completed native receipts are independently encrypted and indexed outside its
active journal. Pairing rendezvous and production runtime guards remain
required before activating that kernel. The owning API now
qualifies explicit host-delivery pairing, actual installed-epoch reporting and
a public headless security export in Node and Deno.
It also qualifies a dedicated wrapped-key SQLite store and headless metadata
contract, with independent Node/Deno process readback. Existing credentials are
not automatically migrated.
The API also qualifies per-plugin host security delegation with scoped grant
checks and awaited revocation, including unload failures. Desktop now selects
native security custody for `sync`, bound to admitted profile/runtime sessions.
It qualifies dedicated key storage, protected OS wrapping, JSON crypto RPC and
drained teardown, including a real macOS Keychain restart and cold packaged app.
Legacy Nostr custody stays in its existing location. The API now qualifies
optional scoped local file/storage capabilities and a native adapter over the
guarded kernel, with separate engine/apply stores, explicit inclusion and
drained stream ownership. Packed paired-engine acceptance passes through the
adapter and direct kernel in Node and frozen Deno. Desktop data RPC now shares
the admitted security session and checks captured operation authority. The
packed engine's exact encrypted offline history survives an actual Deno JSON/
Keychain restart. Actual editor/exclusive-writer guards, server key lifecycle
and network pairing delivery remain required before production runtime activation.
The native kernel durably upgrades supported legacy roots to indexed journal
format 2 before access; actual earlier kernels reject that format in Node and
Deno acceptance. This does not activate application or server synchronization.
The production default is disconnected; it has no
simulated history or success path. Deno event/object storage, enrollment and
server capture/apply remain subsequent slices in the saved implementation plan.

The owning API also qualifies registered/protected asynchronous document loads
and managed file/folder rename admission through public editing sessions.
Original drafts persist before switching or movement; stale/canceled/failed reads
cannot replace another document. Workspace navigation, complete rename rebinding,
Mira/domain writers and App shutdown remain required before production guard
selection. This host milestone does not connect the Sync UI or activate apply.
