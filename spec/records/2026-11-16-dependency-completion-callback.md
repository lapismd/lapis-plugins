# Verified dependency completion caller

The source-owned `dependency-completed.yml` calls the shared coordinator verifier
at merged commit `e3c91cb3bc19f19299842054a9309b0ca44da5b6` after CI,
dependency-image publication, approved static publication or version preparation
successfully completes. It excludes its own callback and the Nostr publisher.

The caller executes no local code, handles no candidate artifacts/caches and
exposes only contents/Actions/PR reads plus the existing named notification
secret. The required public client-ID variable was confirmed present through a
read-only GitHub API request; no key was retrieved or distributed. The shared
verifier checks actual current public workflow/run/attempt/head metadata before
App minting and immediately before dispatch, then its receiver settles the exact
callback/check suite before full inventory. All current-head and repair gates
remain authoritative.

## Source validation

- `node --test scripts/dependency-completed.test.mjs`: 2 failures with the caller
  absent; 2 passes after adoption.
- Exact native-workflow audit: 1 failure for the pure delegated caller before
  adding an exact reviewed-runner check which forbids local execution. Every
  local workflow still requires its native-runtime declaration.
- Native `pnpm test:release`: 237 passed, including the caller and complete
  validation-tool tests.
- `pnpm audit`: passed with the same two existing ignored low findings; policy
  and dependency resolutions are unchanged.
- Native `pnpm spec:check`: validation, mdBook and spec-first passed.
- `actionlint` passed for the new workflow. Changed Markdown and the new test
  were formatted; unrelated legacy test formatting was retained.
- QMD semantic search passed; Deno-free validator 0.2.0 remains installed. Doctor
  passed 10 checks with the existing intentional wrapper-alias warning.

No manifest, lockfile, package build/signing/publication recipe, existing CI lane
or excluded Nostr/Deno surface changed. Complete hosted product CI and a genuine
completion-triggered reconciliation remain separate acceptance after merge; this
receipt grants no release or deployment authority.

Rollback removes or disables only the new callback, retaining publication hints,
manual scans and the coordinator's scheduled-recovery gate.
