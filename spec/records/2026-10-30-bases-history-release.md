# Bases and History release intake

Source base: main `879581d1549187bdbac2d75b40d02e0df46e721a`.
Requirements: LP-SPEC-015/016/017/024/029/038.

The user approved completion of governed public source/version pull requests,
merging after required checks, publication and actual registry/artifact consumer
verification. This supersedes the prior Bases/History hold. The release script
had preserved their Changesets indefinitely, so Version Packages reported no
releasable changes although both packages have pending approved work.

Remove these two active holds while preserving explicit hold partitioning for
future releases. No component contract, package identity, signature authority,
archive layout or immutable published version changes. Current pending minor
Changesets select the next Bases and History versions independently.

Exact regression:
`node --test --test-name-pattern 'approved Bases and History' scripts/version-public-packages-releasable.test.mjs`.
Before: one failure, default eligibility false rather than true. The original
explicit hold tests remain separate and continue proving held entries cannot
be consumed accidentally.

The old release-auth continuation fix `26328af6` is an ancestor of source base
through PR #42; no replay is needed. Default and file-limits/Markdown workspaces
remain preserved, and the conflicting local main bookmark is left untouched.
Source/qualification uses an isolated workspace on origin main.

A clean native `pnpm install --frozen-lockfile --ignore-pnpmfile` succeeds with
the registry lock, no private source remapping or old framework archives.
The published JJ History peer is current; prior local archive evidence is
historical. Focused/required check and actual release receipts follow.

## Source eligibility qualification

The exact approved-eligibility target passes 1/1 after the correction. All five
eligibility/explicit-hold cases pass, and the complete release-tooling suite
passes 163 cases. Spec Validator doctor passes 11 checks with no warnings; QMD
semantic discovery succeeds. `pnpm spec:check` and App-ownership pass.
`pnpm audit` succeeds with the same two ignored low findings in the existing
policy; no advisory exception is added or changed.

Both packages pass strict Svelte/type checks with zero errors/warnings. Bases
passes 164 unit cases; History passes 23 unit and 96 repository cases. Both
build/publint lanes pass. All 17 public package builds and the complete static
Storybook catalog pass on the clean registry graph.

The first native group lacked the private Sync catalog's separate frozen
install, emitted unresolved-dependency scans and was interrupted with no
completed cases. After the normal child frozen install, the cold Bases/History
group passes 34 cases but one History Repository import suite fails during a
reported dependency-optimizer reload. The exact cold History Repository file
then passes 11 cases unchanged. A fresh complete affected-family run passes all
45 cases across 11 files, zero failures. No story or assertion change is needed.

Both current-source npm archives pack normally. Runtime payload verification
passes for the main product source 879581d1, with pre-version 0.1.4 coordinates:
Bases SHA-256 `e8b7e4235e8006c06b10ffe939485cec5f20498b894f92470eeca344ea19392e`,
History SHA-256 `a38223f9aafd9dd252d763aaf81d0af3a3fad9c1e8a1bb92853552d2b99595a3`.
These are source prequalification artifacts, not replacements for immutable npm
0.1.4. Final dependency floors, versioned artifact reproduction/signing, full
hosted gates and actual registry/release receipts remain to complete.
