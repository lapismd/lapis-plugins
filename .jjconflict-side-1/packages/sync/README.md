# Lapis Sync

Lapis Sync provides the retained Sync, History, File History and merge UI with
an injectable runtime, plus a headless Nostr-compatible protocol foundation for
Lapis Server. End-to-end encryption is mandatory; only enrolled endpoints may
read or mutate synchronized content.

The package remains private. Its default runtime checks real Deno protocol
and account access through the existing authenticated control plane. It never
claims that connection success means content is synchronized. Enrollment,
checkpoints, transfer and scheduling remain subsequent implementation slices.

`SyncPlugin` owns the workspace commands, status bar and declarative settings.
Hosts can provide a complete `SyncRuntime` through `SyncPluginOptions.createRuntime`; the
session checks endpoint authority, encryption and destination binding before
delegating actions. Ordinary plugin data stores only versioned provider
configuration, never keys, plaintext snapshots or recovery bundles.

The `./engine` export is headless and bundles its runtime dependencies for Node
and Deno. Hosts provide opaque encryption and signing operations; protocol code
never receives private keys. Signature verification is not membership authority
or proof that ciphertext has been decrypted and authenticated.

The engine now includes `LocalSyncEngine`, encrypted object graphs and retained
merge planners. `checkpoint()` saves history and its publication queue locally
without a network connection. `drain()` reuses those signed events and ciphertext,
uploads dependencies before the revision and HEAD, and retains staged or failed
work for retry. State uses authenticated `local-state` encryption and atomic
repository version checks. The repository must be durable user data outside
disposable indexes; ordinary plugin configuration is not a history store.

`ingestHeads()` authenticates and caches incoming ancestry before persisting
device tips. An explicit enrolled membership policy is required; signature
verification alone grants no authority. `reconciliation()` distinguishes clean
history, local edits, fast-forward, divergence and unrelated roots. Guarded
fast-forward persists an encrypted intent and recovers through host-owned,
durable idempotent mutation receipts without overwriting changed files.

`createMembershipHistoryAuthority()` evaluates host-verified, owner-authorized
membership against authenticated ancestry. It checks device revocation,
retired Sync Identity generation/cutoff limits and explicit legacy cutoffs.
Its membership callback must use the enrolled host capability, never provider
JSON or ordinary plugin settings. The host supplies installed epoch numbers
without exposing keys. Planning and apply recheck cached history under current
membership; checkpoint and incoming commits reject authority changes.

The owning host workspace supplies the new local-state crypto purpose and a
native SQLite repository. Production membership/epoch capability wiring, guarded filesystem
adapters, integrated merge/restore, automatic scheduling and the production
`SyncRuntime` adapter remain pending. The headless apply tests use a fixture
host; they do not qualify native working-file application.
See the [runtime continuation record](../../spec/records/2026-10-14-sync-runtime-continuation.md).

The shared Storybook contains `Plugins/Sync` placement, state, settings, shell
and review stories. `Plugins/Sync/Registry Screenshots` has a fixed banner and
five gallery views using the real shell with an explicit test-only runtime.
Their story IDs are declared in `registry.json`. From the repository root, run
`pnpm registry:media:capture -- --plugin sync`, then
`pnpm registry:media:check -- --plugin sync` to regenerate and verify light/dark
assets. Both commands also include Sync by default. Media preview selection does
not activate Sync for installation, packaging or release, and does not approve
visual baselines.

Use `pnpm check`, `pnpm test` and `pnpm build` in this package for the focused
lanes. The shared catalog uses published API 0.1.4, Design Core 0.3.4 and
Mira 0.0.5. Sync remains excluded from recursive workspace tasks; install its
own registry dependencies with `pnpm --ignore-workspace install --ignore-pnpmfile
--lockfile-dir ../../.release/sync-dependencies`. This separate registry install
does not use local host tarballs or activate Sync for release. The development
Svelte pin matches the API renderer contract.

See [qualification evidence](../../docs/sync-ui-qualification.md) for validation
and temporary dependency limits. Licensed under [Apache-2.0](LICENSE.md); see
[source attribution](NOTICE.md).

## Private connection review

Run `pnpm dev:sync` from this repository after building Source Editor and
Markdown. This opens a persistent local vault at `http://localhost:6080/`.
Start the existing Notes Deno server at `http://localhost:8797/`, sign in there,
and create a managed vault. In Sync Settings enter that URL, choose the managed vault by name,
then choose **Test connection**. The selected UUID has a truncated copy control. The localhost HTTP exception is host-only and
never saved in plugin configuration. No content is sent.

The private host proxies control-plane reads to that exact loopback origin;
account cookies stay HTTP-only. Normal deployments require HTTPS and an
authenticated host transport through `SyncPluginOptions.connection.request`.
