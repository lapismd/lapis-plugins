# Sync 1B-A: server authorization checkpoint

Status: implemented in the main Notes workspace for private manual review,
15 October 2026. Full Remote sign-in and session lifecycle remains incomplete.
Plugins PRs #16 and #17 are merged with all nine CI jobs passing on each.

## Delivered in Notes

The private server and Web host now provide a five-minute, S256-bound client
authorization request, existing account sign-in, explicit named-client/origin
consent, and a one-use bearer-session exchange. Account sessions discover only
vaults permitted by existing memberships. Cookie and client bearer credentials
cannot substitute for one another. Client logout leaves the approving browser
session active. No Sync keys or enrollment authority are released.

Server regressions cover denial, cancellation, wrong proof/origin, expiry,
concurrent exchange, restart, replay, and revocation during issuance. A real
cross-origin browser journey covers approval, account/vault discovery and
sign-out without third-party cookies. The existing server edit/share/import/
restart/logout journey still passes.

Notes evidence: `spec/records/2026-10-15-sync-client-sign-in-server-checkpoint.md`.
Server typecheck and 37 tests pass; Web check, 55 unit tests and final server
build pass; focused cross-origin browser acceptance passes and the complete
server lane passes both journeys. Canonical specification, App-ownership and
metadata-query gates plus 38 governance tests pass. Broader release
qualification and visual approval remain deferred.

## Review

- Deno review server: `http://localhost:8797/`, retaining its existing private data.
- External client probe: `http://127.0.0.1:61319/?server=http%3A%2F%2Flocalhost%3A8797`.
- Restart the probe from Notes with
  `node packages/server-deno/scripts/review-client-sign-in.mjs http://localhost:8797`.

Start sign-in, open the server link, approve or reject, inspect accessible vault
names and sign out. The development probe keeps its credential in memory and
is excluded from production static assets.

## Remaining

Stop for review. Checkpoint 1B-B adds protected, destination-bound host storage
and restart/expiry/revocation cleanup. Checkpoint 1B-C connects that host
transport to installed Sync Settings and verifies the full client journey.
Any required shared contract must be released before plugin integration.
Endpoint enrollment and content transfer remain later numbered slices.
