# Sync stage 0C: land and verify main workspaces

Status: complete, 15 October 2026. Main landing, focused verification and
temporary-workspace cleanup are complete. Recovery archives and named changes
are preserved. Feature slice 1 has not started.

## Landed work

Fresh HTTPS fetches find no additional remote main changes. The Notes host
stack and Mira source changes were already merged and released in stage 0B;
they are consumed rather than copied again.

The Plugins landing is `7cce83e7864bc85323252648863b2347775e1704`
(change `orupwrll`). It transfers the 21 qualified commits through `c924ba0b`
onto the updated main workspace as one verified slice. Original input remains
at `local/sync-runtime-pending-20261014` (`069401fb`). The last two planning
commits are superseded by the current main delivery plan rather than applied
again. Engine, UI and story source files match the qualified input exactly.

The four conflicts are the registry lockfile, Distribution, Specification
Governance and Verification. Current main's release policies and existing
verification rows are retained, Sync prose and 41 owning verification rows are
added, and pnpm regenerates the registry graph. There are no unresolved landing
conflicts. Sync remains private and excluded from installation and release.

Notes main is `8eba6744e57ce43b20a77ce8540d36469aa71be4`
(change `rxqnnptr`). Its
[consumer record](../../../lapis-notes/spec/records/2026-10-15-sync-stage-0c-consumer.md)
records the dependency refresh and cold application acceptance. The parked
navigation change `local/sync-navigation-pending-20261014` (`5d93b9ce`) and
diagnostic prototype `local/parked-catalog-diagnostics-20261015` (`2b97e925`)
remain excluded and recoverable.

## Registry dependencies and focused evidence

Plugins uses npm API 0.1.4, Design Core 0.3.3 and Mira 0.0.5. Existing Workspace
0.2.0, UI 0.1.2, File Explorer 0.1.2 and Language Service 0.1.1 stay on their
existing selections. Svelte 5.56.10 matches the API renderer contract. Sync's
standalone registry dependency install remains separate because the package is
parked from recursive workspace tasks. No sibling source, tarball or dependency
override supplies the host. Notes consumes the released Design Core/Mira
prerequisites with its existing public framework ranges unchanged.

- Before transfer, Sync's package and stories are absent from remote/main.
  After transfer, the exact engine target passes 37 cases and the exact
  shell/status target passes ten stories.
- The complete Sync package passes 184 cases in 14 files, engine and Svelte
  checks with zero errors/warnings, build and publint. Node and Deno import all
  63 bundled engine exports without UI/host imports.
- The complete Sync interaction/accessibility family passes 47 stories in
  eight files. One earlier attempt loses its browser connection after 44
  passing cases; the exact Review file then passes three cases and the full
  family passes. No assertion, timeout or diagnostic policy changes.
- Six parked-package/media regressions pass. Metadata checks verify 12 public
  package boundaries and 13 registry sources. Ownership, no-Tailwind and all
  three specification-check lanes pass: 27 chapters and 593 requirements.
- The main Notes Web build passes all nine tasks, including 98 native-service
  and 28 server cases. The cold OPFS note/workspace save/reload test passes one
  case. Dependency-security tests pass three cases; ownership, spec-first and
  specification validation pass (172 chapters, 1,439 requirements).
- Root Plugins, standalone Sync and Notes audit commands exit zero under their
  existing approved policies. Underlying ignored findings remain visible in
  metadata; no exception is added or broadened.

These are focused landing and consumer checks. Complete catalog/platform,
fault/multi-device, packaging/signature and live Deno qualification remain
deferred. The non-failing caught Catalog diagnostic remains deferred as the
user requested. No visual baselines, published package or registry activation
are changed. Main commits remain local for review; pushing the accumulated
private work would start the deferred complete CI workflow.

## Recovery and workspace cleanup

Before cleanup, each temporary workspace is archived under
`.release/sync-stage0c-preserved/` in the main Plugins workspace. The ignored
`manifest.json` records exact archive paths, sizes, SHA-256 checksums and
excluded regenerable build/cache directories. Archives include tracked files,
ignored evidence and local data, with owner-only file permissions. All three
archives pass checksum verification; the Notes archive explicitly contains the
five parked navigation files. Existing named Jujutsu references remain intact.

The three cleanup targets are only `lapis-plugins-sync-runtime`,
`lapis-notes-sync-runtime` and `mira-sync-runtime`. Unrelated release/static-CI
workspaces, ordinary development data and Mira's original local tarball remain
untouched.

All three Sync workspaces were forgotten through Jujutsu and removed after
archive verification and a check for running processes in those directories.
The 21 disposable duplicate/rebase commits were abandoned after their resolved
tree was committed to main; the original source stack was not rewritten.

## Runnable review and next slice

The main Plugins Storybook runs at
[Sync Desktop](http://127.0.0.1:6006/?path=/story/plugins-sync-shell--desktop).
It includes the retained settings, states, panels, review and registry media
stories. Its injected fixture runtime is UI evidence, not live synchronization.
Restart it from `lapis-plugins` with `pnpm storybook`.

The freshly built main Notes app runs at
[http://127.0.0.1:4176/](http://127.0.0.1:4176/). This separate origin preserves
the existing 4175 review vaults. Restart from `lapis-notes` with:

```sh
pnpm --filter @lapis-notes/web exec vite preview --host 127.0.0.1 --port 4176 --strictPort
```

Stop for manual review. The next approved piece is feature slice 1: a real
authenticated Deno connection from the private development plugin's Settings,
with persistent configuration and visible offline/denied behavior. Production
runtime, enrollment, checkpoints and incoming apply are not enabled here.
