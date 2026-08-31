# Slides

Presentation mode for Markdown notes

## Install for static composition

```sh
pnpm add @lapis-notes/slides
```

Register the exported plugin class in the application's `PluginProfile`. Import
`@lapis-notes/slides/styles.css?inline` and pass the CSS through the static
registration so the host owns its lifecycle.

The runtime plugin ID is `lapis-slides`. A matching signed
`lapis-slides-0.1.0.lapis-plugin` archive is attached to the
package-scoped GitHub release for manual or registry installation.

See the [repository README](https://github.com/lapismd/lapis-plugins#readme) for
development, validation, and release-gate details.
