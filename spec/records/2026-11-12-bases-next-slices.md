# Next Bases compatibility slices — 2026-11-12

PR #83 merged as `d528063f235ddd5819f4809251400c676b213b0c` after hosted CI passed on `b42dd0b2`. Separate fix commits were preserved. The shard 4 browser disconnect passed on one retry; no source/assertion change was used for that retry. Historical local interaction failures remain separately tracked in the earlier qualification record.

## Collection operations — LN-BASE-048

Exact reproduction: `pnpm --dir packages/bases exec vitest run src/lib/bases-view/collection-compatibility.test.ts`: 16 failures / 4 passes before product edits.

The owning Bases dialect compiler lowers list literals and reserved method names before the SQL parser. Typed-array overloads and lexical callback variables fix membership/transforms/reduce while retaining native string matching and direct helper behavior. This adds no public export or dependency patch. Source and final validation evidence follows after implementation.

The expanded exact target passes all 31 cases. Workspace check/test/build pass (18/18, 18/18 and 17/17 tasks); the pre-expansion full unit run has 245 Bases cases and the expanded target adds three passing decimal-list cases. Specification validation, mdbook, spec-first and App ownership pass after placing LN-BASE-048 in the verification table. All 203 release-tooling tests pass. A cold Collection Filters real-App story passes interaction/axe. The audit has 59 supported / 8 partial / 13 gaps / 9 manual areas, with 127 matching and 25 nonmatching probes; no previously passing probe regressed.

The first default check attempt stalled while preparing its remote Docker image and was stopped before source checks. The same lanes pass with the documented `LAPIS_PLUGINS_VALIDATION_RUNTIME=native` execution; no local loader/runtime configuration was changed. Linux hosted acceptance remains separate.

Final literal edge regressions reproduced 4 failures / 31 passes in the expanded exact target: null elements and a singleton nested list were incorrectly handled by the variadic helper. A private expression-aware literal constructor now preserves both shapes; all 35 exact cases pass. The final workspace check/test/build pass with 252 Bases unit tests.

The eight-shard collection sweep attempted all 64 files. It reproduced three Kanban assertions and the Markdown OutgoingLinks Middle Top Tabs assertion. Shard 4 initially could not import Canvas after Vite optimized new icon dependencies and reloaded the browser; a fresh exact-shard repeat loaded all tests and reported 6 Canvas failures / 88 passes. The exact Canvas file on the unchanged merged baseline `d528063f` reproduces the same 6 failures / 24 passes, so the five newly observed cases are not caused by these fixes. Owner: Canvas source editing/clipboard/history and browser-input integration. They are Group imported cards below their content; Pending text-card edits flush before switching; Pending text-card edits follow a guarded rename; Pending text-card conflicts retain the complete draft; Selection clipboard remaps cards and connectors with history; Text editor undo and board history keep their own sessions. Local interaction acceptance remains partial; no assertion, timeout, skip or baseline was changed.

Static Storybook and npm-pack passed. Payload preparation correctly refused the uncommitted working copy; exact-source payload reproduction and checksum verification follow the source commit.

The final cold Bases family run completes all 35 cases: 32 pass and only the same three accepted Kanban assertions fail. No new functional/axe failure appears in Bases.

## Date helpers and draft validation — LN-BASE-049

Exact command: `pnpm --dir packages/bases exec vitest run src/lib/bases-view/date-compatibility.test.ts src/lib/bases-view/filter-predicate-validation.test.ts`. Before implementation: 16 failures / 6 passes (12 date failures and 4 draft-validation failures). Collection source payload reproduction and checksum verification pass on signed source `46ae55b5`; SHA-256 `9da23a68f24d4bd36b1f9852b882fa580b189fdb60bf210d9c96c1c1704b9314`.

Date/helper and draft-validation targets pass all 24 cases after adding native Date and native SQL string-format coverage. The string-receiver format guard reproduced 1 failure / 15 passes before selecting the native formatter overload ahead of the date fallback; global SQL formatting remains unchanged. The final focused date/draft/native-helper cohort has 34 passes. The broader sweep was stopped before changing that guard, and the final suite is restarted from fresh browser processes.

The audit additionally records an intentional reversal difference: native reverse returns a copy and does not mutate note metadata. A new documentation-derived mutation probe retains Obsidian's in-place expectation and remains failing; its difference flag does not turn it into a pass. A native-helper test locks input preservation. The two functional groups close 18 original failing probes (38 to 20); the new deliberate-mutation probe makes 21 current nonmatches. The expanded inventory has 158 probes, 137 matches, 63 supported areas / 8 partial / 9 gaps / 9 manual areas. No previously passing probe regressed.

Moment 2.31.0 is a normal registry dependency bundled with Bases. Installation initially applied pre-existing local pnpm hooks; the lockfile was narrowed to the eight Moment-only lines and a frozen install with `--ignore-pnpmfile --ignore-scripts` restored the registry graph without changing loader configuration. The audit records the resolved Moment version. QMD doctor/search still report the native Node ABI 147 mismatch and use the documented rg fallback; spec-validator remains at the latest Deno-free 0.2.0.

## Final source qualification

The final source passes workspace check/test/build (18/18, 18/18, 17/17 tasks), with 277 Bases unit tests, 81 audit baseline checks, 203 release-tooling tests, specification validation, mdbook, spec-first and App ownership. All five focused imported/formula/error/collection/date stories pass interaction and axe. Upstream documentation drift remains empty. Static Storybook, npm-pack and publint pass from this source.

All eight standard shards attempted the complete 64-file catalog. The final completed results are 61 passing files / 3 failing files, 295 passing cases / 10 baseline-reproduced failing cases / 57 existing skipped cases. Failures are 3 Kanban, 1 Markdown preview and 6 Canvas cases, including the five newly observed Canvas cases reproduced on merged main. The first shard 8 attempt lost its browser connection while importing skipped Sync stories; one exact cold-process retry passes all 8 files (16 active passes / 33 existing skips). That retry changes no source, skips, assertions, deadlines or baselines. Local interaction/accessibility acceptance remains partial.

Source fix groups remain separate commits with patch Changesets. The user explicitly accepted tracking the five additional reproduced Canvas failures separately and sharing the follow-up with local checks reported as partial; the earlier accepted Kanban cases remain separately tracked. No package, public asset or registry release occurs.

## Committed artifacts and handoff

Signed source groups: collections `46ae55b5109055b47e2f4ce7bec53103fb67680c`; dates/drafts `9d75dca3d105394ae412d5dfd6d14560257c4ba7`. Both use the user-authorized default SSH file key through command-only signing overrides; saved 1Password signing settings are unchanged.

The final deterministic payload is bound to exact signed date source `9d75dca3d105394ae412d5dfd6d14560257c4ba7`. Build reproduction and checksum verification pass for `.release/bases-next/dates/candidate/bases-0.3.0/bases-0.3.0.payload.zip`, SHA-256 `273ef44f2a0ce9c9080770803b5b2273f17ebeddd50bfe3de438524ea5a3d9d1`. The final npm tarball is `.release/bases-next/dates/npm/lapis-notes-bases-0.3.0.tgz`; packaging and publint pass. These are unpublished local version-0.3.0 validation artifacts, with patch Changesets awaiting release preparation. Registry consumer and public signed-release qualification remain separate.

Final interaction receipts: `/tmp/bases-next-qualification-shard-{1..8}.log` plus the successful exact shard-8 retry. Baseline Canvas reproduction: `/tmp/bases-next-canvas-before.log`; initial eight-shard collection receipts and its exact Canvas shard repeat are retained separately. Final check/test/build/spec logs and artifact logs use the `/tmp/bases-next-qualification-` and `/tmp/bases-next-dates-final-` prefixes. At the initial handoff, hosted CI had not started while acceptance of the five additional pre-existing Canvas failures was pending. That acceptance has now been provided; local checks remain partial and hosted CI is a separate result.
