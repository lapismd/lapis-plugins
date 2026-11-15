# Native remotes presentation adoption

LN-HIST-021 adopts the reviewed components only when an executing host supplies
its native remotes port. The plugin owns one observation controller and review
host independently of footer/settings visibility. Log actions bind their source;
the split Git footer uses the working-copy source. Its existing working-copy
popover retains saved-local and diff presentation. No renderer schedules native
transfers or writes credentials into plugin data.

## Narrow regressions and fixes

`pnpm --dir packages/history exec vitest run
src/lib/repository/components/repository-host-composition.test.ts` initially
reports two failures and one pass: independent settings disappear without forge
accounts, and renderer synchronization still starts alongside native remotes.
After fixing these source boundaries, all three pass; legacy synchronization
remains available without the native port.

Nine focused tests in `repository-remotes.test.ts`,
`repository-host-composition.test.ts` and `repository-status.test.ts` pass. They
prove explicit-only review activation, target isolation, hidden-footer settings
and review lifetime, late-response fencing, transient load-error reporting,
independent storage/adoption controls and retained legacy/native selection.
The first production check identifies two type errors (optional binding narrowing
and custom-field metadata); both are corrected and the package check passes.

The new Native remote composition stories use the real enabled RepositoryPlugin,
shared App/Workspace shell and a memory-only host service adapter. Their initial
five-story run has two failures: one incorrect expected desktop custody label,
and a second action attempted before an earlier fetch settles. Correcting the
label and awaiting that same command's completion produces five passes. The
expanded seven-story run passes in light/dark/narrow presentations. Adding an
explicit requested-field focus assertion then reveals four failures: the shell's
initial dialog focus replaces the child input focus. The owning native settings
component now finishes field focus on the dialog's focus event. The same seven
stories pass cold, including the original focus assertion.

A standalone formatter first rejects nine Svelte files without its plugin. An
explicitly configured external formatter then unexpectedly emits empty files.
The affected browser attempt is stopped, and only those nine files are restored
from the immediately preceding JJ snapshot `396f2378`; the complete source tree
matches that snapshot after restoration. No source work is lost and no empty
component is committed. The restored seven-story run exposes the focus failures
above; the corrected final cold run passes all seven. Visual baselines remain
untouched.

## Qualification

The public component/fixture surface spans settings, status, JJ Log, Op Log,
legacy backup and the shared Storybook App bootstrap. Full owner check/test/build,
complete interaction/axe, static catalog, package pack/archive/signature and
App-ownership gates are required. Root check (18 tasks), test (18 tasks) and
build (17 tasks), canonical specification, App-ownership, no-Tailwind and
publint checks pass. All 457 catalog stories across 79 files pass interaction
and axe in eight serial shards. Parity reports 78 families and zero findings.
Static Storybook and all npm packs pass. Audit retains the repository's two
existing ignored low advisories, with no new ignore.

Cold browser review of the populated shell confirms the split Git footer,
vertically centered chevron, compact themed working-copy header and circular
transfer controls. The working-copy popover shows the matching source, and its
push action opens the exact remote/branch/bookmark/commit review independently
of the settings surface. No visual baselines are updated.

Archive preparation requires an empty JJ working-copy commit and initially
refuses the uncommitted candidate. This source candidate is committed before
running archive reproduction/signature verification and release-tool tests.
Candidate source `138a46a1` then passes complete `pnpm plugin:build` and
`pnpm plugin:verify`: every plugin payload reproduces deterministically and its
release metadata/signature checks pass. `pnpm test:release` passes with zero
failures. The History candidate payload SHA256 is
`d01d7d0f652a194bb367b5e6f39356fe584924f9d98e9dc5175ade0500ef52ae`.
These are local candidate artifacts, not a new public 0.3.2 release; the minor
Changeset supplies the production adoption version. Hosted CI is still required
before publication.

The new source stories and old preview inventory remain `visual-pending`.
Source fixtures do not qualify HTTP/Tauri admission, real credential custody,
network transport, scheduling or either cold application host. Desktop and Server
must consume released packages and complete their independent native acceptance
before the overall feature release.
