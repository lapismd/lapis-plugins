# API 0.6 plugin skills release intake

API source PR 113 and version PR 114 merged as `1d494734` and `1080bdb4`.
Release run `43635116316` passed every enabled validator and published the
API 0.6.0, File Explorer 0.2.8, Language Service 0.1.6 and Workspace 0.4.3
cohort. Registry verification exhausted its existing propagation retries while
npm metadata still omitted API 0.6.0. A later clean registry consumer, using the
same release manifest and public-package verification script, passes without
source changes. Full recovery release run `43637981701` retains all normal gates
and idempotent publication. Hosted validation, publication, registry verification,
all four package-scoped GitHub releases and dependency notifications now pass.

The exact framework publication test was changed to require API 0.6 in the
supported union and reproduced one failure before implementation. The framework
catalog, Canvas minimum override and all 17 active generated package peers now
admit that host. The exact regression passes afterward. Root development
ranges select the actually published cohort. Previous 0.2/0.4 API support,
Canvas 0.2.4 minimum, plugin IDs and parked exclusions remain unchanged.

`pnpm ci:release` passes in the isolated Linux worker: audit, three specification
lanes, explicit App ownership, package boundaries, 227 release-tool tests,
all 51 package build/check/test tasks, 17 npm candidates, 17 verified runtime
payloads and the static Storybook build. Active package unit suites report
1,445 passing cases. The source receipt is
`.local/validation/runs/lapis-plugins-validation-b364202b-d28b-4e63-b72b-1aa9d4293d9b/result.json`,
using source `ed36a1e6`, Node 24.15.0 and pnpm 10.34.5. Later edits update
canonical prose and the observed report provenance only.

The exact `node --test scripts/check-framework-publication.test.mjs` suite
passes 4/4. `node --test scripts/plugin-skills.test.mjs` passes 4/4, including
packaged skill parity and signed resource inclusion. Composition validation
reports 76 families and zero findings. The initial local formatter command was
not installed by this repository; the existing pinned Server formatter checked
the newly authored record and Changeset without dependency changes.

`pnpm audit:bases` passed all 81 behavior cases but its final report hook failed
on stale dependency provenance. JSON comparison showed only
`implementation.dependencies.@lapis-notes/api` changing from 0.4.0 to 0.6.0.
`node scripts/bases-compatibility.mjs --refresh-provenance` passed 81/81 and
changed only that field; the exact ordinary audit then passed 81/81. Accepted
baselines, observations, source hashes and upstream identities are untouched.

`pnpm test:storybook` passes all eight cold browser shards: 350 interaction/axe
cases pass and the existing 57 parked Sync cases stay skipped. No assertion,
deadline, skip inventory or visual baseline changed. Receipt:
`.local/validation/runs/lapis-plugins-validation-5f173679-a1eb-4120-9f0d-ba6fd2a4caf1/result.json`.
Final mapped specification checks and generated package metadata checks pass.
`pnpm test:canvas-browser` passes all 30 actual browser pointer cases against a
fresh built public catalog. Receipt:
`.local/validation/runs/lapis-plugins-validation-6b484206-8c3e-4706-8b9d-8ea468c834cc/result.json`.
These browser results do not claim macOS/Tauri native acceptance.

Comparison from qualified source `ed36a1e6` to the final slice shows only
canonical/evidence prose and the single observed dependency-version field in
the compatibility report changed afterward. Runtime, package manifests,
lockfile, skill content and test bytes are identical. Final specification and
new-document formatting checks cover the later prose. Production signing and
npm/GitHub publication remain in the normal protected CI release route; its
`STATIC_RELEASE_ENABLED` gate is already true and was not changed. The same public
package source must supply npm assets and signed archives. The four skill
packages retain their original feature Changeset; peer compatibility has a
separate patch Changeset for the active cohort. No local paths or dependency
overrides are added for release intake.

The automatic, non-publishing Notes run `43635098091` had earlier failed its
Cloudflare artifact acceptance on a plugin archive fetch (`TypeError: Failed
to fetch`). The complete manual publishing and recovery runs both passed that
same unmodified lane; no retry, assertion or timeout change was made. The
registry propagation failure and this earlier failed attempt remain distinct
from the successful final release run.
