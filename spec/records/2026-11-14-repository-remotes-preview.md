# Repository remotes and credentials: UI review slice

## Scope and source

Requirement: LN-HIST-020; existing LN-HIST-012/013/014 and LP-SPEC-054 remain.
Source change: `ykmlxmxm`, based on remote main
`48d4fd7abc585d05b8ccfa3bf4c161d4c301117a`.
Node 24.10.0, pnpm 10.34.5, spec-validator 0.2.0 (latest registry release).

This implements slice 1 only. The user's accepted plan requires UI review before
Desktop or Server adoption. New components mount only through catalog memory
adapters; no real credential storage, network transfer, native service, user
vault, installed application or production configuration was changed.

Desktop, Server, Plugins and jj-store remotes were fetched with Jujutsu. The
jj-store SSH fetch failed through the existing agent; its existing HTTPS remote
succeeded. Existing dirty Desktop/Server work and the Plugins main bookmark
conflict were preserved. Design Core was fetched during accessibility diagnosis;
no Core source change was needed. Implementation uses an isolated JJ workspace.

The [review inventory](../../docs/repository-remotes-preview.md) lists the
running catalog links, states and subsequent native slices. Stories remain
`visual-pending`; screenshots are review artifacts, not visual baselines.

## Baselines and repaired failures

- Existing boundary: `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test:storybook
-- stories/plugins/history/repository/Repository.stories.ts`. Initial Vite
  optimization invalidated the import before tests (one failed suite, zero
  executed tests); the deliberate repeat passed 11/11.
- `pnpm --dir packages/history check`: baseline zero errors/warnings. During
  implementation, 26 errors/21 warnings from rune/snippet naming collisions
  returned to zero errors/warnings after correcting the source.
- New preview family: the first import again hit dependency optimization before
  tests. The first executed run passed 15/26 with 11 failures. Mounting Settings
  after the real shell, closing controlled dialogs during fixture teardown and
  giving the active surface sole push-dialog ownership fixed the failures. An
  exact two-case repeat exposed one premature visibility assertion; waiting for
  the real dialog to become visible preserved that assertion and passed both.
- Final complete affected History boundary, same command with both History and
  Remotes story files: **40/40 passed** (29 new previews, 11 existing stories),
  including accessibility, both themes, narrow layouts, keyboard dismissal and
  focus return, target isolation, explicit publication, credential draft
  clearing, host scoping, opt-in sync and unknown-outcome recovery.
- Root check initially failed because the story inventory used `git ls-files`
  in a non-colocated JJ workspace. New exact inventory regressions failed 2/2
  before the fix. The owning script now reads the current JJ inventory,
  preserves Git-only support and refuses a stale-index fallback after an
  inventory failure. All three inventory tests and the complete 32-case
  `node --test scripts/spec-validation/*.test.mjs` suite pass.

## Passing source and package checks

Native commands below deliberately select the supported host runtime; these
are macOS source checks, not Linux Docker/CI or actual host adoption receipts.
The root and parked Sync frozen installs match repository CI setup; neither
lockfile changed. Native commands used Node 24 explicitly in PATH.

| Command                                                                        | Result                                                                             |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm exec spec-validator doctor --json`                                       | QMD config/native index pass under Node 24; no global rebuild                      |
| `pnpm spec:search --semantic 'Repository History remote settings credentials'` | QMD search succeeded; canonical History chapter read                               |
| `pnpm audit`                                                                   | Pass; two low findings already covered by unchanged tracked exceptions             |
| `pnpm --dir packages/history check`                                            | Zero errors and warnings                                                           |
| `pnpm --dir packages/history test`                                             | 49 units and 96 repository cases passed                                            |
| `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm check`                           | 18 tasks passed; package, App-ownership, no-Tailwind and story-parity gates passed |
| `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test`                            | 18 tasks passed; 1,372 Vitest tests and 96 repository cases passed                 |
| `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm build`                           | 17 package builds/publint lanes passed                                             |
| `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test:release`                    | 227 passed                                                                         |
| `pnpm spec:check` / `pnpm spec:first`                                          | Validation, mdBook, mapped canonical chapters and functional lanes pass            |
| `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm build-storybook`                 | Full static catalog built successfully                                             |
| `pnpm --dir packages/history run pack` / `exec publint`                        | Public npm archive built; publint passed                                           |
| `node scripts/build-plugin-release.mjs --plugin history --commit <snapshot>`   | Private payload reproduction passed                                                |
| `node scripts/verify-plugin-release.mjs`                                       | Private payload/checksum verification passed                                       |

Private payload source snapshot:
`7e10a8cf60657506b5b282abb597e57b5dcf1291`.
An earlier private attempt incorrectly used the baseline label; it was discarded
and regenerated with this actual working-copy snapshot. No artifact was
published. Signed-publication paths remain covered by release-tool tests; no
public signed release or real signing credentials were used.

The npm archive SHA-256 is
`826aa081924f4e1530b2f675e089611615bd8806fbf9179c84b3f11679856d08`.
The reproduced payload SHA-256 is
`7bb3d0a71fddfdd480f960acb3ee6c873b41fc964a412db6dda5296da9cfe805`.
The default plugin runtime payload is unchanged: these new repository components
are public npm modules and are not adopted by the runtime plugin entrypoint.

## Complete catalog remains blocked

The first broad attempt lacked the parked Sync package's independent frozen
install. Static build failed on its unresolved icon imports. The repository's
existing CI install command repaired that prerequisite; the subsequent static
build passed. The associated browser attempt had three pre-test import failures
and six PDF timeouts and was stopped; it is not a qualifying run.

With prerequisites installed, `LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm
test:storybook` stopped after shard 1/8: **43 passed, 3 failed**, plus **2 failed
suite imports** (Source Editor Registry Screenshots and parked Sync History).
The failures were not waived and remaining shards were not reported as passed.

The three functional failures are existing Bases Kanban `Roles`, `Notes` and
`Tasks`: "Not implemented. The result of this interaction is unreliable."
They reproduce **3 failed / 3 passed** in an independent clean workspace at
unchanged main `48d4fd7a`, using its own frozen installs and this exact command:

```sh
LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm test:storybook -- \
  stories/plugins/bases/kanban/BasesKanban.stories.ts --browser.api.port=63423
```

Owner: Plugins/Bases catalog interaction infrastructure. The two import
failures remain catalog-runner/optimization gaps, not functional passes. Do not
push, release or adopt this slice using an aggregate catalog claim. Resolving
the broader gate, or explicit user acceptance of the reproduced baseline,
remains necessary before treating those failures as non-blocking.

## Review handoff

The local Storybook listens on `127.0.0.1:6017`. Raw logs and review screenshots
are retained under ignored `.local/remotes-preview/`; the independent baseline
workspace is retained for reproduction. No screenshot baselines changed.

Desktop/Server custody, SSH transport, native original-repository commands,
server encryption, cross-host cold acceptance and publication remain
unimplemented. Continue with the accepted later slices after UI review, keeping
their native proof separate from these catalog mocks. The existing conflicted
main bookmark is unchanged; no push or publication is authorized by this record.
