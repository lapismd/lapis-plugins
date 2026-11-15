# Version PR authentication qualification

LP-SPEC-016 retains independent public-package eligibility and manual publication
gates. Generated version PRs use the existing dependency App scoped to this
repository, with a read-only workflow token and non-persistent checkout. No key
was retrieved, copied or rotated. Publication/signing workflows are unchanged.

The exact new boundary test initially failed once with the workflow token's
write authority; after migration it passes 1/1. The complete release-tooling
suite initially passed 231/232: its existing version-action assertion expected
the mutable v1.8.0 tag. It now checks that version's resolved immutable commit,
retaining the eligibility ordering and manual-publication assertions.

The current registry version of spec-validator is 0.2.0, already selected by
the repository. QMD semantic search located Distribution, Governance and
Verification before canonical inspection. Doctor passed ten checks with the
existing warning about deliberate dependency-bot wrapper script aliases.
`pnpm audit` succeeded with two LOW findings already covered by the committed
audit policy; this slice adds no exception.

Hosted PR checks and generated-version PR acceptance remain pending.

Final local validation: the exact original main-push eligibility test passes
1/1, the new authentication boundary passes 1/1, and the complete release-tooling
suite passes 232/232 with no failures. `pnpm spec:check` passed all three lanes
(validation, book build and spec-first), and actionlint passed the changed
workflow. Formatter passed the changed files. No runtime, Storybook or package
artifact contract changed, so this slice does not regenerate those artifacts.
There is no pending eligible changeset on the inspected main; generated-candidate
acceptance must wait for a real public-package release intent.
