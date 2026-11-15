# Lapis Sync future implementation plan

**Planned 14 November 2026; implementation authorized 15 November 2026.** Read the
[context and provenance](implementation-context.md) and [current Sync contract](index.md)
before resuming. This is the new Rust/Tauri delivery direction. The original
Deno records remain historical evidence, not a schedule to resume verbatim.
The [Desktop plan](https://github.com/lapismd/lapis-desktop/blob/main/spec/src/backlog/lapis-sync.md)
owns consumer admission and native acceptance.

## Completion and ownership

The first complete feature connects offline Desktop vaults to one configured
Lapis Server destination. Two enrolled devices exchange notes, attachments and
immutable revision ancestry with an enrolled, readable managed server vault.
Web sessions edit that server vault; server changes propagate even with no
browser open. Offline history, conflicts, restore and recovery survive restart.
Installation is optional and disabled by default after qualification.

| Owner                                      | Planned responsibilities                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins `packages/sync`                    | Protocol and provider contracts, retained TypeScript engine and shared fixtures, presentation runtime, destination client, settings/views/status and conformance |
| Plugins `crates/lapis-plugin-services`     | Pure Rust event/object codecs, authority, checkpoint/publication, ancestry/reconciliation, merge/apply planning and recovery state transitions                   |
| Notes API                                  | Public portable App-owned native Sync capability/observation boundary, scoped security/local-provider contracts, writer protection and cleanup                   |
| Server-owned `lapis-app-core` and protocol | Durable encrypted repositories, guarded filesystem operations, endpoint security orchestration, native participant/scheduler and bounded commands/observations   |
| Rust HTTP server                           | Account consent and scoped authorization, enrollment delivery, event/object destination APIs, hosted admission and continuous server participation               |
| Desktop                                    | OS wrapping/credential custody, profile/vault admission, Tauri command/event adapters, browser handoff, optional plugin intake and native acceptance             |

Pure plugin algorithms have no Tauri, HTTP, database, renderer or application
scheduler dependency. Host-owned storage and crypto ports supply effects;
private keys stay in custody. Shared services own durable work across view
detachment; views observe state and submit admitted actions. Standalone browser
TypeScript behavior retains its explicit implementation and qualification.

### Interfaces and invariants to carry forward

- Retain `SyncRuntime.snapshot/subscribe/execute/dispose`, its action model and
  explicit `SyncPluginOptions.createRuntime` injection. Add an optional native
  service via public App/session contracts. Explicit host selection determines
  availability; an unavailable selected native service cannot silently select
  another storage, custody or writer implementation.
- Keep bounded native inputs, stable request identities, captured vault/device/
  key-epoch/membership authority and confirmed or unknown outcomes. Recheck
  authority after waits; cancellation/late results cannot cross profile, vault,
  server, account or runtime replacement.
- Preserve protocol v3, revision payload schema 2, attestation schema 1, signed
  event IDs/envelopes, ciphertext hashes, archive/parent references and explicit
  legacy readers. Provider transport metadata remains outside signed records.
- Preserve exact filter semantics, replaceable ordering and independent device
  tips. Rust and TypeScript use frozen vectors and complete expected outcomes;
  current shortcuts or disabled tests do not define intended conformance.
- Keep XChaCha20-Poly1305 object encryption, HKDF purpose separation, random
  nonces and NIP-44 key/pairing envelopes compatible. Rust signing/crypto code
  invokes opaque custody; keys and bearer credentials never enter plugin data.
- Keep local encrypted objects/outbox durable before network work. Retries reuse
  ciphertext, event IDs and HEADs. Dependencies precede discoverable tips;
  staged upload, accepted history and applied working files are distinct states.
- Use one capture/apply inclusion policy: notes/attachments and explicitly
  allowed portable `.lapis` configuration; exclude secrets, indexes, caches,
  Sync stores and machine-specific state. Preserve logical vault identity
  separately from physical root, server-vault ID and destination binding.
- Protect/flush all admitted writers before capture/apply. Preserve conditional
  writes and durable idempotent receipts; unknown outcomes are inspected before
  retry. Recovery keeps stale/ambiguous work available for review.
- Acquire host-owned exclusive apply ownership across Lapis Sync and legacy
  Nostr Sync. Coordinate with Git restore/pull and other application mutations
  through the existing writer boundary; independent systems cannot overwrite
  pending drafts. Standalone History can coexist without gaining apply rights.

Before each protected implementation slice, update the owning API, Plugins,
Server and Desktop requirements/verification as applicable. This saved roadmap
adds no product requirement completion or runtime contract implementation.

## Ordered implementation stages

Stage 1 is complete and Stage 2 is in progress; later stages remain pending.
Each starts with the exact failing or unavailable
boundary and ends with its recorded regression, manual journey, source revision
and consumer evidence. Broader checks follow the workspace impact ladder.

### 1. Rebaseline retained TypeScript source and UI

Status: **complete in the isolated implementation stack.** The exact before and
after counts, native qualification and unqualified Docker/visual boundaries are
recorded in the 15 November source-rebaseline receipt.

Owner: Plugins; prerequisite: retained source/dependency and license inventory.
Use the existing engine export and real App-backed UI. Run each retained file
and story explicitly, record failures, repair in the owning package and remove
unfinished skips only after those scenarios execute successfully. Keep frozen
wire/object fixtures and known failure attempts intact.

Exit: meaningful complete engine and Sync interaction/axe results, including
settings/account lifecycle, six placements and Show Code. Manually review
history/compare/merge and unavailable operations without fabricated success.
This qualifies a source oracle; native services are still pending.

### 2. Implement Rust engine parity

Status: **in progress.** The shared protocol corpus, signed-event verification,
attestation readers, membership/cutoff authority, dependency validation and
ancestry reconciliation, stable publication retry and pure guarded-apply
recovery plus merge planning/materialization are implemented; the complete-history target remains open in the Stage 2
receipt.

Owner: Plugins native services; prerequisite: stage 1 oracle. Add pure codecs,
signature/envelope checks, crypto compatibility, membership/cutoff authority,
checkpoint/outbox, ingestion, ancestry and reconciliation. Include apply intent,
receipt-recovery and merge-planning transitions over explicit host ports.

Exact targets: frozen protocol/encryption vectors; complete TypeScript/Rust
outcomes for filters/ties, revoked ancestry, missing dependencies, retries,
prototype-shaped paths and interrupted apply. Inspect one fixture history
end-to-end. Exit: parity without UI/host imports; real native storage remains
unqualified. Never compare fresh randomized ciphertext as though deterministic.

### 3. Native storage, security custody and admission

Owners: shared core, Desktop and API; prerequisite: stage 2 ports. Implement
dedicated engine/apply/security stores with conditional transactions and guarded
filesystem receipts. Adapt the old Deno semantics to Rust rather than executing
or modifying the frozen host. Desktop binds opaque sessions to admitted physical
roots/profiles and supplies protected OS wrapping.

Exact targets: real disk CAS/reopen, encrypted receipt/journal migration,
authority races, stale roots, denied raw-key access, stream cancellation and
drained teardown. Manually restart separate native processes and recover the
same identity, exact signed outbox/object hashes and receipts. Missing keys or
corruption preserves explicit failure. Other platforms need their own evidence.

### 4. Account connection through current hosts

Owners: Rust HTTP server, Desktop, API and plugin adapter; prerequisite: stage 3
credential custody. Reintroduce host-mediated S256 browser consent, scoped
revocable account credentials and allowlisted connection/vault discovery through
the current server APIs. Adapt `NativeSyncAccount` to the selected public host
contract; stable client identity must not depend on a development renderer port.

Exact targets: consent replay/expiry, cancellation, denied/viewer access,
late grant revocation, destination changes and sign-out during discovery.
Manually sign in across origins, select a named vault, connect, cold restart,
restore and sign out across another restart. Exit: real Tauri window/server
account acceptance; connection success still grants no endpoint/content rights.

### 5. Endpoint and server enrollment

Owners: shared core/server custody, Desktop and plugin security UI;
prerequisite: stages 2–4. Implement authenticated expiring pairing delivery and
owner-authorized enrollment. Server and each local endpoint retain distinct
device keys; shared Sync Identity/epoch transfer uses existing encrypted host
capabilities without granting server owner/recovery authority automatically.

Exact targets: wrong/expired/replayed invitation, SAS, mixed sessions, locked
keys, membership authority and actual installed epochs. Manually enroll two
devices plus Server, compare identities and restart/unlock. An account with no
vault keys cannot read content. General destination APIs follow in stage 7.

### 6. Local checkpoint and retained history

Owners: native core/API, plugin presentation and Desktop intake; prerequisite:
stages 2–3 and local enrollment from stage 5. Connect the native owner to
`SyncRuntime`, real file identities, saved snapshots and History/Compare data.
Keep unavailable transfer actions explicit until the destination is ready.

Exact targets: pending editor flush or blocked checkpoint, edited-during-capture
generation, native crypto/state calls and snapshot-to-presentation. Manually
edit/checkpoint, inspect changed files/diff and reopen offline after cold restart.
Exit: local encrypted history, not remote synchronization.

### 7. Durable destination upload and download

Owners: Rust server/shared core and Plugins provider; prerequisite: stages 2–6.
Add authenticated vault-scoped event/object storage outside readable content
and disposable indexes. Store original events and ciphertext; stream bytes with
size/hash checks, retain membership history and immutable superseded records.
Persist staged validation, accepted arrivals and apply work distinctly.

Exact targets: objects-before-revision-before-HEAD, both signatures, enrolled
authority/dependencies, stable snapshot paging, arrival-sequence catch-up,
membership predecessors, duplicate/lost response and cross-vault rejection.
Manually upload A, restart Server, retry with unchanged IDs, then download and
compare on independently stored B without working-file writes. Live hints only
wake durable reconciliation; old timestamps cannot hide new arrivals.

### 8. First manual bidirectional working-vault round trip

Owners: shared core/server, Desktop/API and plugin adapter; prerequisite: stages
3, 5–7 and complete writer/exclusive-apply admission. Persist encrypted apply
intent before writes, verify generations and durable receipts, and mark applied
only after the whole plan settles. Capture outstanding server changes before
incoming apply; imported revisions never echo as server-authored changes.

Exact targets: real guarded create/update/delete, dirty/retired writer refusal,
lost mutation receipt and interrupted apply. Manually send A to server Web,
edit there, return to A, and repeat through B. Exit: manual convergence with
original ancestry; automatic scheduling is still pending.

### 9. Offline recovery and native automatic operation

Owners: shared core scheduling/server participant and Desktop admission;
prerequisite: stage 8. Select one native owner per logical vault, retain the
20-second quiet/five-minute maximum checkpoint-attempt policy, single-flight
execution and bounded retries. Disconnect/restart retains history and pending
work. Disposing views/settings cannot stop an admitted server participant.

Capture managed Web/API edits and external file changes with no browser open.
Watchers are hints backed by startup/periodic reconciliation. Recheck external
generations/partial writes; do not promise capture of every intermediate save.

Exact targets: missed/expired cursor, late arrival, reconnect gap, watcher loss,
origin suppression and disable/close cancellation. Manually edit both clients
and Server, including offline cold restarts and external server edits. Exit:
automatic convergence without duplicate owners or silent uncertain-write replay.

### 10. Conflicts, forward restore and security recovery

Owners: Plugins algorithms/UI plus core/API custody/apply and Desktop;
prerequisite: manual loop. Connect encrypted durable merge drafts and explicit
text/binary/delete/rename decisions. Preserve the retained single merge-base
restriction and sequential resolution of multiple tips. Revalidate base/tips and
file generations before accepting a merge; retain stale drafts for review.

Restore creates forward work/revisions without deleting intervening history.
Initial binding of populated unrelated roots previews both sides; an empty side
never implies deletion. Include revoked devices, epoch/Sync Identity rotation,
historical cutoff limits and owner-controlled encrypted recovery bundles.

Exact targets: stale decisions, edit/delete/rename/binary conflicts, restore
races, changed destination identity and revocation during commit. Manually
resolve divergence, restore an old note, rotate/revoke, then recover a fresh
endpoint. Lost keys never cause plaintext fallback or silent identity reset.

### 11. Full qualification and optional activation

Owners: every affected source and consumer; prerequisite: stages 1–10. Complete
the matrix below and each supported platform's real custody/Tauri acceptance.
Qualify shared source and public artifacts separately from installed consumers.

Only after qualification remove parked exclusions in a separately governed
activation slice, offer optional default-disabled installation and run Safe Mode,
disable/re-enable/update/uninstall and cold restoration. Public publication,
signed release assets/registry dispatch and installed-app replacement retain
their existing explicit approval gates. No Rust crate publication is assumed.

## Blocking acceptance matrix

| Scenario                                        | Required outcome / evidence boundary                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Offline edits, app/server restart               | Local history and outbox survive; reconnect converges through real processes                                                    |
| Lost response, duplicate upload/event           | Same ciphertext and immutable IDs; one accepted revision/arrival; inspect unknown outcome before replay                         |
| Two clients and server Web edit                 | Independent stores/keys, correct ancestry and real working-file convergence                                                     |
| External server edit, no browser                | Native capture/rescan publishes once; missed watcher event is recoverable                                                       |
| Dirty/retired/embedded/multi-window writer      | Protect/flush or explicit refusal; retained drafts and original persistence ownership                                           |
| Concurrent snapshot/apply/rename/delete         | Captured identities/generations reject stale writes and preserve both histories                                                 |
| Interrupted apply or corrupt/missing dependency | Durable recovery/review, no false applied marker, no silent overwrite                                                           |
| Wrong vault/profile, permission loss            | Scoped account, runtime, object/event and subscription authority; no cross-destination late result                              |
| Locked/revoked endpoint and rotations           | No next-epoch access/publication by revoked devices; retained old-key limitations stated                                        |
| Populated unrelated roots or empty side         | Explicit collision preview; partial/empty listing never infers deletion                                                         |
| Cursor expiry/index rebuild                     | Bounded durable reconciliation; encrypted history/outboxes and membership remain intact                                         |
| Large attachments                               | Streaming checkpoint/download/apply; retained 64 MiB in-flight target measured separately from synthetic 3 GiB fixture coverage |
| Merge and forward file/vault restore            | Reviewable text/binary/delete/rename choices, stale draft rejection and preserved history                                       |
| Disable/re-enable, reload, switch, close        | Bounded drain, cancelled-close retention, fenced late work and resumed durable owner                                            |
| Real UI                                         | Sync/History/File History/Compare/Merge/Settings/status; six command-pane placements, themes, narrow sizes, keyboard and axe    |
| Platforms and encrypted recovery                | Separate actual OS custody/restart evidence on every supported platform; bundle recovery independent of account reset           |

Run exact targets before the full affected suites, then owning check/test/build,
App-ownership/architecture/spec gates, cold interaction/axe/static catalog and
public pack/archive/signature acceptance where applicable. A memory adapter,
skipped suite, browser fixture or warm run cannot qualify native product gates.
Keep before/after counts; unexplained required failures block shared landing.
Visual review stays separate with `visual-pending`; no baseline updates here.

## Deferred work and resumption

Defer external Nostr/Blossom and S3 destinations, automatic legacy Nostr history/
credential migration, simultaneous destinations/backfill, live character
collaboration, general relay/NIP-77 services, selective sync, multi-process
server coordination and advanced history/receipt garbage collection. Retain
history conservatively until an offline-device retention policy is specified.

On resumption, inspect live Jujutsu state and all owning guides/specifications;
refresh source/artifact revisions and API dependency floors rather than using
historical versions as installation instructions. Use verified public archives
for private migration acceptance, portable npm ranges/registry lockfiles and
source-first fixes. Record source, artifacts, consumer and release results
separately and commit each verified owning-repository slice. The next authorized
feature task starts at stage 1; saving this document does not start it.
