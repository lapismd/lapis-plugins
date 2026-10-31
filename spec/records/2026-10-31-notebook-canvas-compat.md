# Notebook compatibility qualification

Notebook and Design Core UI was approved on 31 October 2026. Complete the
dependency-only Markdown compatibility checks and audit without changing CSV
or other plugin behavior. Full qualification is in progress. Pushing, merging
and publication require separate authorization. Keep visual baselines unchanged.

## Post-approval compatibility evidence

All commands used Node 24. Latest Deno-free validator remains 0.2.0; doctor
and working QMD search receipts are retained under `.local/qualification/`.

- `pnpm --filter @lapis-notes/markdown check`: 0 errors/0 warnings.
- `pnpm --filter @lapis-notes/markdown test`: 154 passed/0 failed.
- `pnpm --filter @lapis-notes/markdown build`: build and publint passed.
- `pnpm spec:check`: passed validation, mdBook and spec-first, 0 findings.
- `pnpm check:app-ownership`: passed in isolated Docker.
- `pnpm test:storybook -- stories/plugins/markdown`: 61 interaction/axe stories
  passed/0 failed across 11 files, fresh Docker browser. Receipt:
  lapis-plugins-validation-29dd091d-c0e1-4fa3-8988-f6272f00f308.
- `pnpm build-storybook`: full static catalog passed, no screenshot comparison.
- `node --test scripts/plugin-release.test.mjs scripts/plugin-archive-contract.test.mjs
scripts/npm-package-imports.test.mjs scripts/build-plugin-release.test.mjs`:
  26 passed/0 failed, including reproducibility/signature contracts.
- `pnpm --dir packages/markdown pack --pack-destination
../../.local/qualification/markdown-pack`: passed package and publint.
- `pnpm plugin:build -- --plugin markdown --out-dir ...` first stopped at
  the clean-working-copy release gate. Repeated with explicit immutable JJ
  source snapshot `ff4a0454e0c4f5dda3d1a11867da5fc7df57b818` and
  `--commit`: candidate payload passed. This is local qualification only.
- `pnpm plugin:verify -- <directory>` first failed on forwarded `--`; exact
  `node scripts/verify-plugin-release.mjs .local/qualification/markdown-payload`
  passed. A second build from the same snapshot matched SHA256
  `4e92ceadfb62b7821877f1ddf8a452af93b2f96c2d5a7ca1754b7c09d4056e10`.
- Initial audit had 1 new moderate minimatch finding. Remote main's matching
  baseline had none. Lock refresh exposed a stale root development History
  range (^0.1.4) that did not match the existing local 0.2.0 package. Aligning
  only the dev range to ^0.2.0 removed the obsolete registry dependency.
  Final audit has no advisories/moderate/high/critical findings and retains
  the same two pre-existing ignored low metadata entries. No new CVE ignore.

CSV and all other plugin runtime files remain unchanged. Published signing,
registry intake and final Notebook acceptance require the separately authorized
release cohort. This compatibility slice is not a publication receipt.
