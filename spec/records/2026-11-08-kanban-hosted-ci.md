# Kanban hosted CI qualification

PR #62 initially runs at signed source
`404c3ba956f7b1fc497504fe7d0f885f851dddeb`, workflow `42469571491`.
The complete registry-only remote suite passes before the push. Hosted quality,
static Storybook, release artifacts and three interaction quarters pass.

The first unit attempt passes all package tests, then its pinned upstream JJ
installer receives HTTP 504. A failed-job rerun receives the same HTTP 504.
The initial third interaction quarter reports one unhandled browser connection
closure while starting Markdown Lint registry screenshots; no assertion failure
is reported. That job passes on the failed-job rerun without changing assertions or skips. All four hosted interaction quarters are therefore green on that source; the unit job remains blocked by the repeated HTTP 504.

The exact JJ browser-download URL also returns HTTP 504 independently. Its
official asset API serves the expected archive and SHA-256
`f35438350b5d61963aac5dd74ede510b31d6b9690769d1a6268cf058cc825f72`.

The installer now uses a single official-API fallback after transient HTTP or
transport failures, resolving only the same release and unique asset name.
Both routes enforce the existing digest; extraction still requires exactly one
root executable and the pinned version. Requests time out after 30 seconds.
Permanent HTTP failures, corrupt bytes, conflicting asset identities and API
failures retain blocking rejection. No authorization header or new secret is
introduced.

Exact regression command:
`node --test --test-name-pattern='pinned tool download' scripts/validation.test.mjs`.
The initial new regression fails once; all seven transport, integrity and
identity cases then pass with zero failures. The complete remote release-tooling suite passes all 190 tests with zero failures,
receipt `lapis-plugins-validation-3dfb80db-86d9-4624-ab00-15ebd6055a7a`.
Its fresh validation image also installed and verified the pinned tools through
the updated installer. The final exact seven cases pass after adding the
status-only fallback diagnostic. The complete registry-only `ci:release` lane passes all 51 package tasks,
190 tooling tests, audit/specification/ownership gates, 17 npm packs,
17 verified plugin payloads and static Storybook. Receipt:
`lapis-plugins-validation-34ef336a-4022-482e-a16e-74031923dcbe`, source
`c4221625652521017290786f8b02bffbec545b69`, with an empty archive inventory.
The fresh image reproduced HTTP 504 and recovered through the API before
verifying the pinned tools. All eight registry-only interaction/accessibility shards pass in the rebuilt
image: 271 passed cases, zero failures and the same 57 existing skips across
64 files. Receipt: `lapis-plugins-validation-c31faf58-3794-4e04-99fe-219dcb5b93a0`, source
`c4221625652521017290786f8b02bffbec545b69`, with an empty archive inventory.
No assertions, skips, visual baselines, tool pins or release approvals changed.
The follow-up is ready for a fresh hosted CI run.
