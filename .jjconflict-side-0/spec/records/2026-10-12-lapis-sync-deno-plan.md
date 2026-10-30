# Lapis Sync implementation plan

Status: proposed implementation plan, updated 13 October 2026. This record
plans work; it does not register a plugin, change runtime behavior, or authorize
a release.

Build **Lapis Sync** in this repository, with **Lapis Server** as its first
destination provider, implemented by the Deno server. Preserve the change,
history, comparison, merge, and status experience from `lapis-plugin-nostr-sync`.
Local devices and the server each retain an editable vault and synchronize
through the existing Nostr sync protocol and reconciliation rules. Deno acts
as a minimal sync relay and encrypted object destination through its existing
authenticated APIs. No external relay or Blossom service is required.
End-to-end encryption is mandatory for every provider, with Deno explicitly
enrolled as an authorized endpoint. External Nostr/Blossom and S3 providers
follow later.

## Product decisions

| Decision                 | Planned choice                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Display name             | Lapis Sync                                                                                |
| Package                  | `@lapis-notes/lapis-plugin-sync`                                                          |
| Repository and directory | `lapis-plugins`, `packages/sync`                                                          |
| Runtime identity         | New plugin ID `sync`; retain existing `nostr-sync` identity                               |
| First provider           | Provider ID `lapis-server`, displayed as Lapis Server                                     |
| Protocol                 | Existing signed Nostr events, attestation envelopes, encrypted objects and query filters  |
| Deno transport           | Existing authenticated API and tracked subscriptions; no Nostr WebSocket endpoint in v1   |
| Signing identities       | Independent device keys plus the existing shared vault Sync Identity for outer signatures |
| First server mode        | Trusted participant with a readable managed vault                                         |
| Encryption               | Mandatory end-to-end encryption; Deno is explicitly enrolled as an authorized endpoint    |
| First topology           | One configured destination per local vault; multiple devices may connect                  |
| Installation             | Optional plugin, disabled by default; host owns installation and profiles                 |
| UI foundation            | Existing Nostr Sync composition and interactions, using public Design Core exports        |
| History model            | Immutable snapshots and revision ancestry, device tips, three-way reconciliation          |
| Later providers          | Nostr with Blossom, then S3-compatible object storage                                     |

The server trust mode, authenticated Deno API and current shared outer identity
are confirmed choices. Deno is an authorized endpoint that can decrypt and edit
the vault. End-to-end encryption has no plaintext mode or
automatic downgrade. The first implementation uses one destination per vault.
Adding Lapis Sync does not rename, overwrite, or silently migrate Nostr Sync.
Registry namespace availability and view/command
collisions are checked before scaffolding.

## Scope and completion criteria

A desktop device can connect a local vault to a managed Deno vault, edit while
offline, reconnect, and exchange changes in both directions. A server-mode Web
session edits the server vault through its existing host. Those edits propagate
to local devices even if no other Web session remains open. A second local
device sees the same history and can resolve divergent changes through the
existing merge experience.

The first release covers notes and attachments, create/modify/delete/rename,
manual and automatic checkpoints, history and restore, device enrollment,
connection health, retries, restart recovery, and explicit conflicts. Define a
shared inclusion policy for vault configuration; exclude credentials, generated
indexes, caches, sync storage, and machine-specific state. Do not assume every
file under `.obsidian` is portable or safe to synchronize.

The release is complete only after native desktop and server-mode Web
acceptance against a real Deno server, including cold restart and offline
reconnection. A locally backed Web vault is an additional supported host only
after its persistent-storage and authentication acceptance passes. The existing
server-mode Web client remains an online client of the server vault.

## Existing foundations and gaps

The Nostr Sync package supplies the journal, incremental object graph, stable
file bindings, revision DAG, merge/recovery models, history UI, and autosave
policy. Its Nostr event formats, cryptographic design, identity, enrollment and
signing concepts remain the shared protocol. Extract the destination adapter
boundary without replacing the revision format or event identity. Compatibility
fixtures must cover the existing signed records and encrypted objects.

The Deno server supplies managed vaults, account roles, serialized managed
mutations, conditional replacement with ETags, direct byte routes, and tracked
event subscriptions. Its current event replay is bounded and in memory. It
does not yet provide a durable sync repository or a continuously operating sync
participant. Existing online file access is useful infrastructure, but does not
establish offline convergence or crash-safe multi-file application.

## Ownership and package boundaries

| Owner                                     | Planned responsibilities                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lapis-plugins/packages/sync`             | Plugin lifecycle, sync engine, existing Nostr revision/object codecs, provider contract, Deno client provider, history/merge UI, settings and plugin stories |
| Plugin `./engine` export                  | Headless engine and public types usable by a server; no Svelte, DOM, ambient App, or UI imports                                                              |
| `lapis-notes/packages/api`                | Generic file identity, guarded I/O, origin, durable sync-storage and secret capabilities; public protocol contracts where host-owned                         |
| `lapis-notes/packages/server-deno`        | Authenticated sync routes, vault authorization, durable server storage, server participant, managed-file integration and lifecycle                           |
| `lapis-notes/packages/deno-host-services` | Reusable Deno filesystem/watch primitives where needed                                                                                                       |
| `lapis-notes` desktop/Web hosts           | Credential custody, enrollment integration, installation and consumer acceptance                                                                             |
| `design-core`                             | Generic UI defects or missing public primitives discovered during reuse                                                                                      |
| `lapis-plugin-nostr-sync`                 | Existing provider behavior and compatibility until a separately planned migration                                                                            |

Start with one plugin package and a deliberately headless subpath export. Prove
that the server can import that export without executing plugin/UI modules. A
separate engine package is justified only if packaging or independent consumers
require it; avoid a new public package solely to organize source directories.

Dependencies cross repositories through published semver packages. Use a
documented temporary packed consumer for development qualification. Missing
host facilities are implemented upstream and consumed through public contracts.
Do not copy host persistence into the plugin or conceal gaps with wrappers.

The user requested Apache-2.0 for Nostr Sync and the new Lapis Sync package.
Source commit `665cf7f4` corrects the owning Nostr Sync package declaration and
adds complete Apache license text before extraction. Lapis Sync retains
Apache-2.0, the source inventory and required attribution in `NOTICE.md`, and
third-party license notices in bundled output. This resolves the previous
source-transfer licensing prerequisite.

## Common synchronization model

Each synchronized vault has a stable logical sync ID, distinct from its local
path, server vault ID, provider instance ID, and endpoint URL. Persist explicit
bindings between those identities. Files retain protocol IDs across renames;
each host maps those IDs to its local stable file identities.

Preserve the existing `SignedNostrEvent` fields: `id`, `pubkey`, `created_at`,
`kind`, `tags`, `content` and `sig`. Keep the current canonical encoding,
signatures, event IDs, encrypted revision/HEAD payloads and object formats.
Revision parents retain their `eventId` and `archiveHash`; HEADs retain their
revision event ID and archive hash. Do not introduce a separate logical revision
ID or rewrite events for a destination. Providers store and return original
signed records without reconstructing or re-signing them.

Current revisions and HEADs contain a device-signed event inside the
`lapis-sync-device-attestation` envelope, signed externally by the vault Sync
Identity. Membership uses the corresponding `lapis-sync-root-attestation`
envelope with an owner-signed inner event. Preserve envelope schema 1, revision
payload schema 2 and protocol version 3. Keep existing legacy readers, including
direct device-authored events, within their existing authority/cutoff rules.

Preserve independent participant tips. Reconciliation removes ancestor tips,
fast-forwards when safe, and merges incomparable histories from their common
ancestor. Never choose a file winner by wall-clock time. Carry deletions in
history and preserve rename identity. Ambiguous external filesystem renames
must remain explicit uncertainty rather than invented identity matches.

The first merge behavior matches the source package: deterministic file-level
resolutions, explicit text/binary/delete-edit/rename conflicts, persisted manual
decisions, and generation checks before completion. Do not promise automatic
line merging beyond the verified source behavior. Keep the single merge-base
restriction and sequential resolution of more than two tips explicit.

Local checkpoint creation is independent of network availability. Flush editor
state, encrypt and persist all referenced objects and the signed revision
locally, then enqueue publication. Retries reuse the persisted encrypted records
and immutable IDs rather than encrypting them again. The outbox survives
process termination. Retain the 20-second quiet period and five-minute maximum
checkpoint attempt, with single-flight execution and bounded retry. Offline
operation must still produce local history.

The engine distinguishes local durability, remote staging, validated acceptance,
server working-copy application, and pending conflicts. A successful upload
does not imply the server has finished applying the revision, and a local
checkpoint does not imply remote replication. Reflect these distinctions in
existing status surfaces.

## Provider contract

| Capability            | Required behavior                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Describe connection   | Protocol version, remote identity, authorization and supported capabilities                       |
| Store/read objects    | Immutable content-addressed bytes, integrity checks, bounded streaming and idempotent retry       |
| Publish/read events   | Original signed Nostr records with stable event IDs, attestation envelopes and ancestry retrieval |
| Publish/discover tips | Authenticated participant records; prevent accepted tip regression or silent lost updates         |
| Query events          | Existing Nostr filters with bounded paging outside signed records and filters                     |
| Reconcile             | Bounded discovery with an explicit reset/snapshot fallback                                        |
| Notify                | Optional live hints; polling and durable reconciliation remain sufficient                         |
| Report status         | Authentication, authorization, connectivity, quota and recoverable failures with stable meanings  |
| Dispose               | Cancel requests and release subscriptions without losing pending work                             |

Start from the current `RevisionTransport` and `BlobStore` capabilities. Keep
the shared protocol Nostr-specific; it owns event kinds, tags, envelopes and
cryptographic validation. Destination adapters own HTTP, subscriptions and
storage details. Keep S3 paths and Deno/tRPC types outside the shared engine.
Add bounded paging, resumable discovery, membership-history retrieval and
staged/accepted/applied status through adapter request/response metadata,
without modifying signed records. Advertise actual capabilities rather than
claiming general relay or unsupported NIP compliance.

Encryption is mandatory at the shared engine/host boundary before provider
calls. Provider object and revision operations carry authenticated encrypted
records; encryption, decryption, signing, enrollment, rotation and recovery
remain public host capabilities. Providers never receive raw private keys.
Do not require every provider to offer a server-side atomic transaction across
objects, revisions and tips. Preserve safety through immutable staging and
publishing a discoverable tip only after its dependencies are durable.

Event IDs and ciphertext hashes provide publication idempotency. Deno guards
accepted tip and merge updates; request preconditions live outside signed
events. Future providers must prove equivalent convergence and replay behavior
through a shared conformance suite. Provider registration is explicit
application/plugin wiring for this release, without dynamically loading
arbitrary provider code.

### Supported events and filters

| Kind    | Purpose                     | Deno behavior                                                                    |
| ------- | --------------------------- | -------------------------------------------------------------------------------- |
| `78`    | Immutable revisions         | Persist and retrieve by event ID and vault filters                               |
| `30078` | Per-device HEADs            | Maintain current replaceable records and retain historical events                |
| `30079` | Owner-authorized membership | Maintain current membership and its historical chain                             |
| `24134` | Pairing messages            | Temporary session-scoped delivery with expiration, excluded from durable history |

Preserve `lapis-sync-v1:<vaultId>` scope tags, current per-device HEAD `d`
addresses, the common HEAD `v` tag, membership addresses and pairing session
tags. Discover HEADs through the union of current `#v` and legacy `#d` queries.
File-index tags remain disabled by default.

Keep `NostrEventFilter` unchanged for v1: `ids`, `authors`, `kinds`, `#d`, `#p`,
`#v` and inclusive `since`. Fields combine with AND, values within a field with
OR, and multiple filters with OR; deduplicate the union by event ID. IDs and
authors match exactly, without prefix expansion. Match the first `d` tag and
any matching `p` or `v` tag. An explicitly empty value list matches nothing.
`ids` and `authors` refer to the outer event; inner device identity determines
authority. A query filter never expands the authenticated vault scope.

Paging and resume cursors belong to the Deno request/response envelope, outside
the filter and signed event. Unsupported filters fail explicitly. Full-text
search, arbitrary tag queries, additional time bounds and general relay
extensions are outside v1. Reconciliation uses bounded ordinary queries and
does not advertise or report NIP-77 negentropy support.

Use one replaceable-event comparator in extracted readers and adapters: newest
`created_at`, then lowest lexical event ID on a tie, within the same kind,
outer author and `d` address. Preserve superseded history separately. Resolve
the current source's inconsistent membership tie ordering through conformance
fixtures rather than copying it. Timestamp ordering must not decide between
independent device tips or replace ancestry-based reconciliation.

## Deno server design

The Deno server owns a durable encrypted revision/object repository and a headless
participant for each connected managed vault. It runs independently of browser
tabs, has a distinct device identity, and records the revision currently applied
to the server working copy. Idle shutdown persists work and startup resumes it.
Keep the encrypted repository separate from the readable managed working vault
and generated indexes. The server participant decrypts, reconciles and applies
through host capabilities; its storage-provider operations still receive only
encrypted records and scoped requests.

Use the existing typed control plane for bounded metadata and direct Fetch
routes for streamed objects. Add protocol negotiation, repository binding,
event publication/query, membership-history retrieval, guarded tip publication,
apply status and subscription operations. This is event/filter compatibility
over the Deno API; implementing Nostr WebSocket `EVENT`/`REQ`/`CLOSE`, NIP-42
or Blossom HTTP endpoints is not required. Every operation checks account
authorization and vault or enrollment-session scope. The headless engine is
shared with the client; HTTP and storage policy remain server-owned.

### Durable event and object storage

Store original signed records in a dedicated durable Turso/SQLite sync database,
separate from disposable application/search indexes. Index authenticated vault
scope, event ID, outer author, kind, timestamp, supported tags and a durable
arrival sequence. Keep current replaceable-event indexes alongside immutable
event history. Normal replaceable queries return current records; explicit
history retrieval returns superseded records required for recovery.

Index attested membership root-event IDs separately so predecessor references
can retrieve original outer envelopes without changing `ids` filter semantics.
Keep the membership chain needed to ingest consecutive generations and validate
authority. Retain revisions, superseded HEADs and membership events
conservatively; replacing a current record does not delete historical evidence.

Replace Blossom's storage role with authenticated, vault-scoped encrypted
object storage addressed by SHA-256 of ciphertext. Provide existence checks,
idempotent uploads and streamed downloads, verifying size and hash before an
upload is durably acknowledged. Object bytes remain in dedicated sync storage,
outside readable content and disposable indexes. No external Blossom service
is needed. Object hashes alone do not grant cross-vault read access.

### Publication validation and catch-up

The event service checks supported shape/kind, event ID, signatures, matching
envelope metadata, scope and account access. Verify both signatures for wrapped
events and the direct signature for pairing or supported legacy events. The
enrolled participant checks encrypted membership generations, revocation cutoffs,
ancestry and referenced durable object dependencies. The storage layer cannot
infer encrypted references from public tags. Stage records awaiting participant
validation outside accepted queries and feeds; they cannot advance accepted
HEADs. Persist validation work across locked keys and restarts, and report
staged, accepted and applied states separately.

Commit accepted events and their durable arrival records before acknowledging
acceptance or notifying subscribers. Repeated event IDs are idempotent and
must not manufacture another revision or arrival. Publish immutable objects
and revisions before advancing a discoverable HEAD.

Query pages use a stable snapshot boundary. Catch-up uses durable arrival
sequence, not an event timestamp watermark, so a late event with an older
`created_at` is still delivered. Tie snapshot retrieval to subscription resume
without a gap, deduplicate retries, and recheck authorization when access
changes. Invalid or unavailable cursors require bounded full reconciliation.
The existing in-memory event hub may wake clients, but it is not the sync log.

### Server participant and working vault

1. A client stages immutable encrypted objects and publishes its signed,
   encrypted revision.
2. The event service and enrolled participant perform their respective checks,
   then durably accept the participant tip and pending apply work.
3. The server participant compares that history with its own captured changes.
4. Compatible updates apply through a recoverable plan; divergence is preserved
   and either resolved deterministically or exposed as a merge requirement.
5. Live notifications wake clients, which reconcile from durable records.

Managed Web/API writes enter the same per-vault capture/serialization boundary.
Capture server changes before applying an incoming revision so outstanding
server edits retain their ancestry. Imported revisions retain their identity;
only actual server-authored changes produce a new server revision.
Encrypt and sign those changes before publication, using the same mandatory
format and host capabilities as local devices.
Record the authenticated user or service responsible for managed edits as
provenance without treating every browser tab as an independent sync device.

For the first Deno topology, serialize merge acceptance per vault at the server.
Client resolution submissions identify their base and participating tips; the
server revalidates those tips and file generations before accepting a merge.
Stale or competing submissions preserve the draft and trigger reconciliation.
The shared engine computes the merge, while the provider enforces acceptance.

For external tools editing managed content, combine filesystem observation with
startup/periodic reconciliation. Treat watcher messages as hints, revalidate
file generations/content before applying, and handle temporary files and
partially written input. A file outside the managed root never enters sync.
External writes can bypass application locks, so a failed precondition triggers
replanning rather than overwrite. Capturing every intermediate external save
is outside the guarantee.

Persist apply intent and progress before changing working-copy files. Stage
replacement bytes, guard writes/deletes against the version used for planning,
and recover idempotently after a crash. Per-file atomic replacement does not
make an entire vault update atomic. Publish an applied marker only after every
planned operation completes. Reconcile a crash between filesystem mutation and
journal completion without duplicating an authored revision.

History objects, identities, unsent revisions, outboxes and incomplete apply
records are durable sync data. Keep them outside disposable search/index state
and exclude them from vault capture. Define backup/restore of this repository
and host-owned keys; a database rebuild cannot erase unpublished user history.
Initially retain history conservatively. Garbage collection needs a later,
explicit policy for offline devices and reachable revisions.

Event-store queries search public routing metadata only. Filename and content
search use the authorized server's separate decrypted working-vault index.
Rebuilding that index must not remove event history, encrypted objects or
unpublished work.

## Mandatory end-to-end encryption

Every provider uses the common encrypted object format. There is no plaintext
sync mode, optional-encryption setting, or automatic downgrade. Reuse the
existing host cryptographic foundation: XChaCha20-Poly1305 authenticated
encryption with fresh random nonces, HKDF-SHA-256 purpose separation, and signed
revisions. Bind authenticated records to the intended vault, purpose, version
and encryption epoch; verify them before materialization or application.

Keep NIP-44 for pairwise key envelopes and pairing. It does not replace the
existing object cipher suite. Preserve encrypted object bytes, hashes and
cryptographic compatibility vectors across providers.

Encrypt file chunks, file and directory manifests, paths, revision messages,
history payloads and private tip payloads before provider transport or remote
storage. Allow only the minimum routing and authorization metadata in public
envelopes: opaque vault/object identifiers, outer and attested public identities,
event kinds, tags, timestamps, protocol versions and required transport metadata.
The outer attestation envelope remains structured JSON around an encrypted
inner payload; do not claim the entire outer `content` field is ciphertext.
Document visible object sizes and traffic timing; encryption does not conceal
those observations.

Production Deno connections also require HTTPS. Reject unsupported
cryptographic versions, invalid signatures, cross-vault substitutions,
corrupted ciphertext and authentication failures without plaintext fallback.
Retain Nostr cryptographic compatibility vectors without silently migrating
existing Nostr Sync vaults.

## Authentication and content access

Lapis Server is an explicitly enrolled, authorized endpoint: it can decrypt and
edit the managed vault. End-to-end encryption protects sync data between
authorized endpoints and in the remote object repository; it does not hide
content from that enrolled server. Readable working files and generated
indexes are endpoint data and are not claimed to be encrypted by this protocol.
The existing server-mode Web session accesses that trusted server over HTTPS;
it is not a separate key-holding sync device solely because it edits a file.

Owner-authorized enrollment binds the server device identity to the intended
vault and transfers key material through the authenticated, encrypted host
enrollment mechanism. Enroll the server as a distinct member device with the
keys needed to read and publish, without automatically granting owner or
recovery authority. Account login alone never transfers vault keys.

Each endpoint generates and retains its own device signing key. Preserve the
additional shared vault Sync Identity key that signs outer envelopes; keeping
device keys separate does not make that transport identity independent per
device. Host enrollment delivers the Sync Identity and vault epoch keys using
the existing encrypted transfer and per-device NIP-44 envelopes. Raw private
keys never enter plugin or provider memory. Owner and recovery keys remain with
their respective authorities.

Keep account credentials, transport credentials, device signing keys and vault
encryption keys separate. Login credentials never become vault encryption
keys. Private material remains in protected host custody, with server keys
wrapped at rest using a separately protected host wrapping secret. Only the
authorized host participant invokes decryption; provider APIs do not expose raw
keys. Future Nostr and S3 storage providers remain opaque stores unless
independently enrolled as authorized endpoints.

Define desktop and locally backed Web authentication deliberately. The existing
same-origin cookie/CSRF flow is not automatically a cross-origin sync login.
Use host-mediated enrollment and scoped, revocable credentials; preserve the
existing server browser session protections. Keep secrets out of plugin data,
vault files, URLs, logs and generated state. Hosts own durable key custody.

Pairing kind `24134` uses temporary authenticated enrollment sessions that are
scoped to the intended vault and session, expire, and grant only pairing
delivery. A joining device can complete enrollment before acquiring general
vault membership. General event/object access requires established vault
authorization; pairing messages do not become durable sync history.

Map viewer/editor/owner roles to read, publication and administrative operations.
Recheck authorization for publication and subscription lifetime; possession of
a device signature alone does not grant account membership. Revocation blocks
new publication by the revoked participant and rotates to a fresh random
encryption epoch key distributed only to remaining authorized endpoints.
Validate the attested device and its membership generation even when a revoked
device retains a valid shared outer signing key. A valid Sync Identity signature
alone never grants publication authority. Preserve root-authorized transport
identity rotation and its historical generation/cutoff bounds.
Historical keys remain available where needed for history and restore.
Revocation cannot erase previously obtained plaintext or historical keys;
reused historical objects retain their original epoch and protection limits.

Recovery uses owner-controlled encrypted bundles. Account password reset does
not grant decryption access. Locked or unavailable keys pause operations that
require those keys and preserve pending work; neither lost keys nor a failed
unlock enables plaintext recovery, publication, or a silent vault reset.

## Connection and recovery behavior

The first connection explicitly chooses creating a server vault or joining an
existing one. Store the stable binding only after server identity and access
are verified. With two populated vaults and no shared ancestry, show a preview
that retains both sides and requires decisions for collisions. An empty side
must not turn the other side's files into inferred deletions.

On reconnect, drain durable changes, discover remote tips and dependencies,
publish queued local revisions, and reconcile without overwriting pending local
edits. On cursor expiry or index rebuild, rescan against a known repository
snapshot; absence from a partial page is never a deletion signal.

Recover from a server restart, lost response after accepted publication,
interrupted object transfer, database reconstruction and expired credentials.
Recovery previews retain local-only files and validate their captured generations
again before application. A changed server identity requires explicit rebinding.

Only one sync engine owns application to a given logical local vault at once.
Add a host-owned lease/capability check covering Lapis Sync and legacy Nostr Sync
before supporting coexistence. Prevent two plugins from independently applying
the same vault while still allowing the standalone History plugin to coexist.

## UI preservation contract

The current Nostr Sync UI is the design reference. Reuse or extract its source
with the ownership/license arrangement above, rather than substituting the
separate History plugin. Preserve interaction, layout, tokens and terminology;
adapt only provider-specific setup, identity and connection details.

| Surface              | Behavior retained or adapted                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Sync pane            | Status badge, icon-only checkpoint/sync actions, pending files in Design Core FileListing; workspace-header height and existing spacing |
| History              | Lane-based revision DAG, forks/merges/device tips, inline expanded changed files and existing selection treatment                       |
| History selection    | Selecting the same revision collapses its changes and closes the diff column                                                            |
| Compare              | Design Core FileDiff in Column Canvas; choosing a file opens the comparison column                                                      |
| File History         | The same HistoryCanvas filtered to the focused file, with ancestor links rewired                                                        |
| Conflicts            | Merge-required banner, Design Core MergeEditor, persisted choices and stale-draft invalidation                                          |
| Restore              | File/vault restore creates a forward revision and appears in the same history                                                           |
| Status bar           | Pending count, tone, progress and popover for revisions, destination health and outstanding work                                        |
| Settings             | One controlled declarative source for connection, this device, active devices, enrollment and recovery; no new top-level custom page    |
| Diagnostics          | Recoverable errors enter Problems and clear when resolved                                                                               |
| Copyable identifiers | Existing shortened display/full-value copying through CopyableValue                                                                     |

Deno setup displays server address, account/access state and managed vault.
Do not require external npub registration or relay/Blossom configuration for
Deno. Preserve the enrollment/recovery placement and interaction patterns while
implementing the provider's actual authorization
flow; do not render nonfunctional QR or camera controls to imitate a capability.
Within the same settings and status surfaces, cover explicit server enrollment,
locked/unavailable keys, content-key rotation and encrypted recovery. Explain
that the enrolled server can read content. Mandatory encryption has no toggle;
content-key rotation is distinct from shared Sync Identity rotation. Existing
owner identity actions use Deno authorization preflight rather than requiring
external relay or Blossom probes.

Use proposed view IDs `sync`, `sync-history`, `sync-file-history`, and internal
`sync-compare`, subject to collision checks. Qualify titles where necessary so
the separate History plugin is distinguishable. Preserve checkpoint, sync-now,
open-history and file-history command semantics with plugin-scoped IDs.

Stories belong to the single root Storybook under `Plugins/Sync`. Preserve all
six placements for command panes, presentational component stories, responsive
shell stories, light/dark themes, keyboard behavior and accessibility. Run a
real shell with Markdown registered and multi-branch history. Keep changed
stories visual-pending; visual review is separate and does not authorize a
baseline update or excuse functional failures.

## Delivery sequence

| Slice                                    | Deliverable                                                                                                                                                        | Exit evidence                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1. Contracts and source transfer         | Resolve naming/license, record source inventory, specify retained Nostr protocol/fixtures, provider APIs, inclusion policy and host/server auth/storage boundaries | Reviewed contracts, event/encryption compatibility vectors, filter semantics and public API ownership map                    |
| 2. Shared engine and local durability    | Headless engine export, existing Nostr codecs, encrypted local store/outbox, checkpoint/history/merge models, memory provider                                      | Offline history survives restart; IDs/ciphertext remain stable; merge/restore and provider conformance pass                  |
| 3. Deno durable destination              | Durable event database, encrypted object routes, query/filter indexes, membership history, snapshot paging, resumable subscriptions and guarded publication        | Real server passes filter/ordering, enrollment, retry/restart and catch-up fault scenarios                                   |
| 4. Server participant and reconciliation | Capture managed/external edits, apply journal, origin suppression, server identity and recovery                                                                    | Server edits propagate with no browser open; concurrent local/server changes and interrupted applies preserve both histories |
| 5. Plugin and retained UI                | Enrollment/settings, connection lifecycle, existing Sync/History/File History/Compare/Merge/status composition                                                     | Root Storybook interaction/axe and six-placement coverage; real two-device shell acceptance                                  |
| 6. Consumer and release qualification    | Desktop/server Web flows, supported local Web flow, portable dependencies, package/archive outputs                                                                 | Cold native and real Deno/Web acceptance, frozen registry-only installs, package and release verification                    |

Each slice updates its canonical specification before protected implementation,
runs the exact affected regression first, and commits separately in each owning
repository after required checks. Add `packages/sync` to repository metadata,
specification mapping and release/catalog tooling as part of scaffolding, not
this planning change. Host capabilities ship before plugin integration that
depends on them. Source publication remains separate from approved releases.
The first contracts slice makes encryption mandatory in plugin, host and server
requirements. Shared-engine qualification includes cryptographic compatibility
vectors, unchanged event/envelope fixtures and encrypted offline storage.
Deno qualification verifies filters, durable catch-up, enrollment, wrapped key
custody and encrypted publication in both directions. UI and final
consumer qualification include locked-key, rotation and recovery states.

## Acceptance matrix

| Scenario                                | Required result                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Local edit with server online           | Same content and revision ancestry reach the server and second device                                          |
| Offline local editing and restart       | Files, local checkpoints and publication queue survive; reconnection converges                                 |
| Server Web edit                         | Local devices receive the edit and its server-authored ancestry                                                |
| External server edit with no browser    | Observation/rescan captures content and publishes a server revision                                            |
| Simultaneous edits                      | Nonconflicting files converge; conflicting text/binary/delete/rename cases retain both versions for resolution |
| Edit during snapshot or apply           | Generation/content guard rejects stale work; no silent overwrite                                               |
| Server crash during apply               | Restart completes or safely replans the durable intent; no false applied marker                                |
| Lost response or duplicate notification | Retry is idempotent and does not manufacture another revision                                                  |
| Missing/corrupt object                  | Integrity/dependency checks block publication or apply and retain recoverable work                             |
| Cursor expiry or index rebuild          | Bounded full reconciliation restores bindings without inferred mass deletion                                   |
| New connection with files on both sides | Preview preserves local/server content and requires collision choices                                          |
| Permission loss/device revocation       | Reads/writes/subscriptions follow current authorization; local content remains available                       |
| Large attachment                        | Streamed checkpoint and apply meet the retained 64 MiB in-flight target                                        |
| Restore and file history                | Forward-only restore and stable rename identity are visible in the retained UI                                 |
| Plugin disable/unload/re-enable         | Bounded flush attempt, disposed resources and resumed durable work                                             |
| Legacy plugin coexistence               | Exclusive apply ownership prevents simultaneous sync writers; no implicit migration                            |

Protocol and Deno storage acceptance add the following blocking scenarios.
Conformance fixtures define intended behavior; the current memory adapter's
ordering and subscription shortcuts are not an authority for production behavior.

| Protocol/storage scenario                   | Required result                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing event and object fixtures          | Round-trip preserves event IDs, signatures, envelopes, encrypted payloads, ancestry references and ciphertext hashes                        |
| Supported and combined filters              | Every supported field, AND/OR combination, empty array, inclusive timestamp boundary and union deduplication matches the specified contract |
| Outer author and legacy HEAD discovery      | Author/ID filters match outer records; current and legacy HEAD queries resolve the intended independent tips                                |
| Unsupported query feature                   | Explicit rejection; no silent widening or claim of full relay/NIP-77 support                                                                |
| Replaceable ordering and history            | Same-address timestamp ties use the lowest event ID; superseded records remain retrievable without replacing independent device tips        |
| Membership-chain catch-up                   | An offline device retrieves each missing generation through attested predecessor IDs and validates original signed envelopes                |
| Duplicate publication and lost response     | One immutable record and accepted arrival; retry reports current status without another revision                                            |
| Late arrival and concurrent paging          | Snapshot pages and arrival cursors avoid omissions even when old-timestamp events arrive during retrieval                                   |
| Subscription gap, restart or expired cursor | Durable replay or explicit bounded reconciliation restores history without inferred deletions                                               |
| Locked participant or missing dependency    | Staged records survive restart but remain outside accepted queries/feeds and cannot advance a HEAD                                          |
| Pairing expiry and permission changes       | Temporary session access cannot read general history; expiry/revocation terminates unauthorized delivery                                    |
| Cross-vault event or object access          | Filters, event IDs and ciphertext hashes cannot bypass vault authorization                                                                  |
| Rebuilt application/search index            | Durable events, objects, membership history and pending work remain intact                                                                  |

Encryption adds the following blocking acceptance cases to every applicable
provider and consumer lane. Inspect provider requests before TLS encryption,
the encrypted object repository and provider logs, separately from authorized
endpoint working files and indexes.

| Encryption scenario                      | Required result                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Known plaintext fixture                  | File content, filenames and revision messages are absent from provider requests, encrypted storage and provider logs                        |
| Authorized and unenrolled endpoints      | Enrolled clients and Deno decrypt successfully; an unenrolled endpoint cannot                                                               |
| Tampered or substituted records          | Invalid signatures, modified ciphertext, cross-vault substitutions and unsupported suites fail closed                                       |
| Downgrade attempt                        | Plaintext records and negotiated plaintext fallback are rejected                                                                            |
| Server credentials without vault keys    | Account/transport credentials alone cannot unlock encrypted sync data                                                                       |
| Revocation and rotation                  | Revoked endpoints cannot decrypt newly encrypted next-epoch content or publish accepted revisions; historical access limits remain explicit |
| Revoked member retaining shared identity | A valid outer signature cannot authorize a revoked device attestation                                                                       |
| Offline checkpoint and repeated upload   | Local objects/outbox remain encrypted; restart and retries preserve IDs and ciphertext                                                      |
| Merge, restore and server edit           | Authorized endpoints produce encrypted, signed forward revisions and retain bidirectional behavior                                          |
| Locked or missing keys                   | Work is retained, key-dependent operations pause, and no plaintext fallback or silent reset occurs                                          |
| Encrypted recovery                       | A valid owner-controlled bundle restores access; account password reset alone does not                                                      |

Tests use one provider conformance suite plus Deno integration cases. Record
functional and accessibility before/after counts. Follow the workspace test
scope ladder for shared engine, UI and host changes, including cold runs and
each affected consumer. Run audit, specification, package check/test/build,
Storybook interaction/axe/static build, publint, pack and archive/signature gates
where applicable. A memory-provider pass alone does not qualify Deno or native
credential and filesystem behavior.

This planning-record revision changes no runtime or canonical requirements.
Validate the document with its formatter and any checker that consumes it,
then run the repository audit before a scoped Jujutsu commit. Runtime and
consumer suites apply to the implementation slices above, not this record-only
change. Keep unrelated work and local configuration out of the commit; source
pushes and public package/release publication remain distinct operations.

## Deferred work

- Nostr provider integration and explicit migration of existing `nostr-sync`
  history, settings and identities; retain legacy readers until migration is
  specified and verified.
- S3 provider, tested conditional-write semantics and polling discovery.
- A general/public relay, Nostr WebSocket endpoint, Blossom HTTP compatibility,
  arbitrary tag/full-text event queries and NIP-77 negentropy.
- Simultaneous heterogeneous destinations, destination switching and backfill.
- Live character collaboration, multi-process server coordination, selective
  sync, advanced retention/garbage collection and production server automation.
- Public npm publication, release assets and registry updates until the normal
  explicit release approval.

## Source reference map

Paths outside this repository are sibling source references, not dependencies.

- `../lapis-plugin-nostr-sync/spec/src/plugins/nostr-sync/{architecture,protocol,runtime,ui}.md`
  defines the current behavior and detailed UI reference.
- `../lapis-plugin-nostr-sync/src/lib/sync/{coordinator,autosave,merge,rebind}.ts`
  contains shared orchestration and reconciliation to extract behind destination
  adapters while retaining the Nostr protocol.
- `../lapis-plugin-nostr-sync/src/lib/{objects,revisions,transport,ui}` and
  `src/stories` identify the object, protocol, provider and presentation sources.
- `../lapis-plugin-nostr-sync/src/lib/transport/{types,memory,nostr,authority-envelope}.ts`
  and `src/lib/revisions/revision.ts` define current event/filter types,
  attestation envelopes, IDs and ancestry references; conformance tests must
  resolve existing adapter ordering differences.
- `../lapis-notes/packages/api/src/lib/sync-host.ts` and
  `sync-host-security.ts` own the public host-capability foundations.
- `../lapis-notes/spec/src/server-deno-host.md` and
  `packages/server-deno/src/{managed-vaults,events,browser,vault-runtimes}.ts`
  define the current server/remote-client boundary.
- `spec/src/spec-governance.md`, `spec/src/distribution.md` and `AGENTS.md`
  govern plugin intake, shared Storybook, source ownership and qualification.
