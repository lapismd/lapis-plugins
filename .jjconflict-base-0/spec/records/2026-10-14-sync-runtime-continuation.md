# Lapis Sync runtime continuation

The active objective is to implement and land every feature in the Deno-first
[implementation plan](2026-10-12-lapis-sync-deno-plan.md). Creating an isolated
workspace or finishing one slice does not complete that objective. Public
publication and visual-baseline approval retain their explicit gates.

Implementation workspaces:

- `../lapis-plugins-sync-runtime`: plugin, headless engine and destination client.
- `../lapis-notes-sync-runtime`: owning API capabilities, native storage and Deno host.
- `../mira-sync-runtime`: portable Markdown editing-session capability for
  embedded writers; the original Mira checkout's unrelated artifact is preserved.

The default Lapis Notes checkout has unrelated registry work. It is preserved.

## Feature ledger

| Planned deliverable                                                              | Current state                                                                                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Signed Nostr codecs, event filters, replaceable ordering and retained UI         | Existing qualified foundation; production UI remains disconnected.                                                                     |
| Encrypted local snapshots, checkpoints and persistent publication queue          | Qualified headless implementation against an opaque durable repository; production integration remains pending.                        |
| Stable retry ciphertext, objects-before-revision-before-HEAD publication         | Implemented; staged revisions remain pending and unknown receipts fail closed.                                                         |
| Durable host repository and local-state crypto                                   | Native SQLite kernel, crypto purpose, scoped adapter and admitted desktop JSON data RPC qualified; production runtime remains pending. |
| Actual client runtime, automatic checkpoints and host change capture             | Pending.                                                                                                                               |
| Revision discovery, membership-aware ingestion and ancestry reconciliation       | Headless ingestion/planning and enrolled history policy qualified; production discovery and host wiring pending.                       |
| Guarded apply journal, crash recovery, restore and integrated merge decisions    | Headless recovery and native filesystem kernel qualified; production bridges, integrated merge/restore pending.                        |
| Deno durable event store, encrypted object APIs, filters and catch-up            | Pending.                                                                                                                               |
| Endpoint authentication, enrollment, protected key custody, pairing and recovery | Desktop native custody/RPC and host pairing qualified; server custody, enrollment, rendezvous and live runtime wiring pending.         |
| Server participant, managed/external capture and origin suppression              | Pending.                                                                                                                               |
| Desktop/server Web integration and real two-device acceptance                    | Pending.                                                                                                                               |
| Full fault/security matrix, portable package qualification and landing           | Pending.                                                                                                                               |

Future Nostr/Blossom and S3 adapters remain deferred by the plan. Deno does not
require an external relay or Blossom service.

## Current evidence

- Original Sync suite: 89 passing tests before runtime changes.
- Initial offline-restart target failed because the runtime did not exist.
- Object-graph hardening target: ten failures before fixes, zero afterward.
- Host local-state encryption target: one failure before tag 8, zero afterward.
- Native repository: three disk/reopen/isolation/concurrency tests pass.
- API: 829 tests pass; package check and public build pass.
- Native host services: Deno check and all 32 tests pass after building the
  required Language Service output.
- Fresh Sync interaction/axe run: all 47 stories pass.
- Bundled engine with real host crypto and native SQLite: checkpoint survives
  repository close, key lock/unlock and reopen with unchanged signed outbox;
  disk files contain none of the known plaintext path/content/message.
- Real Deno process: native SQLite state/blob reopen and bundled engine import pass.

Final local-runtime qualification: 137 tests pass in 11 files, including the
original frozen objects and retained synthetic 3 GiB streaming case. Package
check reports zero errors/warnings; build, publint and npm pack pass. The 112-file
pack excludes test fixtures; its bundled engine imports in Node and Deno with
62 exports. New checkpoints remain independent of blocked publication, and
disposal clears decrypted metadata while preserving the durable queue.

The plugin repository check/test/build and 104 release-tooling tests pass in the
temporary consumer setup. Both owning host repository aggregate check/test/build
lanes pass. An initial host declaration test timed out under concurrent load;
its exact retry and the full sequential run pass with unchanged assertions.
The previously recorded wider catalog and registry-only release limitations
remain outside this focused qualification. Host dependency audit findings are
recorded separately in its Sync repository milestone.
Existing dependency ranges and committed lockfiles remain unchanged.
The ignored validation setup uses a prepared Workspace 0.2.0 tarball because
npm still has no version satisfying the committed Workspace range. Other host
packages use released registry versions. Temporary peer alignment prevents
duplicate API type identities; it is not registry-only release evidence.

## Incoming ancestry and guarded apply

The headless engine now authenticates and caches incoming HEAD ancestry before
persisting tips. The caller must supply explicit enrolled membership authority;
the engine never grants membership from a valid transport signature. Original
archive aliases remain compatible. Planning retains independent device tips,
uses ancestry for fast-forward/divergence and preserves uncheckpointed files.
Downloads do not hold the local checkpoint mutation queue.

Fast-forward apply persists an encrypted intent before mutation. Host-owned
durable receipts let restart recover a mutation whose progress was not saved.
Identity, content generations and whole-vault verification prevent a false
applied marker after user edits. Imported fast-forward does not author a
duplicate revision. Checkpointing blocks while an apply intent exists.

The exact prototype-shaped filename regression moved from one failure to zero;
ordinary paths such as `__proto__` and `constructor` survive apply, restart,
modification and deletion. Receipt-substitution recovery preserves the actual
durable mutation. The incoming/apply family has 23 passing tests; the complete
Sync suite has 160 passing tests in 13 files. Package engine/Svelte checks and
the supplemental test-source TypeScript check pass.

The repository check/test/build lanes pass (unchanged active-package tasks reuse
their cache); the private Sync package is checked and tested explicitly.
Specification and App-ownership gates pass. A fresh Sync Storybook run passes
all 47 interaction/axe stories. All 104 release-tooling tests pass. The packed
120-file package excludes test fixtures, imports in Node and Deno with 62
headless exports, and passes the real host-crypto/native-repository acceptance
for restart, key lock/unlock, stable outbox and plaintext absence. This native
acceptance covers local persistence, not filesystem apply. The audit reports
the existing three advisories under existing committed exceptions; this slice
adds no versions or advisory exceptions. Registry-only and wider-catalog
qualification remain as previously recorded.

This qualifies the headless contract with a fixture apply adapter. The actual
native filesystem receipts, production membership/epoch policy, divergence
decisions, restore and runtime/host integration remain required.

## Enrolled history policy and authority races

`createMembershipHistoryAuthority()` consumes the enrolled host's verified
owner-authorized membership projection and installed key epoch numbers. It
rejects missing/wrong-vault/wrong-owner membership, unknown attested devices,
future generations and invalid epochs. It retains only approved revoked-device
ancestry, rejects revoked HEADs, and enforces retired Sync Identity generation
intervals and per-device cutoffs. Legacy transport requires its explicit cutoff
once the shared Sync Identity is activated. No key material enters the policy.

Incoming records are authenticated and cached before cutoff proofs use their
complete ancestry; no candidate state is accepted until all reachable revisions
and incoming HEADs are authorized. Cached tips and guarded apply recheck current
membership. A revoked ancestor within its cutoff may remain under an active
child; an ancestor beyond its cutoff rejects the entire incoming acceptance.
The cached-child regression initially retained an unauthorized fast-forward.
Planning and apply recovery now revalidate the complete referenced ancestry,
including after a membership change during an interrupted apply. That exact
case moved from one failure to a pass without changing the working content.

Checkpoint and incoming persistence now carry their planned membership/epoch
through to the sealed-state commit. The four generation/epoch race tests fail
against the parent engine/state implementation in an ignored source copy and
pass against the current source. The policy initially failed to import because
it did not exist; its eleven unit/integration cases now pass. The complete
runtime family has 59 passing tests and the Sync suite has 177 in 14 files.
Package checks and supplemental test-source TypeScript pass.
Two additional mutable-authority regressions moved from failures to passes:
the engine captures an independent authority snapshot so a host's cached object
cannot mutate the planned generation/epoch and bypass the commit guard.

The owning host's portable native acceptance now supplies actual host-generated
membership to the packed policy, rotates the real Sync Identity, verifies the
retired cutoff, rejects false device attribution and missing ancestry proofs,
and rejects access while locked. The existing native repository reopen,
unchanged signed outbox and plaintext-absence checks still pass. The old packed
engine fails the new export assertion; the updated packed engine passes.

The 124-file package has no test fixtures and imports in Node/Deno with 63
headless exports. A fresh run passes all 47 Sync interaction/axe stories.
Production membership/installed-epoch capability wiring and persistent host
key custody remain pending, as do remote membership-chain catch-up, native
filesystem apply and the remaining full-plan deliverables. This acceptance uses
a test-owned security database; it does not establish production key restart
or server enrollment behavior.

Both owning repository aggregate check/test/build lanes and specification gates
pass. Unchanged packages reuse their tracked task caches; the private Sync
package is qualified explicitly. The native package has 32 passing tests;
server, desktop and Web unit lanes also pass (28, 219 and 55 respectively, with
one existing desktop integration skip). All 104 plugin release-tooling tests
pass. Existing dependency-audit and wider-catalog release limits remain as
recorded above; no package ranges, lockfiles or advisory exceptions changed.

The owning host workspace now implements native guarded mutations/receipts.
Its 25 kernel/lease tests cover real filesystem races, interrupted progress,
uncertain commit responses, process ownership, physical rename, staging-file
ownership and key/membership guards. All 57 native service tests pass.
Packed-engine acceptance with two independently paired devices passes in Node
and a real Deno process: bidirectional ancestry, a 20 MiB attachment,
interrupted installation, reopen, key lock/unlock and encrypted journals.
These tests use in-process delivery and fixture key custody; production
desktop/server bridges and Deno network APIs remain pending. See the host's
`spec/records/2026-10-14-sync-native-vault.md` for its exact evidence and limits.
Host root check/test/build and specification gates pass after the staging
ownership fix. Plugin ledger/specification checks, ownership and package
metadata checks pass; its audit retains the existing three advisory findings
under unchanged exceptions. No dependency ranges or lockfiles changed.

The host now stores immutable encrypted native receipts independently of its
active journal. Its 38-case repository/vault/lease family covers bounded active
work, authenticated receipt readback, lost insert/compaction responses and
receipt authority/substitution guards. Normal completed download staging is
removed; working preimages remain retained until a retention policy is supplied.
Current path-index and engine-history
metadata size still need to be accounted for in production integration; advanced
history/receipt garbage collection remains deferred. The host's
`spec/records/2026-10-14-sync-indexed-receipts.md` records the storage boundary.
All 67 native service tests, 829 API tests and host root check/test/build and
specification gates pass. Final packed-engine/native-file acceptance passes in
Node and Deno after authenticated indexed receipt readback was added. Plugin
ledger/specification/ownership/metadata gates pass; the existing audit and wider
catalog release limits remain unchanged.

The owning host now uses authenticated indexed journal format 2 and upgrades
supported legacy roots before returning capture/apply access. Ten migration
cases cover all legacy phases, incompatible formats, lost upgrade responses
and authority changes. The actual earlier kernel rejects format 2 in Node and
Deno cold acceptance; replaying a compacted create after deletion never recreates
the file. The host's `spec/records/2026-10-14-sync-journal-migration.md` records
the exact target and unchanged earlier-kernel fixture.
All 77 native service tests and host root check/test/build/specification gates
pass. The full host Storybook lane passes 243 interaction/accessibility stories
across 54 files. Packed-engine/native-file acceptance and earlier-kernel
compatibility checks pass in Node and Deno. The earlier plugin catalog and
registry-only release limits remain separate and unchanged.

The next integration work remains host capability/key lifecycle and production
pairing rendezvous, followed by integrated
merge/restore and the production runtime. The pure snapshot/merge helpers also
need path-dictionary regression coverage before that integration; guarded streaming apply now handles those
ordinary filenames. Deno destination/server participation and the complete
consumer/fault/security acceptance still belong to the active objective.

The owning host now qualifies explicit host-delivered pairing while preserving
the existing relay default and signed/encrypted Nostr messages. Both peers must
select host delivery; the v1 invitation retains `e,p,r,s,v` with no relay
addresses. Unlocked status lists actual installed content-key epochs, including
revoked members retaining only historical keys. Native packed-engine acceptance
uses these capabilities instead of fake relay addresses or assumed epochs.

The public `@lapis-notes/api/sync-security-host` export uses the same implementation
without UI imports. Strict Node import and all three portable acceptance scripts
pass in Node and Deno. Official renderer/sidecar releases declaring that subpath
reject through its generated no-platform host-module record.
All 51 focused API cases, 841 API tests, root check/test/build/specification gates
and a fresh 243-story host interaction/accessibility run pass. Its audit findings
are unchanged. The host's `2026-10-14-sync-host-pairing.md` record documents scope.
The host boundary is committed as `08aeb8fa` (change `wswwlvon`).

The existing Nostr plugin's packed-new-API qualification exposed its test-owned
seven-purpose crypto adapter. The owning source now supports authenticated
local-state tag 8 and rejects unknown purposes without changing production
Nostr/Blossom formats. Existing installed-host and packed-new-API qualification
each pass source checks, 116 unit tests (one existing integration skip), build,
publint and all 58 fresh interaction/accessibility stories. This uses a documented
ignored consumer setup; original manifests/lockfiles remain unchanged. The
plugin catalog and registry-only release limits remain separate and unchanged.
The owning Nostr fixture fix is committed as `fe475413` (change `nwyynxnn`).

This supplies host pairing artifacts and actual key-epoch metadata, not production
key persistence, renderer/native bridges, server enrollment or a network
rendezvous. Those integrations and the remaining Deno/server/client work remain
part of the active goal.

The owning host now supplies independent security storage through
`SyncHostServiceOptions.securityStore` and a dedicated versioned native SQLite
backend. Existing AppDatabase callers remain compatible; a configured store is
hidden from plugin facades/public options and never falls back after an error.
Seven API cases cover index replacement, grants, invalid stores and enrollment
response loss. The headless public metadata contract shares the existing
AppDatabase transaction definitions without browser/search imports and is
excluded from renderer/sidecar runtime dependencies.

Thirteen backend cases cover atomic competing enrollment claims, full rollback,
schema/namespace isolation, bounds, corruption and close ordering. The exact
foreign-name/NUL target moved from two failures to zero. All 90 native service
tests and Deno check pass; all 850 API cases and root check/test/build pass.
A final cold host browser run passes 243 interaction/accessibility stories.

Paired packed-engine/native-file acceptance now uses actual wrapped key databases
and recreates security services before initial use and interrupted-apply recovery.
Node and Deno both pass. Separate Node-to-Deno and Deno-to-Node process readback
also restores the same identities and decrypts earlier encrypted local state.
Engine-only and actual earlier-kernel checks still pass in both runtimes. The
legacy consumer passes source checks, 116 unit cases, all 58 fresh browser
stories, build/publint and static build against the new packed API. Its source
checkout is unchanged; this remains temporary tarball/peer qualification.

The host record `2026-10-14-sync-security-store.md` documents the exact scope and
unchanged audit findings. The boundary is committed as `c8c81e88` (change
`vvlnuktq`). Native wrapping still uses acceptance-only credentials
in these tests. Production paths, protected OS/server wrapping material, legacy
custody routing, bridges, enrollment and teardown remain required. No existing
credentials are automatically migrated. Deno destination/server participation,
client scheduling and integrated merge/restore remain in the full objective.

The owning API now qualifies `SyncHostServiceOptions.securityProvider` for
per-plugin native custody. It creates scoped crypto/identity/pairing/membership/
recovery capabilities only after permission checks and rechecks runtime validity
after asynchronous operations. Failed providers never select local custody;
undelegated Nostr credentials retain their existing location. Delegated plugins
reject local host enrollment/unlock entrypoints. Provider objects remain hidden.

Runtime revocation invalidates capabilities before draining provider cleanup.
The shared Plugin disable boundary awaits cleanup even after unload failure;
host disposal joins concurrent revocations and rejects new runtimes. Twelve
provider cases and 112 focused cases pass, as do all 862 API cases, root
check/test/build, specification/ownership gates and 243 fresh host stories.
The actual packed API consumer passes full source checks, 116 unit cases,
58 fresh stories and package build/publint with the existing integration skip.
The ignored exported consumer is now its own JJ repository so its VCS-aware
specification scanner sees its original source inventory. No validator changed.

The boundary is committed in the host workspace as `ef43ac28` (change
`tylrmqxt`); `2026-10-14-sync-security-provider.md` records exact evidence and
limitations. Audits, dependency ranges and committed lockfiles are unchanged.
Production native broker, admitted profile/runtime scopes, protected OS/server
wrapping material, renderer RPC and shutdown remain the next required work.
This boundary does not activate synchronization or reduce the remaining full
Deno/server/client, merge/restore, qualification and landing objective.

The desktop now selects the new Sync provider and routes its security operations
through a native broker bound to an admitted database profile lease and runtime.
Dedicated wrapped-key SQLite storage and an isolated OS credential namespace
keep wrapping/private bytes native while preserving the old Nostr credential
location. Raw key RPC, including a crafted legacy account alias, rejects access
to new Sync material. Explicit enrollment, serialized operations, guarded JSON
crypto/pairing/recovery, stable repeated database opens, uncertain-open retry
and drained teardown are qualified.

Sixty-two focused cases and the complete 257-case desktop suite pass with the
existing integration skip. Root check/test/build, specification and ownership
gates pass; a fresh host catalog passes all 243 interaction/accessibility
stories. A newly built local macOS app and the real database-worker smoke pass.
Separate frozen Deno processes exercise the production invoke dispatcher and
JSON adapter against actual macOS Keychain, preserving device identity and
decrypting prior ciphertext after restart. Generated acceptance credentials
are cleaned up. Two native endpoints also pair using the unchanged host-delivered
Nostr messages with distinct device keys.

The owning host is committed as `ace47828` (change `lxkqqsnx`), with scope and
limits in `2026-10-14-sync-native-security-broker.md`. Six new Deno lock references
name crypto versions already present; package versions, integrities, npm ranges,
pnpm lockfiles and advisory exceptions remain unchanged. A broader descriptor
type/lock-resolution issue reproduces with the parent database-host source and
is recorded separately; other-platform and registry-only qualification remain
open.

This wires desktop key custody, not the actual Sync runtime. Native file/state
bridges, dirty-buffer protection and legacy exclusivity, Deno destination and
server participation, client scheduling/reconnect, real merge/restore and the
remaining fault/consumer/landing/cleanup work remain in the full active goal.

The owning API now exposes optional `plugin.syncHost.local` capabilities through
host-selected providers. File, identity, generated-state and crypto grants are
checked before selection and after asynchronous results. Retained handles and
input/output streams follow runtime lifetime; local cleanup drains before key
custody. Mutations and receipt recovery require a host apply guard, with no
unguarded fallback. Supported-field capture accepts real file handles without
serializing read functions or allowing admission-time retargeting.

`NativeSyncLocalProvider` supplies that port from the existing native filesystem
kernel and separate engine/apply stores under an explicit inclusion policy.
It retains failed initialization resources until drained revocation and cancels
unused mutation sources before returning or releasing the API apply guard.
The retained-reader API and stale-target native regressions each move from one
failure to zero. Sixteen API and eight native cases pass; the four-file focused
API family passes 61 cases.

Root check/test/build and specification/ownership gates pass, including 878 API,
98 native-service, 257 desktop, 28 server and 55 Web cases, with the existing
desktop integration skip. A final fresh host run passes all 243 interaction/
accessibility stories. Both adapter and direct-kernel paired acceptance pass in
Node and frozen Deno, retaining independent device keys, bidirectional ancestry,
a 20 MiB attachment, interrupted apply and encrypted state. The copied ignored
Deno lock adds one reference to an already-present crypto version; no committed
lock, version, integrity or advisory exception changes.

The final packed API consumer passes source checks, 116 unit cases with its
existing integration skip, 58 fresh interaction/accessibility stories, build,
publint, specification and static build. Its six installed host/local/repository
runtime and declaration files match the qualified public build. The original
Nostr checkout remains clean. This retains the existing temporary Workspace
tarball/peer setup, not registry-only installation evidence.

The host boundary is committed as `51aa60c6` (change `xzryxtkp`), with full scope
and audit limits in `2026-10-14-sync-local-provider.md`. Desktop profile data RPC,
actual dirty-editor and legacy/new writer guards remain necessary before using
this adapter in the application. The live client runtime/scheduling, Deno
destination and server participation, integrated merge/restore, full remaining
fault/security/consumer qualification, landing and cleanup remain in the active
objective. This slice does not activate synchronization.

## Native data bridge and original operation authority

The desktop now shares one admitted opaque session between security and bounded
local data RPC. Captured descriptors survive page disposal and retain their
identity/generation guards. Multipart writes use owned handles outside the
working vault and verify complete staged bytes before commit. Duplicate requests
are idempotent; substitution, out-of-order data, changed authority, stale reads
and replaced roots reject. Ordinary symlink-root database startup remains
compatible while withholding Sync file admission.

The API snapshots supplied state/mutation/receipt authority before asynchronous
admission. The engine now forwards its original vault, device, key epoch and
membership generation to native commits and apply/recovery operations; progress
commits retain that operation's authority. Each host call receives an independent
projection so a receipt provider cannot retarget the later mutation. That exact
provider-input regression moves from one failure to zero. Two missing-fence regressions move
from failures to passes. Five admission/progress/provider-argument race cases preserve prior state
or the durable recovery intent. All 184 Sync tests in 14 files, package checks,
build/publint and 47 fresh Sync interaction/accessibility stories pass. The
124-file npm pack still excludes test support and imports without host/UI modules.

Separate frozen Deno processes run the packed engine through the actual desktop
dispatcher, JSON adapter, database worker and macOS Keychain. Write and read both
pass: identity, encrypted objects/state, guarded file receipts and the exact
signed offline revision/HEAD/object hashes survive restart. Reopening unchanged
files creates no second revision. Generated acceptance credentials are removed.

Host root check/test/build and specification gates pass, including the fresh
281-case desktop suite with its existing integration skip; 243 fresh host
interaction/accessibility stories pass. The original Nostr consumer against the
new packed API passes full checks, 116 unit cases with its existing skip,
58 fresh stories, build/publint and static build. Root plugin check/test/build and its
specification/ownership gates pass. Existing audit findings, npm ranges and
committed locks remain unchanged. The host's
`2026-10-14-sync-native-data-bridge.md` records commands, counts and limits.

The large native JSON fixture initially exceeded the unchanged test timeout
under the full desktop lane. Native typed-array base64 conversion now preserves
the exact portable wire representation and lets the unchanged 20 MiB target
pass in 785 ms in the standard host run. No fixture, assertion or timeout changed.

Actual all-editor dirty protection and exclusive writer selection, production
client lifecycle/actions/scheduling/reconnect, integrated merge/restore, Deno
destination and continuous server participation, remaining fault/security and
consumer/release qualification, landing and cleanup remain required. Wider
catalog and registry-only/platform limits remain separate. Neither this adapter
nor its acceptance activates application synchronization.

The owning native-data boundary is committed as `facb10ae` (change
`oksvvyxv`). The staging-parent redirection target moves from one failure to
zero; final desktop qualification passes 281 cases with its existing skip.
All 104 plugin release-tooling cases pass. The source stack remains in these
implementation workspaces until the full plan is qualified and landed.

## Workspace editor persistence

The owning API now serializes queued saves, captures the original persistence
destination and rejects stale/dirty file refresh. Its Sync flush discovers all
workspace-owned API editor leaves, deduplicates instances and drains every
captured save before returning an error. Mutation inputs are owned before apply
admission and canceled before rejected admission or key-custody teardown returns.

The host slice is committed as `e67eaae7` (change `twqyvnom`). Its 43 focused
cases and complete 902-case API suite pass, together with host check/test/build,
specification, 244 fresh interaction/accessibility stories and static build.
The original Nostr consumer against the new API pack passes checks, 116 unit
cases with its existing skip, 58 fresh stories, build/publint and static build.
The host's `2026-10-14-sync-editor-persistence.md` records evidence and limits.

The additional Mira workspace now qualifies a portable, optional editing-session
registration hook, committed as `4cddcaf3` (change `rlryplkp`). It protects and
drains independent embedded writers while retaining failed teardown saves for
explicit retry. Ten focused cases, 366 core cases, 157 fresh interaction/accessibility
stories and 49 fresh isolated Playwright cases pass. The 728-file public pack
excludes executable tests and passes the original Nostr consumer's checks, 116
tests, 58 fresh stories and builds. This is not yet wired into the Lapis adapter
or an application apply guard. Actual all-editor protection, external-owner async save
barriers and exclusive old/new writer ownership remain required. The production
default remains disconnected, and the Deno/server/client, merge/restore,
fault/consumer/landing/cleanup deliverables remain unchanged.

## App-owned independent writer admission

The host now exposes `App.fileEditingSessions`, a portable registry for writers
outside workspace leaf discovery. Canonical path registration, shared-session
deduplication, detached dirty-writer retention, protected-file rebinding refusal,
protection-before-flush and serialized callback admission are qualified. Matching
writers opened during admission or mutation reject synchronously so the owning
surface can disable editing. Failed saves and protection releases drain before
rejection; release failure retains its barrier until an explicit retry succeeds.
Shutdown closes new admission immediately, joins active work, rejects callbacks
still awaiting admission and preserves retryable cleanup.

The host slice is committed as `b14e4b70` (change `nszrxwrn`). Twenty focused
registry cases and 42 adjacent editor cases pass. Three admission/binding/order
regressions move from failures to passes. Root check/test/build, all 922 API
cases, specification/ownership and package/release gates pass; the cold host
catalog passes all 245 interaction/accessibility stories. The affected editor
family passes all 16 cases. Static Storybook renders the existing 172 chapters;
verification rows move within the existing ARCH pages without losing any ID.

Built declaration acceptance initially finds three missing-property errors
while source Storybook passes. The handwritten App declaration is corrected,
and API prepack now requires a persistent fixture against emitted public types.
The real packed API passes the original Nostr consumer's public type fixture,
checks, 116 unit cases with its existing integration skip, 58 cold stories,
build/publint, specification and static build. Six installed runtime/declaration
files match the verified output. Its existing ignored Mira and Workspace
validation overrides remain; this does not qualify registry-only installation.

The host's `2026-10-14-sync-file-editing-sessions.md` records commands, evidence
and completion limits. No encryption format, signed event, query semantics,
npm range, committed lock or visual baseline changes. Host audit remains
8 low, 39 moderate, 31 high and 3 critical. The fresh documentation-slice plugin
audit reports two moderate and one high finding; no dependency or ignore changes
are introduced by this record.

API editor and Mira adapter registration, external-owner asynchronous save
barriers, file/view switching/closing and application shutdown wiring still
remain. The registry is not selected as the production apply guard. Exclusive
legacy/new writer ownership, client scheduling/actions/reconnect, durable Deno
event/object APIs, independent protected server enrollment and continuous
participation, managed/external capture and origin suppression, merge/restore
and recovery, fault/security/real multi-device/consumer/platform qualification,
landing and workspace cleanup remain in the full active objective. The wider
195-pass/29-failure plugin catalog limit remains unresolved and separate.

## Registered API editor documents and protection

The host now registers original editor App/file/persistence contexts with the
public registry. File/owner/mode/writer rebinding drains the old debounce into
that original context; another document's success cannot clear its failure.
Destroyed or retired dirty contexts remain retryable and release registration
only after saving. `Editor.protect()` blocks ordinary typing, explicit writes
and rebinding, preserves native readonly state across reconfiguration, and
permits only controlled clean refresh without new persistence. Title editing
uses the same protection. An explicit external writer is captured and awaited;
unowned notification-only contexts fail protected admission and retain their
barrier after queued changes. Awaitable disposal drains retained work.

`TextFileView.save()` now uses the current Editor buffer and protection, rather
than writing stale cached view data independently. Its exact regression moves
from one failure to zero. Three original lifecycle regressions move from three
failures to passes, including an explicit second-file save before retrying the
first file. Raw file state preserves original handle identity and repairs four
intermediate notification regressions without changing their assertions.

The host slice is committed as `0fcdb5ae` (change `zkxrkuts`). Fourteen lifetime
cases and 56 adjacent cases pass; all 936 API tests and root check/test/build,
specification/ownership, public declaration and package/release gates pass.
All 246 cold host interaction/accessibility stories pass, including the entire
17-case editor family. The static build renders all 172 specification chapters.
The packed original Nostr consumer passes strict public type acceptance, checks,
116 unit cases with its existing integration skip, 58 cold stories,
build/publint, static build and specification. Six installed files match the
verified build; the helper is packaged and its executable regression excluded.

The host's `2026-10-14-sync-editor-document-lifetime.md` records exact evidence
and limits. Existing host and plugin audit findings, npm ranges, committed locks,
crypto/event/query formats and visual baselines remain unchanged.

Full view-loading and rename coordination, Mira adapter registration and
external domain-writer coverage, the scoped host flush port, application
shutdown, composed native/legacy apply protection and exclusive writer ownership
remain required before production apply selection. The Deno/server/client,
merge/restore/recovery, full remaining fault/security/multi-device/consumer and
platform qualification, main landing and workspace cleanup remain in the full
active objective. The wider 195-pass/29-failure plugin catalog limit is still
unresolved and separate. This slice does not activate application sync.

## Guarded editor loading and managed rename

The host now registers/protects asynchronous load targets before reading,
drains original document saves, and publishes file/content/extensions through
one protected boundary. Supersession, unload and destruction cancel publication
without waiting for obsolete readers; late read rejection remains observed.
Changed view/Editor App or target path rejects publication. Failed or canceled
publishers roll back the original binding and release provisional registration.
Guards wait for pending target loads, including failed/canceled reads.

Managed file/folder rename protects and flushes all registered sessions before
movement and link collection/rewrite. Failed saves, retargeted sources and failed
movement report failure and release protection. Folder descendants and source
link editors are included. Low-level Vault rename and complete multi-view/folder
rebinding remain separate integration work.

The host slice is committed as `5f672a5a` (change `qrwkzpqt`). Original loading
and rename targets move from four and two failures respectively to passes.
Two additional ownership/publisher cancellation cases move from failures to
passes. Final focused qualification passes 29 cases; all 957 API tests and root
check/test/build, specification/ownership and package/release gates pass.
All 247 cold host interaction/accessibility stories pass in four fresh shards,
including the 18-case editor family. Static Storybook renders 172 chapters and
passes six navigation/accessibility tests with its two live-only skips.

The packed original Nostr consumer passes strict public type acceptance,
checks, 116 unit cases with its existing integration skip, build/publint,
58 cold interaction/accessibility stories, static build and specification.
Six installed files match the verified build; regression fixtures remain outside
the pack. The governed loading/rename story's consumer Show Code is inspected
in the built Docs page. Its baseline stays visual-pending without a PNG capture.
The host's `2026-10-14-sync-editor-loading-and-rename.md` records the evidence.
Host/plugin audit findings remain unchanged, as do npm ranges, committed locks,
Nostr crypto/event/query formats and visual baselines.

Workspace navigation can still report an obsolete file-open completion.
Complete multi-view rename rebinding, Mira adapter registration, domain writers,
scoped host flush, App shutdown, composed native/legacy protection and exclusive
old/new Sync writer ownership remain required before production apply selection.
The full Deno/server/client, merge/restore/recovery, fault/security/multi-device,
consumer/platform qualification, main landing and workspace cleanup remain in
the active objective. The wider 195-pass/29-failure plugin catalog limitation
is separate and unresolved. This slice does not activate application Sync.
