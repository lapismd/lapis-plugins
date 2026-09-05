# Community

Join Lapis community conversations with a host-owned Nostr identity

## Install for static composition

```sh
pnpm add @lapis-notes/community
```

Register the exported plugin class in the application's `PluginProfile`. Import
`@lapis-notes/community/styles.css?inline` and pass the CSS through the static
registration so the host owns its lifecycle.

The runtime plugin ID is `community`. A matching signed
`community-0.1.0.lapis-plugin` archive is attached to the
package-scoped GitHub release for manual or registry installation.

See the [repository README](https://github.com/lapismd/lapis-plugins#readme) for
development, validation, and release-gate details.
