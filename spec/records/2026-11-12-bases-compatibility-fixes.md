# Bases compatibility fixes — 2026-11-12

## Group 1: imported filters and candidate selection

Canonical contracts: LN-BASE-003, LN-BASE-004, LN-BASE-045.

Imported global strings and per-view `filters` now normalize into the existing
native filter model across all layouts. The singular native `filter` wins when
both spellings are present; the imported alias is removed. Saved-file format is
deliberately unchanged. Malformed groups throw instead of discarding clauses.
Database limits now require completely lowered predicates, and any-of tags no
longer become all-tag candidate restrictions.

Exact before/after evidence:

- Document/public-entrypoint target: 12 failures before, 0 after (22 tests).
- Candidate-query target: 4 failures before, 0 after (9 tests).
- All 18 workspace check/test tasks and 17 build tasks pass; Bases has 198
  passing unit tests. Package checks include audit, metadata, App ownership,
  no-Tailwind and Storybook composition gates.
- The compatibility audit's three YAML areas now pass all original expectations.
  Other gaps remain unchanged, and source fingerprints/reports are refreshed.
- npm-pack and publint pass. No npm publication or public release occurs.
- The new `Imported Filters` real-App Storybook case passes from a fresh process,
  including interaction/axe. It imports before mounting, then verifies the
  globally and locally filtered record with a descending indexed sort and limit.
  The initial fixture tried to mutate the already-cloned input document; that
  story-only setup was corrected to exercise the actual import boundary.

The first required Storybook wrapper shard reports 35 passing, 3 failing and 6
skipped cases, then stops. `Roles`, `Notes` and `Tasks` all fail the existing
horizontal-scroller check at `BasesKanban.stories.ts:408` with Storybook's
"Not implemented" assertion error. A fresh exact-file run on pre-fix audit
change `wlzpoqyv` reproduces the same 3 failures / 3 passes. These belong to the
existing Bases Kanban story/scroll geometry boundary, not filter normalization.
They remain visible gates until explicitly accepted or repaired; no assertion,
timeout, threshold or baseline has been weakened.

The complete Bases story family now reports 29 passing / 3 pre-existing failing cases across 7 files, including the new imported-filter case. No new interaction or axe failures were found.

Full final Storybook and additional grouped-fix validation are recorded below
as the work completes.

## Group 2: expressions and formula execution

Canonical contract: LN-BASE-046.

The exact `query-compatibility.test.ts` target initially failed all 12 regressions.
It now covers equality, symbolic logic, truthy numeric predicates, literal bracket
keys (including dots, spaces and reserved names), both formula-reference syntaxes,
chained arithmetic precedence, evaluated sorting, string-literal preservation and
bounded cycle/unknown-reference rejection. Extra SQL clauses and triple-equals
are rejected rather than accepted through parser recovery.

The execution boundary uses the PEaQL AST without mutating it. Parsed comparison
operators and typed note aliases feed the evaluator; the builder's displayed
source stays unchanged. Formula compilation failures produce an accessible error
with the editing toolbar retained. The audit now probes formula expressions via
the actual generated-query projection rather than a separate direct SELECT.
All earlier passing probes are required to remain passing before accepting the
updated evidence. Detailed final counts follow after remaining groups.

The user accepted tracking the three reproduced Kanban failures separately and
requested that interaction-check status remain partial.

Group 2 validation: all 18 workspace check/test tasks and 17 build tasks pass;
Bases type checking has 0 errors/0 warnings. `Imported Filters`, `Formula Filters`
and `Invalid Formula` all pass in a fresh browser process, including axe. The
expanded exact query/parser target passes 66 tests. The audit retains every
previous passing probe and now reports 41 supported / 14 partial / 25 gaps / 9
manual areas after adding explicit cycle-error probes. The complete Bases family reports 31 passes and only the same three accepted Kanban failures (34 cases). Three underlying UI fixtures were added to the governed catalog;
no visual baselines were generated or updated.
