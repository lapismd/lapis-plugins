# Skill release peer versioning

Feature source PR 113 merged as `48d4fd7a` after all hosted gates passed.
Generated version PR 114 exposed five unintended 1.0.0 releases: AI, Canvas,
Graph, Slides and Transcripts. The actual `pnpm exec changeset status --output`
plan reproduced all five. Adding compatible Markdown 0.3 unions alone still
produced those majors under Changesets 2.31.1's default peer policy.

The five packages now retain their existing Markdown 0.2 peer/development floors
and also admit `^0.3.0`. The documented Changesets 2
`onlyUpdatePeerDependentsWhenOutOfRange` option preserves declared bumps when
the new version is already compatible. Genuine out-of-range peers still
escalate to major; fixed and linked release groups remain empty. The CLI and
Actions major versions stay unchanged. The frozen lock and actual CLI regression
make a future change in this experimental option fail qualification.

Primary source: [Changesets 2 experimental options](https://github.com/changesets/changesets/blob/main/docs/experimental-options.md).
The installed assemble-release-plan source was also inspected: its default
major escalation ignores range compatibility unless this option is enabled.

The first isolated CLI fixture failed because it lacked the `main` history
required by status. The corrected fixture uses an isolated Jujutsu repository.
The exact `node --test --test-name-pattern='release planning preserves'
scripts/version-public-packages.test.mjs` target then failed 0/1 before the
option and passed 1/1 afterward. It verifies a compatible consumer stays at
0.1.14 and an incompatible consumer still advances to 1.0.0.

The actual corrected 17-package plan has no unintended major releases:
Bases/Canvas 0.4.0 and Markdown 0.3.0; AI 0.1.14, Graph 0.1.12, Slides 0.1.4
and Transcripts 0.2.8. Other active packages retain their planned patch releases.
`pnpm ci:release` passes: audit, all three specification lanes, ownership and
package boundaries, 228 release-tool tests, all 51 package build/check/test
tasks, 17 npm candidates, 17 verified runtime payloads and the static catalog.
Receipt: `.local/validation/runs/lapis-plugins-validation-2710e298-a59b-48ba-9a48-b35839e6ffa4/result.json`,
source `f3923a58`, Node 24.15.0 and pnpm 10.34.5. The focused versioning,
releasability and skill-resource suites pass 10/10.

All 17 complete runtime payload SHA-256 hashes exactly match the API 0.6
qualification recorded in `2026-11-14-skills-api06-release-intake.md`.
Every npm file also matches, except the five `package/package.json` files;
structural comparison allows exactly their ten intended Markdown peer/dev
range strings and confirms every other field is unchanged. The frozen lockfile
is byte-identical. This correction changes installation/version planning, with
no changed runtime, styles, skill instructions, public type files or resolved
dependency graph. The prior 350 cold interaction/axe and 30 pointer cases
therefore cover the same runtime bytes. Normal hosted CI still selects all
interaction and pointer gates; no selection, assertion, deadline or skip is
changed.

Operator preflight used npm 11.19.1 and `pnpm release:trust:check`. All 17
configuration reads returned E401: the local operator session is unauthenticated.
This is distinct from CI's OIDC publisher. The required read-only inspection
must complete with operator authentication before publication. No token is
added to CI and no release gate is bypassed.
