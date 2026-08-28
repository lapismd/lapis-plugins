# Distribution and Releases

## Requirements

| ID | Requirement |
| --- | --- |
| LP-SPEC-010 | The repository MUST publish the eleven packages listed in `scripts/package-catalog.mjs` under their existing `@lapis-notes/*` names and runtime IDs, beginning at independently versioned `0.1.0` versions without Changesets fixed or linked groups. |
| LP-SPEC-011 | Every published manifest MUST use registry semver ranges and MUST export its plugin entry, public types, `manifest.json`, and `styles.css`; it MUST NOT contain `workspace:`, `link:`, `file:`, or machine-local dependency paths. |
| LP-SPEC-012 | One source commit and package version MUST produce both an npm tarball and a deterministic `<plugin-id>-<version>.lapis-plugin` ZIP-compatible archive with its SHA-256 checksum. |
| LP-SPEC-013 | A release archive MUST contain `release.signed.json` first and then exactly its signed, sorted file list, including `manifest.json`, `main.mjs`, styles, workers, and traced assets. Verification MUST reject unsafe paths, extra files, hash or size changes, plugin-ID or version mismatches, and invalid signatures. |
| LP-SPEC-014 | Runtime bundling MUST externalize only approved declared Lapis host modules and MUST bundle every other dependency. The runtime descriptor, package name, plugin ID, version, and source commit MUST be covered by the signed envelope. |
| LP-SPEC-015 | GitHub releases MUST use package-scoped tags such as `graph@0.1.0` and attach the archive and checksum produced from the matching package version. |
| LP-SPEC-016 | Publication automation MUST remain manual and fail closed unless the first-publication gate is explicitly approved. It MUST publish npm before public assets and dispatch the verified repository, package, plugin ID, version, tag, asset, and source commit to the registry with a narrowly scoped GitHub App token. |
| LP-SPEC-017 | CI MUST run package boundary, App-ownership, native-CSS, unit, type, Svelte, build, publint, npm-pack, specification, release-security, deterministic archive, signature, shared Storybook, interaction, and accessibility gates. Clean registry-only Web and Deno runtime acceptance MUST complete before first publication. |
| LP-SPEC-018 | Private signing material MUST enter automation only through encrypted secrets and MUST never be printed, committed, included in npm tarballs, or attached to a release. Local preparation MAY use an explicitly test-only ephemeral key. |
