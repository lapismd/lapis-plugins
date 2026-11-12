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
