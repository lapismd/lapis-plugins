# Bases record views and registry media

The follow-up is isolated from Kanban PR #62 and will be opened as a dependent
PR before that prerequisite merges. Plugin versions and publication stay held.

## Regression baseline

Remote Docker command: `pnpm test:storybook -- stories/plugins/bases/BasesViews.stories.ts -t 'Cards|Unknown View|List'`.
Receipt: `lapis-plugins-validation-8852b369-e567-4407-abef-0dd899f856c9`.
Four failures (Cards, Unknown View, List, List Editing), one passing grouped-list
case and three cases filtered out by the target. Product
changes were made only after recording that baseline.

## Qualification

Focused after-change and full acceptance are pending. Visual review remains
pending; no baselines were approved or changed.

The first after-change target reduced four failures to one: replacing the
focused activation button dismissed the new editor. The Cell boundary now
handles focus-out only from an actual editor. Repeating the exact target passes
five cases, zero failures, three filtered out; receipt
`lapis-plugins-validation-eead3398-dda5-4f69-bdb5-cfa5e1e490c6`.

## Full-shell regressions

The first complete Bases run passes 25 and fails four registry stories; receipt
`lapis-plugins-validation-de07f8b4-625a-4734-97c8-91355a94a14c`. Opening Explorer
requires card assertions scoped to the card renderer, and larger test viewports
require additional Active rows and wider configured table columns. The fixture
now has forty realistic records including thirty-two Active records. Cover
acceptance scrolls to the final record and back to prove viewport-driven
virtualisation. The three fixture cases pass after correction; receipt
`lapis-plugins-validation-1311cfae-cb15-4994-96c3-82222ca91a90`.

The remaining Kanban case exposes two axe landmark violations from Core's nested
main element. The owner fix and EmbeddedBoard regression live in Design Core,
tracked by its 2026-11-08-kanban-embedded-landmark record. No consumer overrides
or accessibility exclusions conceal the defect. Released-dependency acceptance
is pending that prerequisite.

## List value sizing

The review browser reproduced score 88 at 17.03px width with 39.5px text height
against a 21px line height: one numeric value wrapped onto two lines. List field
pairs now reserve 12rem, values reserve 8rem and numeric buttons cannot wrap.
The List story asserts a minimum numeric width and single-line scores/short
owners. Browser and remote after-change evidence are pending.

## Shared file links and final List review

File links in Table, Cards and List now share hover/focus-only underlines and
bounded Markdown Hover Cards. Content mounts through the injected App's public
Markdown surface registry and is disposed by the Hover Card's own lifecycle.
Non-Markdown targets retain ordinary App navigation without a preview trigger.
List group values are bold; grouped rows are indented with a Lucide bullet,
labels and values share their first baseline, and tags use Core's Tag List.

The link target `pnpm test:storybook -- stories/plugins/bases/BasesViews.stories.ts -t '^(Table|Cards|List)$'`
initially fails three stories: two persistent underlines plus a List row selector
that also counted Tag List measurement rows. Subsequent runs exposed trigger
semantics (three failures), synthetic hover/measurement timing (three failures),
then two dismissal failures. Pointer departure now exercises the Hover Card's
safe polygon. A premature conditional unmount exposed three failed stories and
eight fatal Svelte diagnostics; letting Hover Card own presence fixes teardown.
The exact target passes three, zero failures, five filtered cases; receipt
`lapis-plugins-validation-954e04c7-1a33-4ed4-9959-228a6107f399`, source
`8500dfa6df6c26022c7fc8cfafdcdb95d5b8dee9`.

All seven directly affected Bases story families then pass 29 cases with zero
failures, including interaction and axe; receipt
`lapis-plugins-validation-5ff27d00-e57a-48f4-b38a-436b312753be`. This run uses the
verified temporary Core landmark archive already identified above; released
registry-only qualification remains a separate gate. Additional navigation and
preview-width assertions are being qualified with media capture.

The local browser confirms rendered note content and hover-only underlines.
Numeric values now remain single-line; label/value text baselines differ by one
pixel and grouped rows have twenty pixels of indentation. Cold final acceptance
and generated media qualification remain pending. No visual baselines changed.

The added navigation and width assertions pass the same three-case target in
media receipt `lapis-plugins-validation-9cccb3c1-6d58-4881-9ee5-1500f1ad7d93`
(source `bb219c8ee56f79cdafd5fdb3f3e16adf71f78330`). That receipt also builds
static Storybook but fails capture on one new Kanban description: five lines
against the governed maximum of four. The wording is shortened; the direct
compositor target now passes (one case, zero failures). No limits were relaxed.
Capture retries reuse that qualified static Storybook artifact; only metadata
copy and source formatting changed. A fresh final source build remains required.

All 28 declared WebP files are generated and the seven media items pass the
capture/check round trip; receipt
`lapis-plugins-validation-0e2ba5f4-18bd-4feb-878f-8f987f67bba0`. The initial
generated-catalog test revealed one fixture error: missing required owner and
release-date fields. Production seed creation already supplies both. Correcting
the test document gives three tests passing, zero failures, while preserving
normalisation and byte/hash assertions. The first full lane reports that same
single fixture failure; receipt
`lapis-plugins-validation-994ecaf5-eb05-408c-8ad3-b3aa56355095`. Full qualification
is being repeated with the corrected fixture.

Full `pnpm ci:release` passes on omarchy (4 CPUs/12 GiB): all 51 package tasks,
193 tooling tests, audit, specifications, App ownership, source-style audit,
17 npm packs, 17 verified plugin payloads and the cold static Storybook build.
Receipt `lapis-plugins-validation-0aaea523-43cf-4612-a7ae-189e9ce497be` uses the
verified temporary Core archive. The full browser lane follows serially.

The initial complete browser lane finishes with 274 passing cases, 57 existing
skips and one List failure; receipt
`lapis-plugins-validation-f0443a64-003e-457d-a090-563a85d48a39`, source
`1de6a59c3a2ed578b220af9b51a053b57616ac58`. It measured preview width at
399.8px during entrance animation. The unchanged 400px assertion now waits for
settled geometry, matching the established panel-preview acceptance pattern.
The exact Table/Card/List target passes three cases, zero failures, five filtered
cases after correction; receipt
`lapis-plugins-validation-36d077e8-20b3-49b7-9a23-f0a9d7a031bd`. The complete
browser lane is repeated, preserving all assertions and existing skip counts.
Clicking a visible tag also passes the focused List Editing case; receipt
`lapis-plugins-validation-7d48084d-9ad4-47c6-91ee-e34dca1b8aa1`.

The repeated complete browser lane passes all 275 cases with zero failures and
the same 57 existing skips, across 64 files and eight serial shards. Receipt
`lapis-plugins-validation-46321730-b4a6-4d17-8ec1-f0ff1f8dee6a`, source
`061896e31f246e0d2867eea06b3ec40a2f4db30d`. The temporary archive remains explicit;
Core 0.12.2 is now published from main `7208808e556ac6c5a4330f3e77d862c1a9343fa6`
with green source/version/main CI, immutable artifact and provenance verification
in release run `42525186187`. Registry-only integration and final hosted heads
remain required before the PR stack is declared ready.

## Registry-only stack qualification

The follow-up on the Core 0.12.2 prerequisite passes the complete combined
registry-only run, with an empty candidate archive inventory; source
`5a227fd81a038d4d1682c69a27f390aa8fe1c853`, receipt
`lapis-plugins-validation-ad6a8d0b-1eaa-4ddb-b06e-f36b53363d49`. It includes
all 51 package tasks, 193 tooling tests, audit/specification/App ownership,
17 npm packs, 17 verified plugin payloads, cold static Storybook, all 29 Bases
interaction/axe stories, and seven deterministic media checks (28 WebPs).
Generated catalog normalisation and pack-byte checks retain both new gallery
entries. No plugin versions or visual baselines changed.

Kanban's hosted Notes regression is repaired in the prerequisite with unchanged
spacing assertions and a settled-geometry wait. Rebasing the follow-up preserves
that clause alongside its file-link contract. The final merged specification
and all 29 Bases stories pass again, receipt
`lapis-plugins-validation-5a4ef5ed-aa02-4a3f-b4d7-53472468f1a8`. The dependent
PR is opened before #62 merges; final hosted CI and restacked-head verification
remain separate gates. The original workspace and conflicted local main remain
preserved, and the review Storybook runs against released Core 0.12.2.

## Main restack

Kanban PR #62 merged after all functional and aggregate checks passed on exact
head `afb9fb7660fb4259c2a930ebd0a0b12a7b57dee3`. Its squash result is main
`fe8e1d757b51a15118983727880343042f0c07d3`. The stacked follow-up PR #66 was
already open against the Kanban branch. Main's tree matches the qualified
Kanban tree exactly; rebasing only the two follow-up commits onto main leaves
the follow-up tree byte-for-byte unchanged. The comparison against its base
contains 58 intended files and no duplicated Kanban implementation or dependency
files. Local main's original conflicted targets are preserved.

Final restacked-hosted qualification is recorded by PR #66's exact-head checks;
this receipt update changes no executable source. Plugin versions, publication
and registry dispatch remain held, with Changesets pending for later release.
