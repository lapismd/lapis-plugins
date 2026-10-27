# Search notice ownership rework onto integrated main

Date: 2026-10-27
Source: store-only commit c8db9717a7b4 ("Keep Search notices and typed queries
with their owning App and view", change vqnxsqzy, pre-stack fork lineage on
265680b6), reworked onto the integrated main lineage.

## What landed

Every remaining unbound Search `Notice` now routes through the explicitly owned
App:

- `search-plugin.ts` gains a private `showNotice` helper that binds `this.app`;
  the settings-recovery failure, semantic-rebuild result, index-rebuild result,
  startup index-refresh failure and provider-refresh failure notices use it.
- `search-settings-tab.ts` binds both rebuild notices to `this.app`.
- `search-panel.svelte` binds both "Search results copied" notices to the
  panel's `app` prop. The panel's error-path notices were already App-bound in
  main.
- `search-notice-ownership.test.ts` (from the source commit, unmodified) proves
  a delayed background `reconcileStartup` failure stays with the owning App
  while another compatibility host is installed through
  `installApplicationCompatibility`.
- Requirement LN-SRCH-054 records the contract in the Search chapter with a
  matching verification row; the governance chapter records the qualification
  boundary and the renumbering.

## What is superseded and why

- The source commit's typed-query view-state persistence (`onQueryChange`
  prop, `search-view-state.test.ts`, its LN-SRCH-052 requirement) is superseded
  by main's landed live query/scope snapshot design: `SearchView.getState()`
  merges the mounted panel's `getSearchState()`, `setState` replays query and
  scope through `setSearchQuery`/`setSearchScope`, `onStateChange` requests the
  owning workspace layout save, and `stopPanel` snapshots state on close
  (LN-SRCH-006 and its SearchView regressions). Re-landing the older mechanism
  would duplicate that ownership; nothing from it was taken.
- The source commit's requirement identifiers LN-SRCH-051/LN-SRCH-052 collide
  with independently landed main requirements (App-owned result providers;
  Current/History/Everything scopes). The notice-ownership requirement was
  renumbered to LN-SRCH-054. No main requirement, row or assertion was
  modified or weakened.
- The source commit's `.changeset/search-owned-notices-and-query-state.md` and
  its archive-based distribution paragraph were not taken; a notices-only
  changeset (`.changeset/search-owned-notices.md`) replaces the former because
  the query-state half did not land, and this integration is direct-to-main
  rather than local-archive qualified.

## Validation

Recorded in the integration commit message: exact ownership case, the complete
`@lapis-notes/search` package suite, package check lanes and the repository
validation lanes rerun on the integrated tree.
