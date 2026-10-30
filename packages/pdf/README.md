# PDF

PDF file view and note embed for Lapis applications

## Install for static composition

```sh
pnpm add @lapis-notes/pdf
```

Register the exported plugin class in the application's `PluginProfile`. Import
`@lapis-notes/pdf/styles.css?inline` and pass the CSS through the static
registration so the host owns its lifecycle.

The runtime plugin ID is `lapis-pdf`. A matching signed
`lapis-pdf-0.2.0.lapis-plugin` archive is attached to the
package-scoped GitHub release for manual or registry installation.

See the [repository README](https://github.com/lapismd/lapis-plugins#readme) for
development, validation, and release-gate details.
