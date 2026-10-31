# Bases and History release continuation

The approved source eligibility repair `1a65e351c9e2` had not reached remote
main. Duplicate that committed slice onto the qualified Bits patch cohort
(`b92f14e1`), preserving the original release workspace and its uncommitted
framework intake. The original before/after evidence remains immutable in
[the source receipt](2026-10-30-bases-history-release.md).

The sole merge conflict is the LP-SPEC-016 table row: retain the approved Bases
and History eligibility, the separate explicit-hold behavior and every existing
publication/signing gate. The composed patch, installed package graph, package
implementations and native source pins are unchanged from
[the qualified intake](2026-10-31-bits-focus-patch.md).

The exact approved-eligibility regression passes one case. Complete isolated
Docker release tooling passes 163 cases with zero failures or skips, run
`lapis-plugins-validation-f88bdd9b-6a83-4884-bcdc-e93d449dbebb`; log
`/tmp/lapis-plugins-release-eligibility-tooling.log`. The existing explicit-hold
tests still prove held packages cannot open a version PR. A fresh `pnpm audit`
exits zero with no new exception. Semantic specification discovery succeeds.

Hosted source checks, the generated Changesets version PR, qualified versioned
artifacts, actual npm/GitHub publication and Desktop intake remain separate
required steps. A successful eligibility query does not constitute a release.
