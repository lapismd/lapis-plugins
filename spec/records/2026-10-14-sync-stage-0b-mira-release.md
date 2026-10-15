# Sync stage 0B: Mira release

Status: Mira checkpoint complete with 0.0.5 published and verified,
14 October 2026. Stop for manual review before the Notes release checkpoint.
This is the Mira checkpoint of the
[incremental delivery plan](2026-10-14-sync-incremental-delivery-plan.md).
The required Notes public-package release, consumer refresh, and stage 0C
landing remain separate checkpoints.

## Scope and source

Release the preserved portable, source-bound Markdown editing-session
capability. A host can discover writable previews, join pending saves and
protect editors before an external update. Failed teardown stays discoverable
for retry; rejected registrations disable writers; queued saves retain their
original document destination. Published tarballs exclude emitted tests.
This capability alone does not activate Sync or implement Lapis apply guards.

Fresh fetches found no new Mira main commits beyond the already published
0.0.4 at `a96e4303e61a1c5324b0134291ffe86239dc535f`. Registry inspection and a
clean consumer confirm that 0.0.4 lacks the editing-session type and hook.
The exact preserved source commit `b16f09373794c1a30caad5000b9f1ddad4ec144d`
was copied onto current main without conflicts and qualified in the default
Mira workspace. The original reconciliation reference remains recoverable.

- [Source PR #12](https://github.com/lapismd/mira-mde/pull/12), head
  `91f88d8e4c2afab3b18a5a7596bec0fde872ce3a`, merged as
  `33568bbea8340ac50f18a680329deb9758bb4169` after all three required checks passed.
- [Version PR #13](https://github.com/lapismd/mira-mde/pull/13), reviewed head
  `ae062eaca9484368d2e350661971f89f94aad7d3`, changes only Mira from 0.0.4 to
  0.0.5, its changelog, and the consumed Changeset. Merged as
  `f18200b672622d49b9defc1d93fa36420ff7e11b` after all three required checks passed.
- GitHub required approval for the bot-created version PR's CI run. Approved
  that exact run through the normal workflow gate; no checks were bypassed.

## Verification

- On current main, the exact writer/session command runs the three existing
  writer cases; the new session test is absent. After transferring the source,
  all 10 cases in the two files pass. After refreshing installed dependencies,
  the same exact command passes again.
- `pnpm install --ignore-pnpmfile --frozen-lockfile` restores the committed
  dependency graph without modifying manifests or the lockfile. Initial local
  modules had stale Bits UI 2.18.1 and Svelte 5.56.4, while main requires
  Bits UI 2.19.5 and Svelte 5.57.2. The broader interaction run initially reports
  157 passes and one pending-overlay teardown failure; its exact retry also
  fails. After the frozen install, that exact retry passes and all 158 cold
  interaction/accessibility stories pass. No source repair or assertion change
  was needed. The initial browser run was stopped before changing dependencies;
  it is not acceptance evidence.
- The complete seven-story embed family and its editing-protection scenario
  pass. Visual review remains pending; no baselines changed.
- `pnpm check:all` passes after the frozen install: check, lint, 425 unit tests
  across the six public packages, and all eight build tasks. Svelte diagnostics
  report zero errors and zero warnings. Source audit reports zero advisories.
- Specification, catalog, package-contract and Changeset intent checks pass.
  The explicit specification-first range covers nine protected files and four
  canonical chapters. Release tests pass all 36 cases.
- `pnpm packages:pack` validates all six packages together in a clean consumer,
  including Svelte, React, Vanilla, CSS and package-leak checks. The packed
  production graph retains the existing approved low-severity KaTeX exception
  `GHSA-238p-pmpm-9mq7`; this checkpoint adds no exception.
- Static Storybook and all 50 Playwright cases pass from a fresh process with
  `CI=1 pnpm test:e2e`. Warm server reuse is disabled.
- [Source PR CI](https://github.com/lapismd/mira-mde/actions/runs/38627783414)
  passes all three required lanes, including 425 unit tests, clean packed
  consumers, and all 50 browser cases.
- [Version PR CI](https://github.com/lapismd/mira-mde/actions/runs/38628673028)
  passes all three required lanes. Merged-main CI also passes in
  [run 38629366640](https://github.com/lapismd/mira-mde/actions/runs/38629366640).

## Publication and review

All five jobs in the
[release workflow](https://github.com/lapismd/mira-mde/actions/runs/38629366665)
pass, including clean registry installation, integrity, and npm provenance.
It published `@lapismd/mira@0.0.5`; npm's `latest` tag is 0.0.5. Only the core
package is selected; the other five public package versions remain unchanged.
The default Mira workspace is rebuilt on merged main `f18200b6`.

- Downloaded the CI artifact and validated its exact source commit, package
  identity, Apache-2.0 license, public editing-session declarations, and SHA-512
  integrity. Its 728-file tarball contains no emitted unit/spec tests.
- Downloaded 0.0.5 directly from npm. Its bytes, SHA-256 and SHA-512 match the
  reviewed CI artifact exactly. SHA-256:
  `5e275f49b2951180710c703b211324893bb306fad57fb1b8214cd84059d947a4`.
- Registry integrity:
  `sha512-e1BofLLChHI48k+KCVmdU4YpHA5bipHi+LW1HypYrIET+LTu6SWfQuzP5Z+6e3aH7dR7UyJoJGinqcXFikGObg==`.
- A clean npm consumer initially fails on 0.0.4 with four type diagnostics caused
  by the missing type and registration hook. After installing released 0.0.5,
  the exact command passes with zero diagnostics:
  `./node_modules/.bin/tsc --noEmit --skipLibCheck --strict --target ES2022 --module NodeNext acceptance.mts`.
  This verifies the public type/hook/preview boundary from registry exports;
  application-wide writer registration remains Notes integration work.
- The npm metadata/install endpoint briefly lagged publication. A bounded retry
  with `--prefer-online` resolved the released version; no alternate artifact
  or local-package redirect was used.

The [GitHub release](https://github.com/lapismd/mira-mde/releases/tag/mira%400.0.5)
is public and targets `f18200b672622d49b9defc1d93fa36420ff7e11b`.
Downloaded the retained npm signature evidence and independently reran the
repository's provenance validator against the reviewed artifact manifest: one
package passes, with its exact tarball digest, repository, main ref and release
workflow verified.

Review the public preview scenario at
[External editing protection](http://127.0.0.1:7007/?path=/story/markdown-embeds--editing-protection).
Storybook runs from `/Users/stevejuma/code/lapismd/mira-mde` on merged main.
If it has stopped, run `STORYBOOK_PORT=7007 pnpm storybook` in that checkout.
The interaction panel demonstrates a held save, read-only protection, external
refresh, and keeping queued writes attached to their original document.
This is portable editor evidence; the Notes development app and live Deno
Sync path remain separate review steps.

The unrelated `.local/packages/lapismd-mira-0.0.2.tgz` is preserved, excluded
from both PRs, and retains SHA-256
`9365198c2c49a2e26ebc0529b32925fec0692236317b6bc583dd46685937284b`.
Other workspaces, pending Notes/Plugins stacks and development data remain
intact. No downstream source alias, package patch or local tarball is used for
app integration. No Sync publication, registry dispatch, feature slice or
temporary-workspace cleanup occurs in this checkpoint.

The Plugins handoff changes only this record and the delivery plan. Its focused
formatter and specification checks pass. Audit exits 0 under the unchanged
existing policy (two moderate and one high metadata findings, no unaccepted
advisory). Product suites and broad Plugins CI remain deferred for this
documentation-only checkpoint.

Stop for manual review. Next is the separate Notes public-package release
checkpoint; stage 0B as a whole remains incomplete. Notes/Plugins dependency
refresh and app integration wait for their respective release/landing slices.
