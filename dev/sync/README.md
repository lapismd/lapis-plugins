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
   choose **Sign in**, then **Open server sign-in**. Sign into the server and
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
