# Temporary Picomatch audit exception

The user explicitly approved a documented temporary exception for
[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
(CVE-2026-112366) on November 17, 2026, after the required hosted audit blocked
retirement PRs #154 and #155. The advisory expanded its affected range at
15:56:44 UTC, after the earlier local retirement qualification. At verification,
`npm view picomatch version` returns `4.0.7`, the advisory affects `<=4.0.7`,
and GitHub lists no first patched version. This exception does not fix ReDoS.

## Reproduction and scope

An isolated export of unchanged `main@codex-https` (`313b4a41`) reproduces the
same two high findings with `pnpm audit --json`. Its report remains in ignored
`.local/validation/main-audit-2026-11-17.json`. Root dependency paths are:

- `@changesets/cli > @changesets/config > micromatch > picomatch`
- `@storybook/addon-docs > unplugin > picomatch`

Private Sync's independent `pnpm --dir packages/sync audit --ignore-workspace
--json` reports the same advisory through `svelte-check > fdir > picomatch`.
These are developer build/configuration and filesystem-discovery paths. Their
glob patterns are supplied by the reviewed tooling/configuration; this work
adds no public glob-evaluation endpoint. Malicious repeated extglobs can still
block Node's event loop if supplied to these tools. Do not extend this exception
to new runtime glob consumers or describe the underlying packages as repaired.

Only `CVE-2026-112366` is added to root `auditConfig.ignoreCves` and private Sync's
separate `pnpm.auditConfig.ignoreCves`. Existing ignores, audit commands, failure
propagation and every other required CI lane remain unchanged. No dependency
version, override or lockfile is changed.

## Removal and qualification

Owner: Plugins development tooling. Recheck on the next dependency intake and
before the next plugin publication. Once a patched release or an upstream chain
removal is available, qualify that intake, remove both entries, and rerun root
and independent Sync audits without this ignore. All other advisories remain
blocking under the existing policy. This approval authorizes no npm publication,
signing, registry dispatch or deployment.

Before: audit-forwarding and required-workflow regressions pass 12 tests; root
audit fails on two high findings and independent Sync fails on one high finding.
After: both exact audit commands exit 0 with this advisory visibly ignored;
root retains its pre-existing ignored low finding. All 19 audit-forwarding,
required-workflow and parked-package regressions pass. Canonical specification
qualification passes validate, mdBook, specification-first and App-ownership
in Docker (run `lapis-plugins-validation-96b24abd-38e0-4508-9737-7672242087d1`).
