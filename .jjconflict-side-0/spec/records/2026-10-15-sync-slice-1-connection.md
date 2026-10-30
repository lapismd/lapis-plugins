# Sync slice 1: real Deno connection

15 October 2026. Ready for manual review. Slice 2 is not started.

## Delivered boundary

The private Sync plugin defaults to a connection-only runtime. **Test connection**
queries the existing Deno `system.info` and authenticated `vault.open` control
plane. Protocol 1 and owner/editor vault access are required. Healthy account
access does not imply enrolled keys, accepted history or synchronized files.
Enable Sync, checkpoint, pairing, recovery and transfer remain unavailable.

No shared dependency, server protocol, registry selection or package release
changed. Existing Deno authentication uses its HTTP-only session cookie. The
plugin persists only its existing versioned destination/settings data. The host
may supply its authenticated transport; no password or cookie enters plugin data.

The private development app in `dev/sync` uses built plugin entrypoints,
released host packages and a persistent OPFS vault. Its single-origin loopback
proxy makes real Deno account access reviewable without adding a production
cross-origin authentication protocol. HTTPS remains mandatory by default; the
review host explicitly allows literal loopback HTTP without persisting that
policy. Server content storage and server enrollment are later slices.

## Running review

- Main Plugins checkout: `pnpm dev:sync`, client at `http://localhost:6080/`.
- Main Notes checkout: existing Deno process at `http://localhost:8797/`.
- Isolated Deno data: `lapis-notes/.local/sync-connection-review`.
- Isolated client vault ID: `sync-connection-review`, in this origin's OPFS.
- Managed destination UUID: `8f7376e7-c2b9-4a5b-8a65-0c993dc09e59`.
- The local fixture account is signed in. Bootstrap password file is outside
  the repository at `/tmp/lapis-sync-slice1-password`; no credential is committed.
- Restart/setup instructions: `dev/sync/README.md` and the owning Notes
  `packages/server-deno/README.md`. Normal app origins and development data
  were preserved; Notes source remains unchanged.

The review host compiles Design Core's stylesheet through Tailwind **after**
the Svelte transform and uses the public Lapis theme. The omitted compiler in
its initial setup caused serif fallback and incomplete base styling; this is
fixed in the host. The resolved body font is DM Sans Variable. No shared CSS,
component implementation or visual baseline was changed.

## Focused evidence

| Boundary                                                                  | Result                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| New connection suite before implementation                                | 1 missing-module suite failure; 184 existing tests passed                      |
| `pnpm exec vitest run src/presentation/server-connection.test.ts` in Sync | 9 passed, 0 failed                                                             |
| `pnpm test` in Sync                                                       | 15 files, 193 passed, 0 failed                                                 |
| Settings `Real Connection Adapter` interaction                            | 1 passed, 0 failed; deterministic transport fixture, not live-service evidence |
| All directly affected Sync Storybook families                             | 8 files, 53 passed, 0 failed; interaction/accessibility assertions retained    |
| Sync `check`, `build`, `publint`                                          | Passed; 0 Svelte errors/warnings                                               |
| Private host `svelte-check`                                               | Passed; 0 errors/warnings                                                      |
| `pnpm spec:check` and App ownership                                       | Passed; validate, mdBook and mapped spec-first                                 |
| `pnpm audit`                                                              | Exit 0 with existing documented exceptions; no exception added                 |

Runtime cases cover success, 401/403 rejection, viewer/mismatched vault/protocol,
network and HTTP service outage, retry, unsafe URLs, stale settings, bounded bad
responses, deadline and disposal. Requests refuse redirects, have a ten-second
default deadline and a 32 KiB response limit. Server error bodies are not shown.

Live browser acceptance used the real Deno process and persistent client:

- Owner access to the created managed vault succeeds.
- An ungranted valid vault UUID returns the access-denied message.
- Stopping Deno gives an unavailable result through the proxy; restarting the
  same process/data and retrying restores healthy account access.
- Settings survive reload and prior healthy state is not persisted as authority.
- A normal Markdown note remains editable and saves locally across reload.
- Connection success leaves Enable Sync and enrollment/content actions disabled.
- Fresh Vite startup verifies the corrected shared styles and fonts.

Review screenshots are `/tmp/lapis-sync-slice1-editor.png` and
`/tmp/lapis-sync-slice1-settings.png`. Temporary diagnostic logs are under
`/tmp/sync-slice1-*.log`. A complete catalog,
platform/browser matrix, native lifecycle, release archive/signature and live
content-sync qualification remain deferred under the incremental plan. This
private connection slice does not waive those release gates or activate Sync.

## Next review stop

Review the running app and approve this slice before starting slice 2, real
endpoint enrollment. The next slice must use protected independent endpoint
keys and the existing enrollment protocol; account access alone grants none.
