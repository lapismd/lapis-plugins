# Sync 1B-C: native account bridge checkpoint

Status: private bridge and Settings integration qualified, 15 October 2026.
The installed desktop-window journey remains pending; do not start enrollment
until that remaining 1B-C review boundary is complete. This is a bounded review
stop rather than activation or publication of Sync.

## Delivered

Notes owns profile-admitted account RPC, S256 handoff and protected credential
custody. The host chooses the stable `https://desktop.lapis.md` client origin so
native restarts do not depend on a temporary renderer port. It opens only the
validated approval URL and returns account presentation and allowlisted
connection/vault discovery data. It drains pending authorization on close,
revokes late cancelled grants and rejects competing or revoked profile leases.

The plugin selects this transport through the existing released API native
bridge and its owned App database vault ID. Explicit host adapters take
precedence. Server changes invalidate the old presentation and drain its native
session before replacement. Sign-out rejects late discovery responses; unchanged
account snapshots do not restart discovery. Unsupported older hosts show an
explicit account-unavailable state. Unload closes native authority and completes
other plugin teardown before reporting native cleanup failure.

The owning Notes source is committed locally as `437b9df4` on its preserved
private main stack; its handoff is
`spec/records/2026-10-15-sync-native-account-bridge.md`. No unrelated Notes
commits are pushed by this checkpoint.

No public API export, dependency version, shared-package release, encryption
contract, provider engine, default Notes plugin profile or release activation
changes. Browser review on port 6080 remains memory-only.

## Review and evidence

See `dev/sync/README.md` for the separate port-6081 native review and headed
Playwright command. The UI journey uses real server authorization, actual macOS
Keychain and fresh Deno account-host processes. It verifies sign-in, named-vault
selection, connection, native restart/restore and sign-out retained across a
second native restart. The driver supplies fixture profile admission and browser
launching; it does not impersonate a packaged-host acceptance result.

- Native host: seven account-bridge tests, plus the prior account/storage tests.
  One pending-start shutdown regression fails before repair and passes after.
- Plugin: five adapter tests and 205 package tests pass. One unchanged-state
  notification regression fails before repair and passes after; live acceptance
  caught its repeated discovery cancellation before repair.
- Existing browser sign-in acceptance passes, preserving its explicit adapter.
- All 19 affected Settings interaction/accessibility stories pass.
- Plugin check/build/publint, desktop check/build, native Deno typecheck,
  canonical spec/ownership and dependency audits pass under existing policy.
- Desktop has 320 passing tests and the existing controller-dependent skip.

The exact native UI target first failed while discovery was repeatedly cancelled.
The next run reached restored sign-in and sign-out, then exposed the distinction
between renderer reload and full native restart. The final target passes with
full native restarts as specified, including a separate cold Vite/frontend run
(1 passing journey, 1.4 minutes).
Screenshots are `/tmp/lapis-sync-native-account-signed-in.png` and
`/tmp/lapis-sync-native-account-restored.png`.

## Remaining boundary

The standalone desktop-window launch stops before Sync on
`@lapismd/ai-controller/managed` import resolution in the existing agent runtime.
No AI/runtime workaround or dependency change is included. Cold packaged/native
window review and its complete host admission remain unqualified, as do live
Linux custody and broader repository/release qualification. Renderer-only reload
also requires lifecycle qualification; competing native runtimes stay blocked.

Stop for manual review of this checkpoint. Keep the next work bounded to the
remaining native-window launch/integration evidence, then finish 1B-C before
moving to endpoint enrollment or content synchronization.
