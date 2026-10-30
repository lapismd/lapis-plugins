# Sync stage 0A: remote reconciliation

Status: complete, 14 October 2026. Stop for review before stage 0B.
The [incremental plan](2026-10-14-sync-incremental-delivery-plan.md) now lives
in the main Plugins workspace. This checkpoint updates the main workspaces
and preserves the feature stacks; it does not finish their release or landing.

## Remote and workspace results

Ran `jj git fetch --all-remotes` in all four repositories. Each has `origin`
and `codex-https` configured for the same GitHub repository; both remotes agree
on main. A second fetch before the handoff confirms no further main updates.
No main tip advanced during these fetches. Earlier remote updates
were already present in the bookmarks but missing from the default workspaces.

| Repository      | Reconciled remote main                     | Default workspace result                                                          |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| `lapis-plugins` | `defa3d061ae7b985c8d19b8de794540b4e146842` | Updated to remote main before adding this record and the current plan             |
| `lapis-notes`   | `3580e280a75e`                             | Updated to remote main; clean at app verification; later unrelated work preserved |
| `mira-mde`      | `a96e4303e61a1c5324b0134291ffe86239dc535f` | Updated to remote main; original local tarball retained                           |
| `design-core`   | `bcd2db67d4ed`                             | Updated to remote main; no tracked changes                                        |

Reconciliation used `jj rebase -r @ -o main`
for each default workspace, preserving its old local work on named bookmarks.
It did not move the temporary Sync stacks into main.

After app verification, unrelated Homebrew distribution work appeared in the
Notes default workspace (`packages/desktop-deno/scripts/distribution.test.mjs`).
It is outside this slice and was left untouched. The app build and smoke check
precede that test-only change; no claim of a clean Notes working copy is made
for the final handoff.

## Preserved work and next release inputs

| Work                         | Recoverable reference                                           | Disposition                                                                                                               |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Plugins runtime stack        | `local/sync-runtime-pending-20261014` at `069401fb`             | 23 local commits; includes the four prior planning/foundation/UI commits. Transfer in 0C after dependencies are released. |
| Previously local Plugins UI  | `local/main-before-sync-2026-10-14-14d5df26`                    | Preserved as part of the runtime stack; absent from remote main.                                                          |
| Notes runtime foundations    | `local/sync-runtime-qualified-20261014` at `5f672a5a`           | 15 local commits; rebase and qualify the required public-package release in 0B.                                           |
| Unfinished Notes navigation  | `local/sync-navigation-pending-20261014` at `5d93b9ce`          | Five files, 383 insertions/241 deletions; still unqualified and uncommitted. Not admitted to a release.                   |
| Local Notes registry records | `local/registry-records-before-refresh-20261014` at `a86ea463`  | Their record/archive contents already match remote main; do not duplicate them.                                           |
| Design Core prerequisites    | `local/shared-sync-prerequisites-20261014` at `af50a89d`        | Two commits for status/copyable labels and mobile tab-count accessibility. PR/release review belongs to 0B.               |
| Original Mira qualification  | `local/sync-editing-sessions-prefetch-20261014` at `4cddcaf3`   | Original qualified source retained separately from its rebased version.                                                   |
| Reconciled Mira sessions     | `local/sync-editing-sessions-reconciled-20261014` at `b16f0937` | One source commit rebased onto current main. Focused checks pass; PR/release qualification remains pending.               |

The Mira default workspace retains `.local/packages/lapismd-mira-0.0.2.tgz`
as its original unrelated working-copy change. Its before/after SHA-256 is
`9365198c2c49a2e26ebc0529b32925fec0692236317b6bc583dd46685937284b`.
The earlier image and bullet source changes already match remote main.
No temporary workspace or development data was deleted.

## Conflict resolution and focused evidence

Mira's fetch followed rewritten upstream release history and exposed conflicts
in the old local ancestry. The source-session commit was rebased directly onto
current main, removing that obsolete ancestry from the active Sync stack.
Two overlapping files remained: `scripts/check-release-changesets.spec.mjs`
and `spec/src/spec-governance.md`.

Retained the released upstream implementation of the no-local-main Changesets
fixture and its matching specification. It includes controlled fixture metadata,
explicit Git-store discovery and major-compatible YAML checks. The old local
fixture repair is superseded; all editing-session source changes remain intact.
The resolution is incorporated into `b16f0937`. Main and the reconciled Mira
Sync ancestry have no unresolved conflicts.

- `node --test scripts/check-release-changesets.spec.mjs`: before resolution,
  one failed file due to conflict-marker syntax; afterward, three tests pass.
- `pnpm --filter @lapismd/mira exec vitest run src/preview/editable-markdown-preview/editing-session.test.ts src/preview/editable-markdown-preview/serialized-writer.test.ts`:
  ten tests pass in two files.
- Prettier on the two resolved files and `pnpm spec:validate`: pass.
- Explicit spec-first comparison from Mira main to `b16f0937`: nine protected
  files and four canonical chapters pass. Run with `GIT_DIR` from `jj git root`,
  `GIT_WORK_TREE` set to the Sync workspace and full commit IDs; plain bookmark
  arguments could not resolve from the non-colocated workspace.
- Mira `pnpm audit --json`: exit 0, no advisories.

These are rebase checks, not a replacement for stage 0B's required release gates.

## Main app verification

The Notes main installation still resolved AI/Markdown/controller through old
local tarballs. Refreshed it with
`CI=true pnpm install --frozen-lockfile --ignore-pnpmfile`. The first non-CI
attempt stopped for pnpm's noninteractive module-replacement prompt.
The committed manifests/lockfile and local loader configuration are unchanged.
Real paths now resolve registry packages, including Design Core 0.3.2,
Mira 0.0.3, AI 0.1.5, Markdown 0.1.6 and AI Controller 0.1.0.

`pnpm build:web` passes all nine dependency/build tasks. Its existing build
scripts also run 29 native-service and 28 server tests, all passing. The build's
generated API version-metadata diff was restored; Notes has no tracked changes.

The focused command
`pnpm --filter @lapis-notes/web exec playwright test -c playwright.config.ts e2e/web-host.spec.ts -g 'OPFS vault and workspace layout survive a full PWA reload'`
passes one test against the freshly built main preview. An initial invocation
with `CI=true` refused the already-owned preview port before running a test;
the normal local invocation reused that fresh process.

Manual review uses a separate origin to avoid the existing 4174 service-worker
cache and vault data. Created `Sync Stage 0A Review` at
[http://127.0.0.1:4175/](http://127.0.0.1:4175/), then used Files → Create File
to open `Untitled.md`, typed the review text, saved and reloaded. The editor
retains the text and the status bar reports zero Problems. No existing note
contents were changed. Review screenshot is retained locally at
`.release/sync-stage-0a-review.jpg`; it is not a visual baseline.

To restart this preview from the Notes main workspace, run
`pnpm --filter @lapis-notes/web exec vite preview --host 127.0.0.1 --port 4175`.
Do not use the local plugin-install wrappers for this registry-backed check.

## Remaining work

Stage 0B must prepare and release the required shared-package PRs before the
temporary runtime is consumed. Stage 0C then rebases/lands the plugin/host
stacks, resolves remaining conflicts, verifies main and removes superseded
workspaces after preserving their evidence. The unfinished navigation change
still needs explicit qualification or continued parking.

No shared-package PR or release, Sync activation, full catalog/platform run,
visual-baseline update or temporary-workspace cleanup occurred in 0A.

The dependency audits are recorded separately from functional checks. Plugins
audit exits 0 with two moderate and one high finding under its existing policy.
Notes audit exits 1 on its unchanged committed lockfile, reporting 8 low,
39 moderate, 31 high and 3 critical findings. No audit exception or dependency
fix was added. Required shared-package release gates must resolve their own
blocking findings in 0B; this checkpoint does not qualify a release.

The plan/handoff commit stays local for review. Pushing main would trigger the
repository's complete CI workflow; that broad run is deferred by the user's
targeted-testing instruction. This does not waive the future PR/release gates.
