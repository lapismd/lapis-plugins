# Static release consumes the API-owned registry schema

Static metadata checks and signed-release preparation import
`@lapis-notes/api/registry/schema`; Storybook imports `@lapis-notes/api/build/vite`.
The active root manifest and installed dependency graph omit Community. CI waits
for API 0.1.1 and AI Controller publication, not Community publication.
Community remains parked. Four relay-only test files and their existing
assertions are retained under `scripts/deferred-nostr-tests`, exposed through
`test:release:nostr` for qualification when that route and dependency resume.

Verification: 12/12 focused publication/CI contract tests; 95/95 active tooling
tests (no skipped tests); 36/36 package build/check/test tasks; root checks
13/13 including audit; cold Storybook 175/175; static Storybook build and
specification checks pass. The exact static candidate regression passes through
the API export without a Community installation.

Ignored checksum-pinned API/framework hooks provide temporary acceptance only.
The inherited version preparation and portable lock refresh remain pending API
publication. No stale portable lock or candidate version slice is pushed to
main, and no npm publication, signing with production keys, release assets,
registry dispatch, deployment, or baseline update is performed by this slice.
