# CSV

CSV and TSV table view and note embed for Lapis applications

## Install for static composition

```sh
pnpm add @lapis-notes/csv
```

Register the exported plugin class in the application's `PluginProfile`. Import
`@lapis-notes/csv/styles.css?inline` and pass the CSS through the static
registration so the host owns its lifecycle.

The runtime plugin ID is `lapis-csv`. A matching signed
`lapis-csv-0.2.1.lapis-plugin` archive is attached to the
package-scoped GitHub release for manual or registry installation.

See the [repository README](https://github.com/lapismd/lapis-plugins#readme) for
development, validation, and release-gate details.
