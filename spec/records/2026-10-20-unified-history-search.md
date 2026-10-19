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
