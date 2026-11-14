# Bases compatibility audit

[Read the generated gap report](report.md). The matching [JSON](report.json)
contains stable feature IDs, priorities, owners, source references, exact inputs,
expected and observed results, source fingerprints, and resolved dependency versions.
Use the IDs in follow-up work so fixes remain traceable through repository history.

## Run and track

From the repository root, with the frozen lockfile installed:

```sh
pnpm audit:bases
pnpm audit:bases:upstream
```

The first command is offline. It runs the production document normalizer, query
generator, PEaQL function registrations and BasesTable against a fixed three-file
vault fixture. Expression probes use the same bracket identifier-quoting setting
as generated production queries. Date probes freeze the clock and timezone.
It checks every accepted probe outcome and the complete generated report. Both
regressions and newly passing gaps fail until their evidence is reviewed.
Normal CI runs it in the unit job and uploads the actual observations from
`.release/bases-compatibility/report.{md,json}`, including on a baseline failure.

The second command fetches the three official Obsidian reference documents. It
compares Git blob hashes and discovers added/removed functions by receiver type.
Documentation changes fail the command for review; a failed fetch is an error,
never evidence of unchanged upstream behavior. It does not rewrite the snapshot.
CI acceptance stays independent of network availability and moving upstream docs.
An independent advisory CI job runs this upstream comparison on pushes, pull
requests and manual CI dispatches, and uploads `upstream-drift.json`. Its failure
signals review work without changing the blocking offline compatibility gate.

When implementation or upstream behavior changes:

1. Review the affected official source and update `inventory.json` with precise
   expected results. Keep existing feature IDs. Add probes for missing overloads
   and edge cases rather than replacing assertions with weaker examples.
2. For upstream changes, review the document diff, update `upstream.json` blob
   hashes, headings, function inventory and review date. Cover every newly found
   function with executable probes or explicit manual acceptance evidence.
3. Run `pnpm audit:bases:update`. Inspect the changes to `baseline.json`,
   `report.json` and `report.md`. This is an explicit evidence update; known gaps
   remain tracked and are not product acceptance passes.
4. Run `pnpm audit:bases` and commit the inventory and reports together.

`scripts/bases-compatibility.test.mjs` checks discovery, missing coverage,
duplicate IDs and report classification. The dedicated Vitest configuration and
observer fixture do not change existing package tests or runtime code. Audit
fixtures are outside published `dist` exports.

## Release provenance refresh

`pnpm release:version` reruns the full audit with `--refresh-provenance` after
versioning and synchronizing package metadata. That mode may update only the
observed package and dependency versions. It retains every normal behavioral
baseline assertion and rejects changed source hashes, feature coverage, upstream
identity or observations before writing either report. It never writes
`baseline.json`. Ordinary `pnpm audit:bases` still rejects stale provenance.

Use the explicit reviewed evidence-update workflow above for behavior changes;
provenance refresh cannot accept them.

## Scope and evidence limits

This compares Lapis source with the reviewed Obsidian documentation. It does not
execute Obsidian, establish complete parity, or qualify npm consumers. A passing
example only qualifies that example. UI and host behavior retain separate
`review-required` entries with acceptance work; manual map evidence explicitly
records the unavailable implementation.

The fixture begins at the normalized metadata-record boundary. It does not test
AppDatabase candidate pushdown, vault indexing, rendered cells, browser lifecycle,
or host-specific `this` ownership. Existing package and Storybook suites govern
those boundaries. Do not treat missing test-fixture host state as a runtime defect.
The context-binding entry records the missing binding by source review and needs
a host fixture before a fix can be qualified. Circular formula references are
checked as explicit compilation-error probes, alongside the governed error story.

## Suggested implementation order

1. **P0 document compatibility:** preserve global string predicates and import
   per-view `filters`, then prove global AND view composition. These cases can
   silently include files outside the intended filter.
2. **P1 syntax and evaluation:** reconcile parser and evaluator handling of `==`,
   symbolic logic, truthiness, formula references and formula sorting.
3. **P1 typed values:** dates/durations, list overloads and callbacks, regex
   literals, file/link resolution, case-sensitive matching, and `this` context.
4. **P2 surfaces:** typed rendered values, custom/grouped summaries, manual
   groups, named embeds, map provider and remaining workflow acceptance.

The filter, formula, collection and scalar date-helper slices are implemented.
See the generated report for remaining arithmetic, regex, file/link and host gaps.
Each implementation group retains a separate commit and patch Changeset; the
public plugin document model and deliberate differences remain unchanged.

## Retained differences

`inventory.json` may attach a reviewed `difference` with a kind, rationale and
source evidence. `intentional` preserves an established product contract;
`deferred` identifies a separate feature explicitly retained as future work.
Neither flag changes expected Obsidian results, hides failing probes, or implies
that every other unresolved gap was deliberate. Case-insensitive text matching,
the native saved-filter model, variadic list extension and nonmutating list
reversal remain unchanged. The reverse mutation probe retains Obsidian's in-place
expectation and records the deliberate mismatch.
