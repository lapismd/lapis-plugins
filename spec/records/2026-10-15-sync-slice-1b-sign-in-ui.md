# Sync 1B-UI: private sign-in Settings checkpoint

Status: implemented for review, 15 October 2026. The user prioritized a visible,
working Settings flow before protected credential persistence. Full Remote
sign-in and session lifecycle remains incomplete.

## Working now

The built private Sync plugin shows **Server account** in Settings. Sign in
starts an authorization request; **Open server sign-in** opens the configured
Deno server's existing login and explicit client consent. The client then shows
the account, discovers named managed vaults and allows **Test connection**.
Waiting requests can be cancelled; signed-in accounts can sign out. Expiry,
rejection, offline and unavailable-host states explain the next action.
Account guidance uses the shared smaller settings-description typography and
muted colour; errors retain their error colour.
Account actions use the existing icon set for sign-in, opening the server page,
cancellation and sign-out alongside their text labels.

The private host owns the verifier and bearer credential in memory. Settings
receives only an allowlisted presentation snapshot. Requests cross origins
directly with explicit bearer authorization and omitted cookies; the old
development cookie proxy is removed. Sign-out and account changes invalidate
connection health and abort or discard stale vault discovery. Server changes
cancel the old handoff and prevent credentials crossing destinations. Late
grants are revoked. Failed sign-out retains the session for retry.

Reload requires sign-in again while retaining local notes and non-secret plugin
settings. Account authentication supplies no E2EE keys or device membership;
content synchronization remains disabled. This changes no published host API,
activates no release and preserves the existing Nostr message/encryption model.

## Review

Use the main `lapis-plugins` workspace and its existing private OPFS app at
`http://localhost:6080/`; Deno is `http://localhost:8797/`. Start the host with
`pnpm dev:sync`; the complete preserved-data launch instructions are in
`dev/sync/README.md`.

1. Open **Settings → Lapis Sync**, set the server URL, and choose **Sign in**.
2. Open server sign-in, use the existing account, and review/approve the named
   client and origin. Return to Sync Settings to see the account and vault names.
3. Choose a vault and test the connection. Enable sync remains disabled.
4. Sign out: vault access and connection health clear. Alternatively cancel a
   waiting request, or reload to see the memory-only session boundary.

The Settings Storybook stories **AccountSignIn**, **AccountWaiting** and
**AccountExpired** use explicit fixtures. They demonstrate UI states separately
from the real Deno journey. Stories remain `visual-pending`; no baselines or
registry assets changed.

## Evidence

- Exact new account-source regression: one failure before the fix, zero after.
  `pnpm --dir packages/sync test` passes 200 tests in 17 files, including stale
  connection invalidation and account discovery/presentation regressions.
- `pnpm exec vitest run --config dev/sync/vitest.config.ts` passes five private
  host tests: bearer isolation, cancellation/late grants, failed revocation,
  server changes and account-detail loading cancellation.
- All eight Sync story families pass: 57 interactions/accessibility checks.
  The first concurrent run had two startup timeouts; both exact reruns and the
  complete serial run pass. The three account stories also pass independently.
  Final guidance checks pass all 19 Settings stories. New per-icon imports
  initially triggered a Vite optimization reload and three account failures;
  account actions now compose the existing shared WorkspaceIcon component.
  The exact three account stories pass after that change, with zero unhandled
  errors.
- Sync check, build and publint/npm-pack pass. The private host Svelte/TypeScript
  check reports zero errors or warnings. Specification/App-ownership,
  no-Tailwind and package-boundary checks pass. Dependency audit exits zero
  using existing recorded exceptions; no exception was added.
- `pnpm exec playwright test -c dev/sync/playwright.config.ts` passes the real
  separate-origin Deno journey from a fresh Vite process: cancel, sign in,
  approve, show account, select vault, test connection, sign out and reload.
  It uses an isolated browser context and the existing loopback review fixture;
  it never prints credentials or resets development data.

The first cold host launch exposed the Turso worker startup failure
`Cannot read properties of undefined (reading 'whenLoaded')`. The private host
now excludes the driver's `/vite` entry from optimization and mirrors Notes'
existing scoped Turso 0.7.2 compatibility pins: WASM runtime 1.0.7 resolves both
emnapi packages to registry version 1.8.1. The narrow frozen lockfile update
restores real startup; it adds no local source dependency or new package patch.

Broader repository/release qualification is deferred under the incremental
delivery plan; the focused evidence above does not represent those lanes.

## Next review boundary

Stop here for UI review. Checkpoint 1B-B adds protected destination-bound host
credential persistence, restart, expiry and revocation cleanup. Checkpoint
1B-C integrates the reviewed UI and host transport into production applications.
Any required shared contract must be released before consumer integration.
Endpoint enrollment and encrypted content transfer remain later slices.
