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
4. Sign in at `http://localhost:8797/` and create a managed vault. Enter that
   URL in **Settings → Lapis Sync**, select the managed vault by name, then
   **Test connection**. Use the refresh icon to reload the list; the UUID below
   the picker copies its full value.
5. Stop Deno and test again to see the unavailable state. Restart it and retry.
   Reload the client to check saved settings and note content.

The optional `VITE_SYNC_REVIEW_SERVER_URL` environment setting selects a single
literal loopback origin for the development proxy. It must have no credentials,
path, query or fragment. The HTTP policy is host-only and is never saved in
plugin data. Deno authentication stays in its HTTP-only cookie. Connection
checks query protocol/account access only; no keys, enrollment, snapshots or
file content are transferred. Other Sync operations remain disabled.

Check this host with `pnpm exec svelte-check --tsconfig dev/sync/tsconfig.json
--fail-on-warnings`. TypeScript uses the same released API identity that Vite
selects through host deduplication.
