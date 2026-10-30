# Unified incremental Search results

Enclosing Jujutsu change; LN-SRCH-051, LN-SRCH-052 and LN-SRCH-053.
Search now offers Current files (default), History and Everything through the
App-owned result registry. Existing file results, tools and index authority are
unchanged. Independent sources publish pages incrementally. File groups retain
expansion and context during continuation; identical immutable contents merge
while retaining each exact checkpoint target. Capability feedback rejects
unsupported history predicates instead of silently ignoring them. Queries,
unload and generation changes fence obsolete results; failed sources leave
successful peer results available and offer retry.

The incremental story holds a second page, expands the first version, then
proves the snippet and disclosure survive continuation, two checkpoint links
remain available, a deleted-file group appears and exact activation is retained.
Its initial axe failure exposed invalid action placement beneath the tree;
the version item now owns treeitem semantics and the toggle remains a button.
The passing interaction/axe run is `.local/history-search-federated-final.log`.

The six existing placement stories initially failed to locate the inactive
Search panel. Diagnosis then showed the panel in the default left sidebar,
despite a middle-placement fixture. The old shared fixture saves workspace state
under `.obsidian`; the current API loads it from `.lapis`. Search's fixture now
restores its governed layout through public Vault and Workspace methods and
activates the existing leaf. No shared placement assertion or axe rule changed.
The exact Middle Top Tabs reproduction failed once in
`.local/history-search-placement-diagnosis.log`, then passed with five other
placements unselected in `.local/history-search-placement-fixed.log`.

Focused source commands:

- `pnpm --filter @lapis-notes/search check`: pass, zero Svelte warnings/errors
  and TypeScript diagnostics.
- `pnpm --filter @lapis-notes/search test`: pass, 44 tests in ten files.
- `pnpm --filter @lapis-notes/search build`: pass, public dist and publint.
- `pnpm audit`: pass with the two existing ignored advisories; no ignores added.
- `pnpm spec:validate`, `pnpm spec:first`, `pnpm check:app-ownership`: pass.

Logs use `.local/history-search-final-{check,unit,build,audit,spec,first,ownership}.log`.
Svelte formatting uses Desktop's installed prettier-plugin-svelte; no dependency
files or package internals are patched. The ignored local archive overlay uses
the compatible public API 0.1.4, Workspace 0.2.1 and Design Core 0.5.1 builds.
Portable manifest ranges and the tracked lockfile remain unchanged.

Desktop
owns native index scheduling, exact native reads and application routing; its
integration evidence remains separate. Root aggregates, provider/platform and
release qualification remain deferred under the user's functional-UI scope.
Visual approval is pending; no baselines, publication or production signing.

Final source acceptance: all 13 Search stories in four files pass interaction
and axe (`.local/history-search-final-all-stories.log`). CurrentFilesNativeScroll
also passes WebKit (`.local/history-search-webkit-current-final.log`), verifying
visible current-file rows inside a nonzero native viewport and the compact sort
control. The first WebKit attempt used an incorrect option name; the next needed
to await the popover transition. No product assertion was removed.

Real Desktop consumer acceptance exposed one label-content-name mismatch in the
saved-version activation button. Its accessible name now includes the visible
author and revision while retaining the version title. The two federated source
stories pass afterward (`.local/history-search-history-style-a11y.log`).
LN-SRCH-052/053 are implemented at the Search presentation boundary; native,
provider and full application release gates remain consumer-owned and deferred.

Desktop's stricter axe run also found source, summary, file and saved-version
controls whose accessible labels omitted visible text. Labels now include the
visible scope/count/title/date, with the original path and navigation intent
retained. LN-SRCH-005/052 contracts are unchanged: grouped navigation stays
accessible and path-specific. The initial label repair produced six fixture
path-parser failures and one missing saved-version row; the fixtures now parse
the explicit path portion and version items retain an unambiguous label.
The final family run passes 12/13, with only Middle Top Tabs's filename selector
failing; that exact target then passes 1/1 after updating its obsolete prefix
selector. Package check/build/publint and pack pass after the production repair.
No accessibility rule or product behavior assertion was disabled.

Local payload ZIP verification and deterministic reproduction passed before this
label follow-up (payload b450823022b5e8fc5f6504015ed325a7d59f970ae26801ec920e814425ee6aaf).
The follow-up requires a fresh payload at final qualification. Production signing
and publication remain deferred. The portable dependencies and lockfile are
unchanged; archive overlays are ignored development setup only.

The first follow-up spec-first run rejected the unchanged mapped canonical
chapter. The chapter now explicitly records visible-text naming and the exact
revision-pinned gate is rerun after amendment; this failure is retained.

An intermediate version named its labelled header, with metadata/actions
inside the owning tree item and snippets in its nested group. This passed source axe but Desktop axe 4.14 still rejected the expanded name. Intermediate trigger-owned groups first duplicated the snippet
name and then violated required tree children; the final labelled container
retains click-anywhere and keyboard behavior. The two exact federated stories
pass in history-search-labelled-row-actions.log. Provider request identity also
ignores recent-query saves, preventing unrelated settings updates from clearing
results. Current-file totals count only successfully resolved live file hits.
The original user's exact query was unavailable; fresh native acceptance and
catalog checks cover Current files rendering rather than claiming a confirmed
cause for every stale-index instance.

The earlier labelled version-container, click/keyboard and nested-group structure
passes all 13 Search stories in a cold process (`history-search-landed-stories.log`).
The intermediate non-container ownership design is discarded. Header labels
reference only visible header text; metadata actions remain inside the owning
item. No failing assertions or axe rules were removed. Search check, build and
public packaging were rerun on that intermediate source. Wider source aggregates remain
outside this explicitly focused functional-UI slice.

Final consumer accessibility acceptance uses a name-from-content version
container with a full-width named header button and physically nested snippet
groups. Expanded metadata/snippets no longer conflict with an explicit
container label. Header click, Enter/Space and ArrowLeft/Right retain disclosure
control; snippet actions retain independent targets. No axe rules are disabled.
The final source passes 13/13 cold Search interaction/axe stories in four files
(`history-search-natural-family.log`) and 44/44 unit tests in ten files
(`history-search-natural-unit.log`). Check/build/publint/npm pack, audit,
App ownership, spec validation and spec-first pass in the matching natural logs.
Desktop verifies the packed public output separately with axe 4.14. Payload
reproduction/signature validation follows the enclosing commit; publication
and wider original qualification gates remain deferred.
