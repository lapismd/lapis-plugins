# Releasing plugins

Each plugin has an independent version and package-scoped Git tag such as
`graph@0.1.0`. Changesets has no fixed or linked package groups.

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
`repository_dispatch` using a narrowly scoped GitHub App token. Secrets contain
private key material; release logs and artifacts never do.

The GitHub App is installed only on `lapis-plugins` and `plugin-registry`. The
release workflow uses `LAPIS_REGISTRY_APP_ID` and
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
