# Retired shared AI package

The shared `@lapis-notes/ai` implementation, catalog, controller attachment and
build/pack/media selection are retired. Tauri owns its current AI implementation
and Rust execution; App Profile native chat remains supported by its hosts.
Deferred registry-head renewal also rejects retired AI before authorization and
template creation; source deletion must not leave freshness renewal available.
The prior shared-package requirements are retained as
[historical provenance](../../../archive/2026-11-17-shared-ai-before-removal.md).
They no longer describe an implemented package in this repository.

| ID | Requirement |
| --- | --- |
| LP-SPEC-061 | The retired shared AI package, runtime exports, controller attach bridge, catalog fixtures, media and dependency closure MUST remain absent from active source, build, packing and Storybook inventories. Normal checks and canonical specification validation MUST fail on their reintroduction. The LP-SPEC-060 publication tombstone MUST remain effective after package deletion. Independently owned Mira AI, native AI, application data and signed history MUST remain unaffected. |

Notes owns the remaining consumer/probe removal, external-versus-bundled
provenance/data acceptance and publication gates in
`docs/plans/legacy-runtime-retirement-progress.md`. Removing this package does
not uninstall plugins, rewrite vaults, unpublish npm versions, deploy the registry
or qualify actual native application behavior.
