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

Final Storybook and additional grouped-fix validation are recorded below.

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

## Group 3: value semantics and retained differences

Canonical contract: LN-BASE-047.

The exact functions target initially had 2 failing regression cases / 7 passing;
all 9 now pass. Present numeric zero and Decimal zero are not empty; empty plain
objects are. Decimal truthiness uses its numeric value. A single list is retained
without nesting or copying, and native variadic construction remains supported.
ISO and space-separated date/time inputs work, shorthand durations distinguish
M (month) from m (minute), dates coerce to epoch milliseconds, split honors a
string-separator limit, and file.basename uses the extension-free public field.

The inventory now annotates retained differences with rationale and evidence.
Case-insensitive contains aliases are supported by an existing explicit regression
and deliberately remain unchanged. Native filter writes and variadic lists are
retained extensions. Typed file/link/rendered-value wrappers, owning-file this
binding and real maps remain deferred features under LN-BASE-012. Other remaining
gaps are not presumed deliberate. A tooling regression proves that these labels
do not convert failed expectations into passes or hide the observed mismatch.

After the source fixes, all earlier passing probes remain passing. The audit
reports 47 supported / 9 partial / 24 gaps / 9 manual areas; final suite and remote
status are recorded after completion below.

Group 3 source validation: all 18 workspace check/test tasks and 17 build tasks
pass, including 217 Bases unit tests, 81 compatibility checks and 39 focused
release/audit/CI tooling tests. Audit has no new upstream documentation drift.
The completed Storybook sweep is recorded below; interaction status remains
partial because of the reproduced pre-existing failures.

An additional duration edge regression reproduced a missing `w` alias (1 failed /
8 passed in the exact functions target). Normalizing it to the existing native
week unit fixes the case; a third duration conformance probe now covers `1w`.

A final candidate-selection regression reproduced bracketed property IDs being
treated as literal metadata keys (1 failure before). AppDatabase now declines
that lowering so the expression evaluator handles the typed property reference;
all 10 exact candidate-query tests pass afterward.

## Final qualification status

Source fix groups remain separate JJ changes:

- `suryklxt`: imported filters and safe candidate selection.
- `rzswxzxq`: expression compilation, typed bracket keys and formula safety.
- `yqvluwpn`: value helpers and explicit retained-difference tracking.

All 18 workspace check/test tasks and 17 builds pass; Bases has 217 passing unit
cases. The audit has 81 passing baseline checks and 146 behavior probes: 108
match and 38 remain explicit compatibility differences. Original failing
expectations fell from 57 to 38 with no previously passing probe regressed.
All 203 release-tooling tests pass. Spec validation, mdbook, spec-first and App
ownership pass. QMD doctor/search still use the documented native-module fallback;
no global tool installation was changed.

The final npm tarball includes the private expression compiler and excludes all
audit fixtures. The deterministic payload is bound to source commit
`beb888468e1135554fab9a1cbe6c8a78303a20c2`; reproduction and checksum verification
pass for SHA-256 `d8c64cc0a48d1cd5ae12146321adc33bd28334420a6e4780598b0bc6564685c5`.
The complete static Storybook build, npm-pack/publint and payload checks were
refreshed from that exact clean source revision and pass. These local artifacts do
not imply signed publication or registry consumer qualification.

The unsharded full catalog recorded 211 passing, 5 failing and 19 skipped cases
before a browser connection closed at the AI Catalog family. It did not complete
all 64 files. The AI Catalog file passes all 6 cases in a fresh pre-fix process.
The bounded repository-standard sweep then ran all eight shards sequentially,
continuing after failed shards to collect complete evidence. All 64 files were
attempted: 61 files passed and 3 failed; 281 cases passed, 5 failed and 57 retained
cases were skipped. No browser-disconnect error occurred in that sweep.
A final cold exact-source run of the entire Bases family reports 31 passed and
the same three Kanban failures (34 cases).

In addition to the three accepted Kanban failures, exact pre-fix runs reproduce:

- `OutgoingLinks.stories.ts > Middle Top Tabs`: hover-preview replacement appends
  the old content instead of replacing it. Owner: Markdown preview/test editing
  boundary (and its underlying editor integration).
- `canvas/Features.stories.ts > Group imported cards below their content`:
  multi-selection never exposes Create group. Owner: Canvas grouping/test input
  boundary.

Both are unchanged before these Bases fixes (2 failures on the pre-fix audit
head), and neither its story nor owner implementation was changed. All UI and
accessibility acceptance is reported as partial rather than green. No assertion,
timeout, baseline, skip list or workflow protection has been weakened.

The review branch is `audit/bases-obsidian-20261112`. Pushing it again failed in
the configured SSH signer with `1Password: failed to fill whole buffer`. Signing
settings remain unchanged. The fix commits are local; hosted CI for them has not
started and no npm, public release or registry dispatch occurred.
