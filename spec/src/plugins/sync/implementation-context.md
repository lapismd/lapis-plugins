# Lapis Sync implementation context

**Investigation baseline: 14 November 2026; historical context.** This
chapter records what survived the Deno migration and the decisions retained for
future work. The [implementation plan](implementation-plan.md) owns the new
delivery sequence; the [Sync contract](index.md) and verification retain current
requirements and qualification. Saving this context completes no product gate.

The corresponding [Desktop backlog](https://github.com/lapismd/lapis-desktop/blob/main/spec/src/backlog/lapis-sync.md)
owns Tauri intake and native acceptance. The linked future documents must be
landed in both repositories before those remote links become available.

## Current scope override: 17 November 2026

The user selected the [manual encrypted MVP](implementation-plan.md): two macOS
ARM64 Desktop devices and one authenticated ciphertext-only Server destination.
Decrypting server enrollment, managed working-vault/Web editing, automatic
operation, rich conflict/history/restore UI, rotation and expanded platform
qualification are deferred. Minimal conflict preservation, encrypted recovery,
writer protection, durable retries and safe apply remain MVP requirements.
The decisions and source inventory below describe the original full roadmap and
its dated investigation baseline; they do not override the new delivery scope.
Existing source qualification and parked/release status remain separate.

## Product decisions retained

| Decision             | Agreed direction                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity             | `@lapis-notes/lapis-plugin-sync`, runtime ID `sync`, display name Lapis Sync; Apache-2.0 with retained attribution                                   |
| First destination    | `lapis-server`; one configured destination per local vault, multiple enrolled devices                                                                |
| User outcome         | Offline Desktop editing and history, followed by bidirectional synchronization with an editable managed server vault                                 |
| Server trust         | An explicitly enrolled endpoint with its own device identity can decrypt and edit content; server Web sessions edit that working vault               |
| Encryption           | Mandatory authenticated encryption before provider transport/storage; no plaintext mode or downgrade                                                 |
| Separate authorities | Account authorization, endpoint enrollment, transport access, content keys, owner authority and recovery remain distinct                             |
| Native engine        | Pure Rust Sync algorithms in the Plugins-owned native services; shared fixtures compare complete outcomes with the retained TypeScript engine        |
| Native lifetime      | Server-owned shared application services own durable work, stores, scheduling and participant lifetime; Desktop owns Tauri/OS adapters and admission |
| Installation         | Optional, disabled by default, after qualification; the current package remains private and parked                                                   |

The enrolled server is trusted to read its working vault and decrypted indexes.
Encryption protects synchronized records between authorized endpoints and in
the object repository; it does not hide content from that endpoint. Account
password reset alone cannot recover vault keys.

Lapis Sync, the separate `lapis-plugin-nostr-sync` repository/runtime identity,
the standalone History plugin and Desktop's Git backup/pull/merge/push retain
their distinct roles. No automatic migration, identity replacement or conversion
of Git checkpoints into Sync revisions is planned in this first scope.

## Current source and gaps

| Area                        | Existing foundation                                                                                                                              | Remaining boundary                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `packages/sync`             | Protocol codecs, encrypted object graph, local checkpoint/outbox, ancestry and membership policies, guarded-apply foundations and retained UI    | No complete production runtime; private, excluded from installation and release; tests/stories parked          |
| `lapis-notes/packages/api`  | Scoped identity/change cursors, guarded I/O, generated state, origin/network grants, crypto, pairing, membership, recovery and editor protection | Current native consumer selection and complete Sync writer qualification                                       |
| Notes Deno desktop/services | Dedicated stores, wrapped keys/Keychain custody, admitted security/data RPC, guarded filesystem and durable receipts                             | Frozen Desktop reference; earlier acceptance does not qualify Tauri/Rust                                       |
| `lapis-desktop`             | Generic API SyncHostService construction/disposal, editor registry and native application infrastructure                                         | No installed Sync plugin, native Sync security/local provider, engine integration or scheduler                 |
| Old Deno server             | Account authorization/handoff, managed-vault discovery and connection review                                                                     | Durable destination and continuously operating Sync participant were unfinished                                |
| `lapis-server`              | Hosted managed vaults, authenticated access and shared Rust application services                                                                 | Sync-specific authorization integration, enrollment, event/object repository, destination APIs and participant |

Reusable source is authoritative for diagnosis, but public dependencies are
consumed through semver releases or the documented private archive workflow.
An installed package, a lockfile version, source qualification and native
consumer adoption are separate observations; this investigation does not claim
that every current installation contains the latest source.

### Retained source map

- Plugin `src/protocol`, `src/objects` and `src/runtime` own signed records,
  encrypted snapshots, persistent publication, incoming ancestry and authority.
- Plugin `src/presentation/types.ts` defines `SyncRuntime`, its snapshots and
  actions. `SyncPluginOptions.createRuntime` is the explicit injection point.
  The default runtime only checks connection/access; success grants no content
  authority or synchronization completion.
- Plugin `src/presentation/native-account.ts` adapts the existing native account
  bridge. Its presence is not evidence that Tauri implements that bridge.
- API `sync-host.ts`, `sync-host-security.ts`, `sync-host-local.ts` and
  `sync-repository.ts` own generic host contracts. Public
  `@lapis-notes/api/sync-security-host` and `./sync-repository` are retained.
- API `file-editing-sessions.ts` and `sync-editor-flush.ts` supply writer
  admission/protection and workspace-editor flushing; full Sync guard selection
  still requires all admitted writer types and host lifecycle integration.
- Notes `packages/deno-host-services/src/sync-*` and
  `packages/desktop-deno/src/{deno-sync-*,sync-*-protocol.ts}` retain native
  storage/filesystem and renderer bridge references. Native broker/account
  source remains under `packages/desktop-deno/src-deno`.
- Plugins `crates/lapis-plugin-services` is the existing home for pure native
  plugin algorithms. Sync algorithms are planned there, not implemented today.
- Desktop `NotesWorkspace.svelte` constructs the ordinary App and disposes its
  generic Sync service. Its plugin inventories omit Lapis Sync. Git repository
  synchronization elsewhere in Desktop does not supply the missing service.

The old Deno server source was retired from the current Notes tree; ignored
build/node_modules directories are not current implementation. Retrieve exact
historical files through repository history. Do not revive the frozen Desktop
or treat development review hosts as production acceptance.

## Historical provenance

| Record or revision                                                                                   | What it establishes                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [12 October implementation plan](../../../records/2026-10-12-lapis-sync-deno-plan.md)                | Original full scope, encryption/trust decisions, protocol, provider and fault matrix; Deno was then the intended host         |
| [14 October incremental plan](../../../records/2026-10-14-sync-incremental-delivery-plan.md)         | Reviewable connection/enrollment/manual/automatic milestones; later records refine its initial status                         |
| [14 October runtime continuation](../../../records/2026-10-14-sync-runtime-continuation.md)          | Source ledger and qualification for checkpoints, authority, native stores/receipts and writer protection                      |
| Notes merge `967a92fb123c`                                                                           | Landed reusable Sync host and editor persistence contracts; production apply remained disabled                                |
| Notes native custody `ace47828b0b1`                                                                  | Deno profile admission, wrapped security store, isolated OS namespace, JSON security RPC and Keychain restart evidence        |
| Notes data bridge `facb10aef06b`                                                                     | Deno bounded native data RPC, captured authority, persistent encrypted state and guarded receipts                             |
| [15 October main landing](../../../records/2026-10-15-sync-stage-0c-main-landing.md), `7cce83e7864b` | Retained plugin engine/UI source landed; stage-0 prerequisites were reconciled, not still waiting to land                     |
| [15 October account checkpoint](../../../records/2026-10-15-sync-slice-1c-native-account-bridge.md)  | Private real-server/Keychain Settings integration; packaged native-window and broader platform acceptance remained incomplete |
| [12 November independent audit](../../../records/2026-11-12-sync-audit-refresh.md)                   | Parked Sync dependency repair; no activation, test restoration or publication                                                 |

Notes revisions are inspectable in the `lapis-notes` repository. Its
`spec/records/2026-10-14-sync-host-release.md`,
`2026-10-14-sync-native-security-broker.md`,
`2026-10-14-sync-native-data-bridge.md` and
`2026-10-15-sync-native-account-bridge.md` retain owning-host evidence.

Historical workspaces named `lapis-plugins-sync-runtime`,
`lapis-notes-sync-runtime` and `mira-sync-runtime` were retired after preservation
and landing. Earlier pending-main statements, old dependency versions, ports,
runtime assumptions and failures describe their recorded revisions. In
particular, the old packaged-window import failure is an unresolved historical
acceptance attempt, not a reproduced current Tauri defect. Preserve every
original record; this new plan replaces the Deno delivery direction for future
native implementation without rewriting its evidence.

## Evidence observed on 14 November

These results were obtained during the investigation immediately preceding this
documentation slice; product suites are not rerun merely to save the plan.

| Boundary and exact command                                                 | Observed result                                               | Limit                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Notes: `pnpm --dir packages/api exec vitest run` with the nine files below | 9 files, 85 tests passed                                      | API source contracts only                                       |
| Sync package: `pnpm test`                                                  | 18 files collected, all 205 tests skipped                     | No current functional pass; the unfinished setup calls `skip()` |
| Sync package: `pnpm check`                                                 | Engine TypeScript and Svelte checks passed, 0 errors/warnings | Compilation does not prove runtime/native behavior              |

The nine API targets under `packages/api/src/lib/__tests__` were
`sync-editor-flush.test.ts`, `sync-host-disposal.test.ts`,
`sync-host-local-provider.test.ts`, `sync-host-plugin-harness.test.ts`,
`sync-host-security-provider.test.ts`, `sync-host-security-store.test.ts`,
`sync-host-startup-ordering.test.ts`, `sync-host.test.ts` and
`browser-sync-security.test.ts`.

Notes was clean at `c433fe84` (parent `de786386`); Plugins was clean at
`d927d877` (parent `a76d286a`). Desktop had unrelated work at `d24cbd57`
(parent `ea80efee`); Server had unrelated work at `ae70b617` (parent `8896e9ee`).
Those are investigation snapshots, not new qualified release coordinates.

Sync's present `sync-unfinished.setup.ts`, story tags and workspace/release
exclusions remain unchanged. Historical 184/205-test and 47/19-story passing
receipts retain their source boundaries; neither they nor the current skipped
run qualify native Rust algorithms, Tauri custody, the Rust destination or
two-device convergence. The [documentation receipt](../../../records/2026-11-14-sync-future-plan.md)
records only the checks used to save this plan.
