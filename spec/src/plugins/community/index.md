# Community Plugin

`@lapis-notes/community` is the first-party Lapis Notes workspace integration
for the public `CommunityApplication` from `@lapismd/lapis-community`. The
plugin deliberately does not own registry browsing or installation; those
surfaces remain in the host plugin screen.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-COM-001 | The repository MUST ship `@lapis-notes/community` at `packages/community` with runtime id `community`, `distribution: "first-party-external"`, and a normal published `@lapismd/lapis-community` semver dependency.                                                                                                                                                                                                                             |
| LN-COM-002 | The plugin MUST register one `community` main-workspace view, an `open-community` / `Open Community` command, and a leading `messages-square` ribbon action. Opening MUST reveal an existing view or create and activate a new main leaf.                                                                                                                                                                                                       |
| LN-COM-003 | The view MUST mount the public `CommunityApplication` without `registryOptions`, so it renders community channels, forums, direct messages, and settings but never registry discovery or installation UI.                                                                                                                                                                                                                                       |
| LN-COM-004 | Production Community sessions MUST use the WebSocket NIP-29 source, browser event runtime, disposable relay-derived state, public-room discovery, and locally configurable `wss://community.lapis.md` default scope. They MUST NOT add an authoritative database or HTTP submission path.                                                                                                                                                       |
| LN-COM-005 | Identity selection MUST use `app.nostr.forPlugin("community")`. Stored local and NIP-46 accounts MUST appear as opaque choices; new profiles and remote-signer invitations MUST be delegated to the host; event signing and NIP-44 MUST call only opaque account operations; and view teardown MUST close the selected host session. The plugin MUST NOT receive, persist, or log a secret key, bunker invitation, or NIP-46 client credential. |
| LN-COM-006 | Account creation and NIP-46 MUST be available in the Community login dialog, existing host accounts MUST be reusable, raw private-key import MUST remain absent, and public community browsing MUST remain available while signed out.                                                                                                                                                                                                          |
| LN-COM-007 | Storybook MUST exercise the real public plugin application with deterministic NIP-29 data, prove the Registry destination is absent, and show the host-owned identity choices. New visuals MUST remain `visual-pending`.                                                                                                                                                                                                                        |

## Runtime flow

```text
Community view
    -> CommunityApplication (no registry provider)
    -> NIP-29 relay source

protected action
    -> app.nostr.forPlugin("community")
    -> host permission and OS keychain or NIP-46 signer
    -> signature or NIP-44 result only
```

The relay is transport and shared storage, not the trust root and not a private
credential store. The plugin does not inspect host keychain records or remote
signer client keys.
