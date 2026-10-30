# Unpatched audit exceptions — 29 October 2026

## Outcome

Root `pnpm audit` on the published-floor lockfile exits 1 with two low
findings. Both advisories list patched versions as `<0.0.0`, so no registry
release removes them. The private Sync catalog exits 1 on the deepmerge
finding alone. These exceptions do not claim the vulnerabilities are fixed.

| Advisory | CVE | Package | Patched | Path |
| --- | --- | --- | --- | --- |
| GHSA-848j-6mx2-7j84 | CVE-2025-14505 | elliptic <=6.6.1 | `<0.0.0` | vite-plugin-node-polyfills > node-stdlib-browser > crypto-browserify > browserify-sign > elliptic |
| GHSA-gcqx-w48m-w2h4 | CVE-2026-93753 | deepmerge >=4.2.0 <=4.3.1 | `<0.0.0` | @sveltejs/vite-plugin-svelte > deepmerge |

## Exposure and removal

Elliptic is a development polyfill for the Storybook and editor toolchain, not
a plugin runtime import. Deepmerge is pulled in by the Svelte Vite plugin used
to build and test packages. Neither path accepts untrusted merge or signature
input from plugin users.

`pnpm-workspace.yaml` `auditConfig.ignoreCves` records both CVEs. The Sync
catalog install ignores the workspace file, so `packages/sync/package.json`
records only CVE-2026-93753. Remove an entry when its dependency chain resolves
a release whose patched range is not `<0.0.0`, then rerun both audits without
that ignore.
