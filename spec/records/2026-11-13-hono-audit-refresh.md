# Hono 4.13.16 audit refresh

The version PR's quality lane failed `pnpm audit` on two newly indexed
moderate Hono findings plus the related low finding, all through
`@lapis-notes/api` → `@lapismd/ai-host` → `@modelcontextprotocol/sdk` →
`hono@4.13.13`. Parked Sync independently resolved `hono@4.13.14`.

The already permitted MCP SDK range is `^4 || ^5.0.0-0`. The workspace
override floor is now `hono@<4.13.16: ">=4.13.16 <5"`, and parked Sync
records the same override for `--ignore-workspace` audits. Both lockfiles
resolve registry 4.13.18. No CVE ignore is added. Publication is not
authorized.

Advisories: https://github.com/advisories/GHSA-4m76-xfj5-7975,
https://github.com/advisories/GHSA-h7mg-cq63-vhpq, and
https://github.com/advisories/GHSA-3gg2-335m-rxc6.
