# Lapis Sync implementation plan

Status: proposed implementation plan, 12 October 2026. This record plans work;
it does not register a plugin, change runtime behavior, or authorize a release.

Build **Lapis Sync** in this repository, with **Lapis Server** as its first
destination provider, implemented by the Deno server. Preserve the change,
history, comparison, merge, and status experience from `lapis-plugin-nostr-sync`.
Local devices and the server each retain an editable vault and synchronize
through shared revision and reconciliation rules. Nostr and S3 follow later.

## Product decisions

| Decision                 | Planned choice                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Display name             | Lapis Sync                                                                         |
| Package                  | `@lapis-notes/lapis-plugin-sync`                                                   |
| Repository and directory | `lapis-plugins`, `packages/sync`                                                   |
| Runtime identity         | New plugin ID `sync`; retain existing `nostr-sync` identity                        |
| First provider           | Provider ID `lapis-server`, displayed as Lapis Server                              |
| First server mode        | Trusted participant with a readable managed vault                                  |
| First topology           | One configured destination per local vault; multiple devices may connect           |
| Installation             | Optional plugin, disabled by default; host owns installation and profiles          |
| UI foundation            | Existing Nostr Sync composition and interactions, using public Design Core exports |
| History model            | Immutable snapshots and revision ancestry, device tips, three-way reconciliation   |
| Later providers          | Nostr with Blossom, then S3-compatible object storage                              |

The server trust mode and single-destination scope are proposed defaults for
the first implementation. Adding Lapis Sync does not rename, overwrite, or
silently migrate Nostr Sync. Registry namespace availability and view/command
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
policy. Its transport interface and persisted revisions still expose Nostr
events, and its settings and host security capabilities contain Nostr-specific
identity, enrollment, and signing concepts. Extraction needs explicit contracts
and compatibility tests.

The Deno server supplies managed vaults, account roles, serialized managed
mutations, conditional replacement with ETags, direct byte routes, and tracked
event subscriptions. Its current event replay is bounded and in memory. It
does not yet provide a durable sync repository or a continuously operating sync
participant. Existing online file access is useful infrastructure, but does not
establish offline convergence or crash-safe multi-file application.

## Ownership and package boundaries

| Owner                                     | Planned responsibilities                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lapis-plugins/packages/sync`             | Plugin lifecycle, sync engine, neutral revision/object codecs, provider contract, Deno client provider, history/merge UI, settings and plugin stories |
| Plugin `./engine` export                  | Headless engine and public types usable by a server; no Svelte, DOM, ambient App, or UI imports                                                       |
| `lapis-notes/packages/api`                | Generic file identity, guarded I/O, origin, durable sync-storage and secret capabilities; public protocol contracts where host-owned                  |
| `lapis-notes/packages/server-deno`        | Authenticated sync routes, vault authorization, durable server storage, server participant, managed-file integration and lifecycle                    |
| `lapis-notes/packages/deno-host-services` | Reusable Deno filesystem/watch primitives where needed                                                                                                |
| `lapis-notes` desktop/Web hosts           | Credential custody, enrollment integration, installation and consumer acceptance                                                                      |
| `design-core`                             | Generic UI defects or missing public primitives discovered during reuse                                                                               |
| `lapis-plugin-nostr-sync`                 | Existing provider behavior and compatibility until a separately planned migration                                                                     |

Start with one plugin package and a deliberately headless subpath export. Prove
that the server can import that export without executing plugin/UI modules. A
separate engine package is justified only if packaging or independent consumers
require it; avoid a new public package solely to organize source directories.

Dependencies cross repositories through published semver packages. Use a
documented temporary packed consumer for development qualification. Missing
host facilities are implemented upstream and consumed through public contracts.
Do not copy host persistence into the plugin or conceal gaps with wrappers.

Before transferring source, record its ownership, attribution and license. The
Nostr Sync package currently declares AGPL-3.0-or-later while this workspace
declares Apache-2.0. Establish a compatible package/extraction arrangement and
preserve required notices; do not silently relabel copied code. This is a
source-transfer prerequisite, not a reason to redesign the requested UI.

## Common synchronization model

Each synchronized vault has a stable logical sync ID, distinct from its local
path, server vault ID, provider instance ID, and endpoint URL. Persist explicit
bindings between those identities. Files retain protocol IDs across renames;
each host maps those IDs to its local stable file identities.

A revision contains a versioned canonical payload with its vault ID, immutable
revision ID, parent IDs, object-tree root, author/device identity, checkpoint
reason, message, and applicable encryption and authority versions. Provider
envelopes and locators do not determine the logical revision ID. Specify the
canonical encoding, hash and signature rules before implementing transports.
Define the hash input without a self-referential ID field, bind signatures to
that canonical content, and keep provider transport IDs as separate locators.

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
state, persist all referenced objects and the revision locally, then enqueue
publication. The outbox survives process termination. Retain the 20-second
quiet period and five-minute maximum checkpoint attempt, with single-flight
execution and bounded retry. Offline operation must still produce local history.

The engine distinguishes local durability, remote acceptance, server working-copy
application, and pending conflicts. A successful upload does not imply the
server has finished applying the revision, and a local checkpoint does not imply
remote replication. Reflect these distinctions in existing status surfaces.

## Provider contract

| Capability             | Required behavior                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Describe connection    | Protocol version, remote identity, authorization and supported capabilities                      |
| Store/read objects     | Immutable content-addressed bytes, integrity checks, bounded streaming and idempotent retry      |
| Publish/read revisions | Immutable canonical records with stable IDs and ancestry retrieval                               |
| Publish/discover tips  | Authenticated participant records; prevent accepted tip regression or silent lost updates        |
| Reconcile              | Bounded discovery with an explicit reset/snapshot fallback                                       |
| Notify                 | Optional live hints; polling and durable reconciliation remain sufficient                        |
| Report status          | Authentication, authorization, connectivity, quota and recoverable failures with stable meanings |
| Dispose                | Cancel requests and release subscriptions without losing pending work                            |

Define a small mandatory contract plus advertised optional capabilities. The
engine must not branch on NIP numbers, event kinds, S3 paths, or tRPC types.
Do not require every provider to offer a server-side atomic transaction across
objects, revisions and tips. Preserve safety through immutable staging and
publishing a discoverable tip only after its dependencies are durable.

The Deno provider uses conditional tip updates and idempotency keys. Future
providers must prove equivalent convergence and replay behavior through a shared
conformance suite. Provider registration is explicit application/plugin wiring
for this release, without dynamically loading arbitrary provider code.

## Deno server design

The Deno server owns a durable revision/object repository and a headless
participant for each connected managed vault. It runs independently of browser
tabs, has a distinct device identity, and records the revision currently applied
to the server working copy. Idle shutdown persists work and startup resumes it.

Use the existing typed control plane for bounded metadata and direct Fetch
routes for streamed objects. Add protocol negotiation, repository binding,
discovery, revision publication, conditional tip publication, apply status and
subscription operations. Every operation checks account membership and vault
scope. The headless engine is shared with the client; HTTP and storage policy
remain server-owned.

1. A client stages immutable objects and publishes its revision.
2. The server validates scope, authority, dependencies and publication guards,
   then durably accepts the participant tip and pending apply work.
3. The server participant compares that history with its own captured changes.
4. Compatible updates apply through a recoverable plan; divergence is preserved
   and either resolved deterministically or exposed as a merge requirement.
5. Live notifications wake clients, which reconcile from durable records.

Managed Web/API writes enter the same per-vault capture/serialization boundary.
Capture server changes before applying an incoming revision so outstanding
server edits retain their ancestry. Imported revisions retain their identity;
only actual server-authored changes produce a new server revision.
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

## Authentication and content access

Lapis Server is a trusted participant: it can read the managed vault and needs
host-owned access to any content keys required by the common object format.
Account authorization, device identity, and content-key access are separate
contracts. Login credentials never become vault encryption keys.

Prefer the common encrypted object format with explicit server enrollment so
later storage providers can use the same objects. Document what the server can
read and retain. Nostr/S3 storage providers can remain opaque stores; enrolling
a readable server expands the vault's trust boundary.

Define desktop and locally backed Web authentication deliberately. The existing
same-origin cookie/CSRF flow is not automatically a cross-origin sync login.
Use host-mediated enrollment and scoped, revocable credentials; preserve the
existing server browser session protections. Keep secrets out of plugin data,
vault files, URLs, logs and generated state. Hosts own durable key custody.

Map viewer/editor/owner roles to read, publication and administrative operations.
Recheck authorization for publication and subscription lifetime; possession of
a device signature alone does not grant account membership. Revocation blocks
new operations without claiming to erase already obtained content.

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
Do not expose Nostr npub registration, relay/Blossom configuration or transport
key rotation controls for Deno. Preserve the enrollment/recovery placement and
interaction patterns while implementing the provider's actual authorization
flow; do not render nonfunctional QR or camera controls to imitate a capability.

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

| Slice                                    | Deliverable                                                                                                                                                                   | Exit evidence                                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1. Contracts and source transfer         | Resolve naming/license, record source inventory, define canonical plugin/host/server requirements, provider and revision codecs, inclusion policy and auth/storage boundaries | Reviewed contracts, planned verification rows, compatibility vectors and public API ownership map                            |
| 2. Shared engine and local durability    | Headless engine export, local immutable store/outbox, checkpoint/history/merge models, memory provider                                                                        | Offline history survives restart; deterministic merge/restore and provider conformance tests pass                            |
| 3. Deno durable destination              | Authorized streaming object/revision routes, discovery, guarded tips, durable publication and status                                                                          | Real server accepts retry/restart/fault scenarios without lost or duplicate logical revisions                                |
| 4. Server participant and reconciliation | Capture managed/external edits, apply journal, origin suppression, server identity and recovery                                                                               | Server edits propagate with no browser open; concurrent local/server changes and interrupted applies preserve both histories |
| 5. Plugin and retained UI                | Enrollment/settings, connection lifecycle, existing Sync/History/File History/Compare/Merge/status composition                                                                | Root Storybook interaction/axe and six-placement coverage; real two-device shell acceptance                                  |
| 6. Consumer and release qualification    | Desktop/server Web flows, supported local Web flow, portable dependencies, package/archive outputs                                                                            | Cold native and real Deno/Web acceptance, frozen registry-only installs, package and release verification                    |

Each slice updates its canonical specification before protected implementation,
runs the exact affected regression first, and commits separately in each owning
repository after required checks. Add `packages/sync` to repository metadata,
specification mapping and release/catalog tooling as part of scaffolding, not
this planning change. Host capabilities ship before plugin integration that
depends on them. Source publication remains separate from approved releases.

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

Tests use one provider conformance suite plus Deno integration cases. Record
functional and accessibility before/after counts. Follow the workspace test
scope ladder for shared engine, UI and host changes, including cold runs and
each affected consumer. Run audit, specification, package check/test/build,
Storybook interaction/axe/static build, publint, pack and archive/signature gates
where applicable. A memory-provider pass alone does not qualify Deno or native
credential and filesystem behavior.

## Deferred work

- Nostr provider integration and explicit migration of existing `nostr-sync`
  history, settings and identities; retain legacy readers until migration is
  specified and verified.
- S3 provider, tested conditional-write semantics and polling discovery.
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
  contains orchestration and reconciliation to extract behind neutral contracts.
- `../lapis-plugin-nostr-sync/src/lib/{objects,revisions,transport,ui}` and
  `src/stories` identify the object, protocol, provider and presentation sources.
- `../lapis-notes/packages/api/src/lib/sync-host.ts` and
  `sync-host-security.ts` own the public host-capability foundations.
- `../lapis-notes/spec/src/server-deno-host.md` and
  `packages/server-deno/src/{managed-vaults,events,browser,vault-runtimes}.ts`
  define the current server/remote-client boundary.
- `spec/src/spec-governance.md`, `spec/src/distribution.md` and `AGENTS.md`
  govern plugin intake, shared Storybook, source ownership and qualification.
