# Search settings recovery

Status: source and focused host qualification complete. The previously accepted
inherited repository failures remain separately assigned; the unchanged catalog
orchestration failure is accepted for this slice under the user's standing
instruction to make the logical decision and keep the migration moving.

## Scope

Isolated workspace `lapis-plugins-search-recovery-20261026` starts at qualified
Search/Bases source `bd305e58`. The unrelated Markdown edits in the default
checkout are preserved. No public API, dependency ranges, host routing, conflict
authority, test guards or visual baselines change.

Desktop's existing Search settings native acceptance found that saving the
chosen external configuration correctly writes the exact bytes and clears the
Problems entry, while live Search controls still show the previous settings.
The plugin and mounted panel retained settings snapshots and did not observe
the public owning-App configuration recovery event already used by Graph.

Search now observes `plugin-data-updated`, filters other plugins and ordinary
`plugin-save` echoes, and disposes both observers with their owning component.
Recovered settings are applied without saving again; native embedding/chunking
changes use the existing configuration controls. Queries, scope and unchanged
result expansion are retained. A later partial save preserves recovered data.

## Exact regression and diagnostic checks

The quiet source diagnostic command
`LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm --dir packages/search test -- src/lib/native-search-manager.test.ts --testNamePattern='uses recovered settings'`
forwards the literal delimiter and executes the complete Search unit suite.
Before: 109 pass, one failure; after: 110 pass, zero failures across 13 files.
The failing assertion is the unchanged `showMoreContext` recovery value and
retained recent queries, not native conflict persistence.

The correctly scoped command
`LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm --dir packages/search exec vitest run src/lib/native-search-manager.test.ts --maxWorkers=1`
passes all 25 cases after adding actual Plugin lifecycle, unrelated/save-echo
filtering and changed native embedding/chunking coverage. These host units are
diagnostics; the final owning Docker lane remains a separate gate.

The new production-shell story
`Plugins/Search/Panels/Recovery/Recovered Settings` exercises external recovery
and a later partial save while retaining the authored query. It is explicitly
`visual-pending`. No baseline is added or approved.

## Docker qualification and public artifacts

Full receipt `1ed952e2`, snapshot `898477ad`, retains the one strict type
failure below, the original exact 25 units, all 112 Search units, all 16
repository unit tasks, all 15 build tasks and public npm/runtime artifacts.
The complete catalog has 283 passes (68/92/54/69), then an orchestrator error
before the final two Link Preview Acceptance cases; it is not a full pass.

Corrected source receipt `8f3debb2`, snapshot `ba1d987a`, passes strict Search
checks with zero errors/warnings, all 25 exact controls, all 112 Search units,
all 17 cold Search stories and every one of the 16 package strict-check tasks.
It builds and normally packs the public Search artifact. Its first spec-first
attempt fails three mapped chapter omissions; those distribution/native-service/
governance updates are included in the final closure rather than bypassed.

Closure `3a1819df`, snapshot `37133463`, passes canonical validation, mdBook,
spec-first, App ownership, package policies and 58-family story parity. The full
static catalog builds, the public package is packed again and its runtime
payload is built and verified. The public npm SHA-256 remains
`2e7f0c428c04344105305a755a657c53ff61b710ed47c95d2ad9596d2476f680`;
the matching private runtime payload is
`0818495e40c3c33bf6e0355223b194c35871b440b4519b979ba8cc361ea65eec`.
Publication and production signatures remain outside this private intake.

## Inherited repository failures

The exact missing `LinkPreviewAcceptance.stories.ts` passes both cases in the
closure. Repeating original shard four has 69 passes and the same browser
connection/createTesters error before those cases. The worker then checks out
unchanged parent `bd305e58` with the exact same 13 public dependency archives;
that parent repeats the identical 69-pass browser error. This is independent
of Search recovery code. The worker's cgroup reports zero max/OOM/OOM-kill
events and a 10.02 GB peak below its 12 GiB limit; its live process receipt
shows one browser, not accumulated browser families. Assertions, timeouts,
file selection, isolation and fatal diagnostic guards remain unchanged.

The unchanged tracked lockfile still reports one high Zod 3 advisory
`GHSA-mrhx-c7xc-m3w5`. CSV retains four known Tailwind findings; repository
release tests retain the committed-lockfile policy failure (139 pass/one fail).
The parent evidence `2026-10-26-search-bases-intake.md` retains their earlier
reproduction and ownership. These commands remain failed, assigned respectively
to dependency maintenance, CSV styling and release-lockfile policy. The browser
runner defect is separately reproduced above. Explicit acceptance is required
to treat any of these inherited required-lane failures as non-blocking.

## Consumer acceptance

Desktop consumes the final public archive with API `aa1a5d52` and Design Core
`6f33b681`. All three original settings native cases pass, including the exact
chosen disk bytes, refreshed controls, authored query and next partial save.
All 17 original Core native journeys, two new native owner/safe-mode recovery
cases and the complete 15-case hidden API inventory pass. All 148 affected
Desktop catalog cases pass across both themes and viewports. Desktop's 2,056
complete earlier catalog cases retain their prior Search archive cohort.

Hosted source retains API/host product bytes from `eea52e15` and consumes the
same final Search/Design Core archives. Old archive `aa1c` has zero passes and
one failure at the live recovered Show more context assertion. Final receipt
`50744f7e` passes that real external-configuration recovery, retained query,
later partial save and unrelated data, plus native selection/Canvas/write fence/
refresh/rebuild/detach/disabled replacement. All 73 Web units, six exact tests,
strict checks, public/native builds and canonical specification pass. Full
consumer catalog/browser closure is recorded by the Notes owner.

The source commit closes this prerequisite with those bounded inherited
exceptions recorded. Their remediation, visual approval, registry-only
distribution and publication remain separate work.

## Strict-check correction

The first Docker aggregate reports one Search Svelte type error: the existing
private panel-plugin interface does not contain `manifest`. The mounted panel
already looks up the stable `search` plugin ID, so its recovery observer now
uses that same ID without widening a public or private host interface. The
exact strict host diagnostic passes zero errors and zero warnings. The early
archive and native recovery results retain their own snapshot; final Docker
strict/public artifact and focused consumer evidence will select the correction.

## Resumed source closure — 2026-10-26

The resumed change has byte-identical production, test and story files to
qualified `ba1d987a`; only mapped governance and this evidence differ. The owning
source and both consumers retain the results above. The root coordinator applies
the user's standing no-confirmation decision to the already accepted Zod, CSV
and release-lock baselines and the demonstrated unrelated runner defect.
None of those failed commands is relabelled as passing.

One bounded retry `432706d1` uses the unchanged current headless Chromium channel
and exact `pnpm test:storybook --shard=4/4`. Its stream again records **69 passes
and one browser-orchestration error** before Link Preview Acceptance. The exact
two Link Preview cases already pass independently in `3a1819df`, and the same
source parent reproduces the orchestrator failure. No assertion, threshold,
timeout, isolation rule, file selection or production runner is changed.

The remote worker then refuses SSH during report retrieval; this retry has no
complete transferred receipt and is not a new gate pass. Existing complete
receipts remain authoritative. Only documentary formatting and specification
checks are run locally for this closure; there is no native product-test fallback
and no repeat of the accepted failing aggregate.

Document closure at 2026-10-26 09:14:33 UTC:
Prettier 3.3.3 passes the changed record/verification table. The installed public
`spec-validator` 0.1.4 `check` command passes all three lanes: validate, mdBook
and spec-first. The final public archive retains exact SHA-256 `2e7f0c42`
above; Jujutsu confirms every change since `ba1d987a` is under `spec/`.
