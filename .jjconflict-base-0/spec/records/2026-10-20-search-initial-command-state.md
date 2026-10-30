# Preserve query arguments when creating Search

Enclosing Jujutsu change; LN-SRCH-002/006/052.

The preceding live-view state fix passes the original two-cold-process native
history-search/restore target, but all seven Desktop Search stories fail their
command-supplied initial query. A cold exact consumer reproduction fails too.
The new source CommandQueryOnNewView story closes the existing Search leaf
then opens a fresh one with a nonempty query and history scope. This source
reproduction passes without another Search runtime change. It proves the plugin
retains initial command arguments, while the complete Desktop host exposes an
API layout-projection race. Desktop's temporary setter stack confirms a later
`restoreLayoutJson` replay applies the old empty/files state. That defect belongs
to the API; its source repair is recorded in
`lapis-notes/spec/records/2026-10-20-workspace-inflight-view-state.md`.

The new scenario retains exact live-state and visible-query assertions and
adds governed coverage under LN-SRCH-006. The existing Search runtime fix and
public archive remain unchanged. Source catalog/specification results follow;
Desktop E-REPO-052 owns the original consumer acceptance. No publication or
production signing is performed.

- `pnpm exec vitest run --project storybook stories/plugins/search/panels/Search.stories.ts -t 'Command Query On New View|Live Query And Scope State'`:
  both interaction/axe cases pass in a fresh process; six unrelated placements
  skipped (`.local/search-initial-command-final.log`). The earlier exact
  command-created case also passes (`search-initial-command-before.log`).
- `pnpm audit`: exit 0, the same two pre-existing ignored advisories, no ignore
  changes (`.local/search-initial-command-audit.log`).
- `pnpm spec:check`: all three spec/book/source-first lanes plus explicit App
  ownership pass (`.local/search-initial-command-spec.log`). Scoped formatting
  passes (`.local/search-initial-command-format.log`).

This follow-up changes only the source story and its governed requirement and
record. Search's production sources, version, public dist, archive and signature
fixtures are identical to the verified preceding runtime slice; its 49 unit,
package check/build/publint, tenability audit and 12 packaging/signature-fixture
checks remain recorded in `2026-10-20-search-live-view-state.md`. They are not
claimed as new runs here. Full catalogs, provider/platform and release gates
remain deferred under the minimal-verification scope. Desktop intake must pass
its own affected catalog and cold native gates against the repaired API.
