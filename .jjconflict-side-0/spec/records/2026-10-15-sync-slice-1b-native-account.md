# Sync 1B-B: protected native account checkpoint

Status: implemented for native review, 15 October 2026. Plugins PR #21 passed
all nine checks and merged as `0ea393e6` before this slice began. Both main
workspaces were checked against their GitHub remotes; unrelated local Notes
history remains preserved.

## Delivered in Notes

The private desktop host owns a server-account session service using the
existing OS credential backend in a separate namespace. Credentials bind the
local profile, exact server origin and client origin. Restores verify the
current server account before authenticated requests become available. Offline
failure preserves the credential for retry; expired/revoked sessions remove it.
Sign-out revokes and erases, and failed cleanup stays retryable. Ordinary close
preserves protected restart state while cancelling requests and rejecting late
results. No published API, dependency, plugin activation or E2EE contract changes.

Notes owns the implementation and canonical LN-DENO-095 through LN-DENO-097.
The main-workspace source commit is `816dd426` (Jujutsu change `omumqwzx`).
Its source handoff is `spec/records/2026-10-15-sync-native-account-session.md` in
the main `lapis-notes` repository. This checkpoint remains private/local;
production renderer/profile admission and any shared-contract release are not
claimed here.

## Review

From the main Notes repository with the existing isolated Deno server on port
8797, run:

```sh
deno run --no-config --quiet -A packages/desktop-deno/scripts/accept-server-account.mjs
```

The command reads the existing review password file, authorizes only its unique
fixture profile, passes tokens through stdin, and cleans up its issued sessions
and OS entries. It preserves ordinary vaults and browser sessions. Inspect
`.local/sync-server-account-review.json`: ten fresh Deno processes demonstrate
protected save/restart, profile/client/server isolation, sign-out and server
revocation cleanup using actual macOS Keychain and the real server.

Eleven lifecycle cases plus credential/legacy secure-store regressions pass:
31 focused tests. The complete owning desktop package has 313 passing tests and
one existing environment-dependent AI-controller skip. Package check/build,
native Deno typecheck, canonical specification/ownership gates and dependency
audit pass. Linux has command-contract evidence; live Linux, packaged desktop,
full repository and broader release qualification remain deferred.

## Next review boundary

The private browser app at `http://localhost:6080/` still keeps its account in
memory. Checkpoint 1B-C connects this native service to admitted host lifecycle,
browser authorization and the reviewed Sync Settings UI. Its manual result is
the actual client retaining sign-in after restart and clearing connection/vault
state on sign-out, destination change or revocation. Release any required public
contract before consumer integration. Stop here for review before that work.
