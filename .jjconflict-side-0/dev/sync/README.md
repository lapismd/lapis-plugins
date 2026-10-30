# Private Sync connection review

This development host loads the built private Sync plugin and released host
packages. Notes and plugin settings persist in the browser's OPFS storage at
`http://localhost:6080/`. The existing apps on other ports retain their data.

Sync remains outside the recursive release workspace. Install its private
registry dependencies before the first build:

```sh
pnpm --dir packages/sync install --ignore-workspace --ignore-pnpmfile --lockfile=false --no-frozen-lockfile
```

The review requires released Design Core 0.3.5 for controlled pairing header
actions and file-input sizing. `--ignore-pnpmfile` leaves local hooks unchanged
while avoiding development tarball remaps during registry validation.

1. Build Source Editor and Markdown once with
   `pnpm --dir packages/source-editor build` and
   `pnpm --dir packages/markdown build`.
2. Start the existing Deno server from Notes using its
   `packages/server-deno/README.md` instructions, with an isolated data root,
   `LAPIS_SERVER_PORT=8797`, `LAPIS_SERVER_ORIGIN=http://localhost:8797` and
   the development-only insecure localhost cookie setting. Build its server
   web UI first. Native Turso requires the dependency environment names listed
   in that package's Dockerfile as well as access to the Deno dependency cache.
3. Run `pnpm dev:sync` here. The host compiles the public Design Core stylesheet
   with Tailwind after the Svelte transform, matching the main application's
   plugin order. Fonts come from that shared stylesheet.
4. Enter the server URL in **Settings → Lapis Sync**. In **Server account**,
   choose **Sign in** to open server sign-in immediately. If the browser blocks
   the new window, open or copy the approval link shown underneath the account
   guidance, or use **Open server sign-in**. Sign into the server and
   explicitly approve **Lapis Notes Sync** for the displayed client origin.
   Return to Settings to see the signed-in account and accessible vaults.
   Choose a vault by name, then **Test connection**. The server needs at least
   one managed vault; create one in its ordinary vault chooser if necessary.
   The refresh icon reloads names; the UUID below the picker copies its full value.
5. Stop Deno and test again to see the unavailable state. Restart it and retry.
   Reload the client to check saved settings and note content.

Use **Cancel sign-in** while waiting or **Sign out** after approval. The private
host retains its account credential only in memory, so reloading signs this
client out while preserving local notes and non-secret settings. Protected
credential persistence and production desktop-host integration remain later work.
Server changes clear the account and discovered vaults and invalidate connection
health. Account access does not enable encrypted device enrollment or sync.

The optional `VITE_SYNC_REVIEW_SERVER_URL` environment setting controls the
header's server link. Settings chooses the actual account destination. HTTPS
is required outside literal loopback development origins; use a server origin
without credentials, a path, query or fragment. All account and connection
requests cross origins directly with explicit bearer authorization and omitted
cookies. There is no development authentication proxy.

The host excludes Turso's `/vite` driver from dependency optimization, matching
the main Web host, so the driver's worker initialization remains intact. The
root lockfile also mirrors Notes' scoped Turso 0.7.2 compatibility pins: WASM
runtime 1.0.7 uses emnapi core and runtime 1.8.1 from npm.

Focused checks, with the private app and review Deno already running:

```sh
pnpm exec vitest run --config dev/sync/vitest.config.ts
pnpm exec playwright test -c dev/sync/playwright.config.ts
```

Live acceptance reads the isolated review account's existing password file from
`LAPIS_SYNC_REVIEW_PASSWORD_FILE` (default `/tmp/lapis-sync-slice1-password`),
requires literal loopback origins and uses a fresh browser context. It never
prints credentials or resets an existing vault.

Check this host with `pnpm exec svelte-check --tsconfig dev/sync/tsconfig.json
--fail-on-warnings`. TypeScript uses the same released API identity that Vite
selects through host deduplication.

## Native account bridge review (1B-C checkpoint)

The default plugin now uses the released API native bridge when one is present.
The native host owns S256 authorization, the OS credential record, authenticated
reads and profile admission. Its stable client origin is
`https://desktop.lapis.md`; renderer loopback ports are not credential scope.
The ordinary browser review above keeps its explicit memory-only adapter.

For the isolated native-process/UI acceptance, start a separate review frontend:

```sh
VITE_SYNC_NATIVE_REVIEW=true pnpm exec vite --config dev/sync/vite.config.mjs --port 6081 --strictPort
```

With the existing loopback Deno review server, run:

```sh
LAPIS_SYNC_NATIVE_HOST_DRIVER=../lapis-notes/packages/desktop-deno/scripts/server-account-review-process.ts pnpm exec playwright test -c dev/sync/native-playwright.config.ts --headed
```

Use an absolute driver path if running outside the Plugins repository. The
acceptance creates an isolated OPFS profile, starts the real Notes account host
in independent Deno processes, uses actual macOS Keychain and server approval,
then verifies named-vault connection, native-process restart and sign-out across
another restart. Profile admission and browser launching are fixture adapters;
this does not qualify the packaged desktop window or other platforms. Full
client restart includes the native process; a renderer-only reload does not
retire an admitted native runtime. Existing profile admission rejects competing
runtimes rather than replacing their account sessions.

A standalone desktop-window attempt currently stops before Sync on the existing
AI-controller managed-import resolution. Track that host launch separately;
keep enrollment, content transfer, plugin release activation and visual
baselines outside this checkpoint.
