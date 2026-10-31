# Releasing plugins

Each plugin has an independent version and package-scoped Git tag such as
`graph@0.1.0`. Changesets has no fixed or linked package groups.

The first implementation publishes the signed static catalog at
`https://registry.lapis.md/v2/index.json`. `release.yml` is the static route;
`release-nostr.yml` retains the deferred relay route. Both activation gates
remain closed until explicitly approved.

Changesets sets the selected package versions. CI builds npm tarballs and runtime
payloads from the same commit, signs deterministic archives with the existing
app-pinned Ed25519 release key, reproduces them, and writes
`.release/release-plan.json`. All approved artifact checksums are verified before
publication starts. The workflow uses the digest-pinned blocking CI environment.

After approval, npm publishes through OIDC, GitHub receives the exact package-tagged
archive and checksum, and a scoped GitHub App dispatches the selected coordinates
to `lapismd/plugin-registry`. The registry verifies the assets and pinned source
metadata and opens a review PR. After the first V2 cutover approval, validated
registry PR merges deploy Astro and the signed catalog automatically. V1 remains
archived.

V2 `registry.json` contains presentation and media fields without README or
Markdown references. Structured version notes use the exact Changesets
`CHANGELOG.md` section or a validated `releases[version].changelog` override
with title, description and tags. Notes are never silently truncated.

## Parked Community plugin

`@lapis-notes/community` is parked for this release. Its package manifest has
`private: true`, the authoritative parking marker. The active package catalog
excludes private plugins from build artifacts, packing, media capture, metadata
checks and dispatch. The pnpm workspace excludes `packages/community` from
recursive build/check/test and Changesets; Storybook selects active directories.
Both release workflows omit Community, and publication rejects stale plans
containing its coordinates. The local registry excludes private source packages.
Lapis Notes omits its constructor, styles and dependency from the shared profile.

Source and prior test evidence remain retained. Static release tooling consumes
`@lapis-notes/api/registry/schema`; Storybook uses `@lapis-notes/api/build/vite`.
Neither requires Community. Relay-only tooling and its unchanged assertions
remain in the deferred `test:release:nostr` lane. Before re-enabling Nostr, restore
the Community protocol dependency and qualify that lane and relay acceptance.

To re-enable Community, remove its private flag and workspace exclusion, restore
the two workflow selections and the app profile
integration, and update the parking regression expectations and specifications.
Then complete its package, browser/accessibility and release-artifact gates and
review its registry metadata before including it in a release. Do not treat
historical passing evidence as current release qualification.

## Artifacts

One verified source commit and version produce:

1. An npm tarball for static app composition.
2. `<plugin-id>-<version>.lapis-plugin`, a deterministic ZIP-compatible bundle.
3. `<plugin-id>-<version>.lapis-plugin.sha256`.

The runtime bundle includes `release.signed.json`, `manifest.json`, `main.mjs`,
`styles.css`, workers, and traced assets. `release.signed.json` is the first ZIP
entry and signs the complete sorted file list, hashes, sizes, runtime
descriptor, package name, plugin ID, version, and source commit.

Only the declared Lapis host-module allowlist is externalized. Every other
runtime dependency is bundled into `main.mjs` or a traced asset.

## Manual first-publication gate

Before any initial npm publication or public GitHub release asset is created,
prepare and present:

- npm tarball listings and checksums;
- deterministic bundle reproduction and signature verification;
- clean registry-only Web and Deno consumer evidence;
- the generated registry diff;
- plugin-management UI interaction and accessibility evidence.

Visual-parity stories and capture wiring are included for later review, but
visual results and baselines are explicitly non-gating. A missing or failing
visual comparison must not block npm publication, GitHub assets, a registry pull
request, or registry deployment.

Stop for explicit approval. Approval is also required before merging the first
generated registry PR or changing production registry deployment.

After approval, the release workflow publishes npm, creates the package-scoped
GitHub release, and sends the verified release coordinates to the registry by
`repository_dispatch` using a narrowly scoped GitHub App token. The sender verifies
the actual published archive and checksum against the pinned release key and
resolved release tag before sending coordinates. When a rerun retains an earlier
archive, the dispatch uses that archive's original signed source commit rather
than the current workflow commit. It never rewrites the retained artifact. Secrets contain
private key material; release logs and artifacts never do.

The manual workflow presents one checkbox per plugin, with every plugin selected
by default. Clear any plugin that should not be included in that run. The
advanced replacement checkbox only clobbers the selected same-version GitHub
archive and checksum after npm integrity matches and the public registry source
proves that version is not indexed. It never replaces npm content. Once a
version is registry-published, correct it with a patch release instead.

The GitHub App is installed only on `lapis-plugins` and `plugin-registry`. The
release workflow uses `LAPIS_REGISTRY_APP_CLIENT_ID` and
`LAPIS_REGISTRY_APP_PRIVATE_KEY` to create an installation token scoped to
those two repositories and the contents permission needed for dispatch.

## npm trusted publishing

The initial `0.1.0` npm package versions were published manually from the
verified release tarballs. Every package now trusts the GitHub Actions workflow
`release.yml` in `lapismd/lapis-plugins`, restricted to the
`first-publication` environment and the `npm publish` action.

Automated npm publication uses GitHub OIDC with `id-token: write`. It must not
receive or require a long-lived `NPM_TOKEN` or `NODE_AUTH_TOKEN`. Keep the npm
CLI at version 11.5.1 or newer so it can exchange the workflow identity for a
short-lived publishing credential. GitHub release and registry dispatch
credentials remain separate from npm authentication.

## Correcting a published package

Never use `npm unpublish` as the normal rollback. Publish a verified patch
version first, prove that its public tarball works in a clean registry-only
consumer, and then deprecate the affected bad version with a message pointing
to the replacement. Delete a GitHub release or package-scoped tag only when it
represents the bad artifact and no published registry entry depends on it.

## Deferred publication

Static publication remains behind `STATIC_RELEASE_ENABLED=true` in
`release.yml` and the explicit release approval gate. The deferred relay route
uses `release-nostr.yml` and `renew-registry-heads.yml`, guarded by
`NOSTR_RELEASE_ENABLED=true`. Static publication does not require activating
Nostr publication or registry-head renewal.

To resume the relay route, configure the public OIDC signer URL and audience, relay URLs and
quorum, publisher and curator public keys, and authority epoch. Complete the
existing framework-publication, audit, consumer, artifact and protected
curation gates, then obtain approval to set the variable to true and enable
both relay workflows. npm publication, signed archives and registry events remain
part of that full release path. Specification Pages deployments remain
independent of this release gate.
