# Lapis first-party plugin repository guidance

This repository owns the independently versioned first-party plugins under
`packages/*`, their shared Storybook, release artifacts, and plugin behavior
specifications.

## Ownership and architecture

- Keep application routing, persistence, vault selection, installed-plugin
  state, and static plugin profiles in the consuming application.
- Use only public `@lapis-notes/*` and `@lapismd/*` package contracts. Fix a
  missing generic framework contract in its owning repository before changing
  a plugin.
- Runtime code receives `App` explicitly or through an owned workspace/leaf.
  First-party code must never read or assign `globalThis.app`.
- Preserve the package names and runtime plugin IDs. Package versions are
  independent; Changesets must not use fixed or linked groups.

## Packages and releases

- Publishable manifests must contain normal npm semver ranges. Never commit a
  `workspace:`, `link:`, or `file:` dependency in a package manifest.
- Every package exports its plugin class, public types, manifest metadata, and
  `styles.css`.
- The npm package and `.lapis-plugin` archive must be built from the same source
  commit and package version.
- Archives are deterministic ZIP-compatible files. They must contain
  `release.signed.json` first, followed by exactly the signed, sorted file list.
- Bundle non-host dependencies. Externalize only modules in the explicit host
  allowlist and mirror those modules in runtime metadata.
- Use package-scoped tags such as `graph@0.1.0`.
- Never publish npm packages, create public release assets, or dispatch a
  registry update without the user's explicit approval at the release gate.
  Private signing material must only enter CI through encrypted secrets.

## Specifications, stories, and validation

- Update the owning chapter under `spec/src/plugins` with behavior changes.
- Use the single repository-level Storybook. Keep stories organized by their
  owning package; do not add per-package Storybook configurations.
- Before committing a verified slice, run the focused package checks plus the
  relevant specification, Storybook interaction/axe, build, publint, npm-pack,
  archive reproduction, signature, and App-ownership gates.
- Do not create or replace visual baselines before explicit visual-parity
  approval.

### Registry media authoring

- Keep registry capture stories under `Plugins/<Plugin>/Registry Screenshots`
  with `registry-media` and `visual-pending` tags. A checked-in `registry.json`
  story ID is the fixed source of every generated card; never discover a
  substitute story by name or tag.
- Capture a real 1200x800 application shell at 2x density in both Lapis light
  and dark presentations. Keep Explorer open
  for full-shell views. A sidebar-only card may focus the sidebar plus half of
  the adjacent document, and status-only surfaces may use the bounded status
  crop.
- Add a card for each materially different plugin view, up to five cards per
  plugin. Use realistic vault content, filenames, metadata, results, and
  relationships that present the feature at its best.
- Give every plugin one fixed Overview story and use that settled state for its
  banner and Overview media. Multi-panel plugins should use left, main, and
  right surfaces to show meaningful variants. Sidebar-only plugins use the
  primary left sidebar beside an empty main workspace with the opposite dock
  closed. Word Count uses the complete shell with both sidebars closed.
- Express headline and description copy as allowlisted colour segments. Keep
  most description copy neutral and accent only phrases whose meaning benefits
  from the shared violet, cyan, green, amber, or rose palette.
- Keep the marketing copy on the left and the captured product surface on the
  right for every card. Use the bundled Inter face for marketing copy; do not
  add per-card layout or font choices.
- Use `pnpm registry:media:capture` to regenerate declared preview and full
  split assets plus their light and dark variants, and use
  `pnpm registry:media:check` to prove they are current. These
  commands never create, replace, or approve Visual Delta baselines.

## Version control

Use Jujutsu for status, diffs, commits, bookmarks, and pushes. Preserve
unrelated work. Commit each verified slice and push the `main` bookmark to the
GitHub remote.
