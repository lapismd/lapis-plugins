# Repository remote progress and retained-outcome observation

LN-HIST-020 presentation now projects pending progress only to the selected
target, including newly mounted subscribers and snapshot reads. This transient
projection never mutates the native snapshot. Following a failed command
response, one passive service read can expose its retained request identity.
That recovery does not repeat the mutation. If status is unavailable, the
original failure and last observation survive; disposal fences late recovery.

The exact command
`pnpm --filter @lapis-notes/history exec vitest run
src/lib/repository/controllers/remotes-service.test.ts` initially reported two
failures and six passes: pending fetch progress was absent and a retained native
publication was not observed after a lost response. The first implementation
passed seven and failed the existing disposal assertion because it notified an
empty target list. Progress emission was narrowed to the selected existing
target; the original assertion was preserved. Eight cases then passed. Two
additional cases cover an unavailable recovery read and disposal during recovery;
all ten final cases pass, zero failures.

Source qualification uses Node 24.10.0, pnpm 10.34.5 and the normal registry
lockfile/API 0.6.2, without a package override:

- History check: zero Svelte errors/warnings and successful TypeScript check.
- History test: 59 unit cases and 96 repository cases pass, zero failures.
- History build/package: public dist build and publint pass.
- Full package check/test/build: all 51 tasks pass.
- Release tooling: all 228 cases pass.
- Audit passes the tracked policy with two existing ignored low advisories;
  no new ignore or audit exception is introduced.
- Full cold catalog interaction/accessibility lane: 392 pass, 57 existing skips,
  zero failures across 76 files, in eight serial groups. No story or assertion
  was removed and visual baselines remain unchanged.

The initial aggregate source check reported three missing mapped chapters after
adding the patch Changeset. Distribution, native-boundary and governance topics
were updated rather than exempting the change. Subsequent canonical validation,
mdBook, spec-first, package boundaries, App ownership and no-Tailwind checks pass.
The aggregate then reached archive preparation and correctly refused a dirty
Jujutsu working-copy commit. Artifact qualification requires the immutable
source checkpoint next; that technical gate is not reported as passed here.

History 0.3.0 publication follow-through is separately complete: source PR #121
and version PR #122 produced GitHub run 43674225982. Registry submissions #133
and #134 passed and merged; production run 43679750055 succeeded. The live
registry reports 0.3.0 and its `/download/history/0.3.0` bytes match the GitHub
archive: 190,854 bytes, SHA-256
`06201c219f9c3610b1e6fdd1399d1dda5d2f5f8a9d7dcb97260f1a3a7957fc3e`.
The npm tarball matches its published SHA-512 integrity. An initial Python URL
probe received HTTP 403; the independent curl request succeeded with public
CORS and supplied the verified download bytes.

This source controller fix does not register runtime UI or qualify native
transport, credential custody, Desktop/Server adoption or an application
release. Next: complete immutable-head archive/static-catalog qualification,
then consume the shared port in both hosts after native service wiring.
