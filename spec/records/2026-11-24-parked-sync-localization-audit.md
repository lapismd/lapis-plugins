# Parked Sync localization audit

Plugins PR 178's quality job 138126157509 fails its separate parked-package
command `pnpm --dir packages/sync audit --ignore-workspace`: one moderate
GHSA-6jcc-5g8w-32mx through API 0.2.3's automatically installed i18next 25.10.10.
Root audit and all four hosted catalog shards already pass on 355d194a.

Sync is private, excluded from workspace recursion and Changesets, and retained
for explicit development validation. Add a normal private development range
`i18next: ^26.3.4`; its standalone registry lock resolves 26.7.2 and removes the
obsolete Babel runtime. Frozen standalone install passes, and the exact audit
now reports no known vulnerabilities. Existing audit policy, overrides and
patches are unchanged. The root audit still passes with its one existing ignored
low finding. Retirement and explicit App-ownership guards pass.

The published legacy API 0.2.3 peer still declares 25; its warning remains
visible. This documented temporary private validation setup does not change or
claim compatibility for that public declaration. Notes PR 198 qualifies the
current API's support for 26; it does not qualify this historical API line.
No runtime implementation, public manifest, package version, unfinished-test
skip, workspace exclusion, native authority or publication permission changes.
This receipt cannot qualify parked Sync for shipping or production use.

## Qualification

The portable `pnpm validation:sync` lane passes engine type checking, Svelte
checking (zero errors/warnings), all 326 tests across 19 files and its build.
The independent source-only change leaves all previously qualified active plugin
and 410 catalog cases outside its dependency graph. The canonical specification
check passes all four lanes, including source intake and spec-first.
The separate native build/publint lane also passes; publint packs the package
before inspecting its public exports. Both retirement guard regression cases
pass without changing the guard. Source App-ownership audit passes.
