# Community Plugin

`@lapis-notes/community` is the first-party Lapis Notes workspace integration
for the public `CommunityApplication` from `@lapismd/lapis-community`. The
plugin adds the registry as a Community destination while retaining the host
plugin screen as the installation surface available before Community loads.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-COM-001 | The repository MUST ship `@lapis-notes/community` at `packages/community` with runtime id `community`, `distribution: "first-party-external"`, and a normal published `@lapismd/lapis-community` semver dependency.                                                                                                                                                                                                                             |
| LN-COM-002 | The plugin MUST register one `community` main-workspace view, an `open-community` / `Open Community` command, and a leading `messages-square` ribbon action. Opening MUST reveal an existing view or create and activate a new main leaf.                                                                                                                                                                                                       |
| LN-COM-003 | The view MUST mount the public `CommunityApplication` with registry options derived from the host's enabled plugin-distribution sources. It MUST prefer a valid configured Nostr source, fall back to the enabled HTTP registry, and delegate install requests to `app.pluginDistribution`; the host plugin screen MUST remain available before Community loads.                                                                                |
| LN-COM-004 | Production Community sessions MUST use the WebSocket NIP-29 source, browser event runtime, disposable relay-derived state, public-room discovery, and locally configurable `wss://community.lapis.md` default scope. Its registry destination MUST use Community's public registry data sources with the host-pinned relay, curator, and quorum configuration, and MUST NOT add an authoritative database or HTTP submission path.              |
| LN-COM-005 | Identity selection MUST use `app.nostr.forPlugin("community")`. Stored local and NIP-46 accounts MUST appear as opaque choices; new profiles and remote-signer invitations MUST be delegated to the host; event signing and NIP-44 MUST call only opaque account operations; and view teardown MUST close the selected host session. The plugin MUST NOT receive, persist, or log a secret key, bunker invitation, or NIP-46 client credential. |
| LN-COM-006 | Account creation and NIP-46 MUST be available in the Community login dialog, existing host accounts MUST be reusable, raw private-key import MUST remain absent, and public community browsing MUST remain available while signed out.                                                                                                                                                                                                          |
| LN-COM-007 | Storybook MUST exercise the real public plugin application with deterministic NIP-29 and registry data, open the Registry destination, and show the host-owned identity choices. New visuals MUST remain `visual-pending`.                                                                                                                                                                                                                      |

## Runtime flow

```text
Community view
    -> CommunityApplication
    -> NIP-29 relay source
    -> host-configured Nostr registry source

registry install
    -> app.pluginDistribution
    -> host verification, staging, and lifecycle

protected action
    -> app.nostr.forPlugin("community")
    -> host permission and OS keychain or NIP-46 signer
    -> signature or NIP-44 result only
```

The relay is transport and shared storage, not the trust root and not a private
credential store. The registry retains the host's curator, quorum, verification,
and installation policy. The plugin does not inspect host keychain records or
remote signer client keys.
