# History transient feedback qualification

## Regression and ownership

Public Server 28d10a6-slim has the released Notes cohort and passes original
startup, real Mod injection/hooks, UID, read-only operation and shutdown. All
four published agent Mods also run on that server online and after offline
cache recreation. Its immutable public index is
`sha256:73ef8e7fcb95ca933ad1ae5b40c0ecb9ebca0357ba75acf2ee9d1d78431b7d56`.

The unchanged cold packaged-frontend budget (600 dormant plugin assets, fewer
than 200 commands and 100 database calls, 20-second post-readiness sample)
failed three times at 100, 101 and 100 database calls. File-command fan-out no
longer scales to the former 609 requests, but healthy History observation
repeatedly invokes `clearNotification` for repository-history and
history-search-index notice IDs. Recorded HTTP 409 replies were ordinary
ALREADY_EXISTS directory creation, not the command-lease defect fixed elsewhere.

The owning `repositoryFeedback` adapter reports these notices with persist:false
and already dismisses them through the public workspace-host controller. Its
additional persistent clear was unnecessary and emitted remote database writes
on every healthy poll. Recovery now retains that transient dismissal and does
not touch persisted notification history. Public signatures and service
ownership are unchanged (LN-HIST-019).

## Source qualification

Exact regression command:
`pnpm --dir packages/history exec vitest run src/lib/repository/components/repository-feedback.test.ts`.
Before implementation: three functional failures (20 unwanted clears on healthy
polls, one on recovery, and one after clipboard success). After implementation: all three regressions pass.
No assertions, request budgets, deadlines or quarantines were relaxed.

### Passing source and consumer evidence

On the isolated source checkout at base 50b5c915:

- History check, 26 unit tests, 96 repository tests, build and publint pass.
- Root check and test each pass all 18 tasks; serial build passes all 17 tasks.
- Release tooling and signature-fixture tests pass 199/199. Deterministic runtime
  payload verification passes (SHA-256
  `ba9afce6b235184d7c4fee91d2f174c782dba8f0bbee0acaeca53aa70a80e4eb`).
- Audit uses only existing documented exceptions; no new ignore was added.
- A restarted cold History Storybook process passes all 26 cases in five files.
  The initial optimizer reload attempt had two module-import failures; assertions
  and timeouts were unchanged.
- An isolated Server consumer rebuild using the unpublished source tarball passes
  the original 600-dormant-asset budget on remote Docker context omarchy:
  **121 commands / 75 database requests**, with **57 / 68 at readiness**, followed
  by the unchanged **20-second** sample. No `clearNotification` calls remain.
  Original limits stay fewer than 200 commands / 100 database requests.

Consumer input tarball SHA-256 is
`886b0d0436fcc01ec719b8ce7d765affddbced281566d228eb03dc91ee5443f1`.
Its package version is still 0.2.3 because this is an unpublished source candidate;
this is not evidence for registry 0.2.3. The temporary consumer uses the public
28d10a6 slim backend and rebuilt candidate frontend. It does not qualify the
published frontend. The fixture enables core plugins plus 600 dormant assets;
it does not represent all real plugins active.

Local receipts: `/tmp/lapis-history-feedback-{colocated-check,colocated-test,colocated-build-serial,release-tests,storybook-restart,consumer-budget-retry}.log`.

### Broader catalog gate remains blocked

The exploratory full catalog run first stopped in its first eighth at four
failed files / six failed tests, including optimizer-reload module errors.
Restarting with the dependency cache retained stopped at two failed files:
Bases Kanban Roles, Notes and Tasks (three failures), plus the parked Sync
History import (zero executable cases). Static catalog build also fails to
resolve `@lucide/svelte/icons/qr-code` from parked Sync. These failures are not
waived, skipped or treated as passing. With the helper restored to base 50b5c915, the exact Kanban and Sync targets
reproduce two failed files / three failed tests (three other Kanban tests pass).
The baseline static build fails on another unresolved parked Sync Lucide import,
`refresh-cw`. The owning surfaces are Bases Kanban stories and parked Sync
packaging/catalog integration. Receipts are
`/tmp/lapis-history-feedback-storybook-base-repro.log` and
`/tmp/lapis-history-feedback-static-base-repro.log`. The helper was restored to
the candidate after both reproductions. The source PR remains draft until
required CI and any required catalog gate are resolved or explicitly accepted.

## Delivery gates

Source fixes belong to History, not a Server wrapper or package patch. npm
publication is explicitly held, including Terminal UI; no npm release, public
plugin archive or registry dispatch is authorized by this qualification. A
released History version and normal Server registry intake remain required
before the public image can claim repaired database-budget acceptance.
