# History Plugin

The package requires published Design Core `^0.7.0` for prepared browser CSS
and bundled fonts through public exports. Application state and existing plugin
behavior retain their owning contracts.

The manifest-owned author avatar uses the SHA-256 Gravatar for `dev@lapis.md`
with size 256 and initials fallback, as governed by LP-SPEC-041.

Version 0.1.4 includes the responsive comparison toolbar layout. Its generated
manifest, README installation coordinate and Changesets changelog agree on
the independent release version.

This candidate requires API 0.2.0 through its portable peer range.
Shared shell qualification uses UI 0.1.4, File Explorer 0.2.0 and Workspace 0.3.0.
Mobile shell acceptance uses the published count-bearing dock label, opens the
workspace tab chooser and returns with Done. It retains real-App plugin and
collapsed-sidebar assertions; this repairs a stale story selector.

Release qualification uses `@lapis-notes/api@^0.2.0` for the shared renderer,
diagnostics invalidation and selected metadata fingerprint contracts. Portable
consumers must resolve this prerequisite from npm before plugin publication.

Earlier dependency acceptance used Design Core `0.3.2` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.

History presentation resolves Design Core through the repository's current
published semver range and committed lockfile.

The package-owned `registry.json` is the source for curated categories,
highlights, and registry-only Overview content under LP-SPEC-021 and LP-SPEC-033. Manifest and package
metadata remain authoritative for the fields defined by LP-SPEC-022.
Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. Governed `Registry Screenshots` stories cover the
populated local-snapshot History sidebar and Compare view; both stay
`visual-pending` until separate visual approval.
Compare preserves the complete full-shell capture, while History retains its
declared sidebar-focused crop. Both frames retain the shared dark right-edge
gutter. The manifest summary names revision browsing, comparison, and restore
instead of the generic feature label.
The fixed banner state places Explorer left, Compare in the main area, and
History right. The separate Overview image uses the full Compare story so the
body does not repeat the hero.
The sidebar capture MUST finish with the authored revision inventory visible
rather than a transient loading or empty state.

`@lapis-notes/history` owns vault file-revision capture, the movable History
panel, and the main-area compare tab. Persistence remains the existing
`AppDatabase` file-history contract. This plugin is not AI conversation
history.
The governed real-App shell loads the public Source Editor before Markdown;
History does not carry a Storybook-only editor fixture.
Package acceptance resolves History manifest metadata from the packed npm
package, independently of the repository source layout.
The Lapis API host module is peer-provided by the application so the packed
plugin shares the host's App and framework identity.

## Requirements

The package also owns the extracted Desktop repository-history presentation and
controllers through its public `repository` entrypoints. The existing
AppDatabase History plugin and its runtime ID remain compatible. Hosts explicitly
choose the repository plugin and inject their own admitted services; the plugin
does not acquire native or hosted authority.
The public `repository/styles/*.css` entries retain shared column and identifier
chrome for host review compositions without depending on a desktop source path.

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-HIST-012 | Repository History MUST share the existing Desktop production views and controllers between hosts through public package exports. It MUST retain exact operation pins, bounded preparation, stale-response fences, independent views and explicit retry. It MUST NOT depend on Tauri or import a host application.                                                                                                               |
| LN-HIST-013 | Repository services MUST be bound to an explicit App through a disposable lease. Hosts MUST own admission, transport, saved-write coordination and service lifetime. Browser teardown MUST NOT stop server-owned backup work. Optional unavailable services MUST NOT gain authority from persisted layout or plugin state.                                                                                                       |
| LN-HIST-014 | Extracted repository controllers MUST retain source regression coverage for pins, wide values, concurrent selections, closure and unknown outcomes. Production views MUST have shared light/dark and narrow shell stories. Native, hosted and fixture qualification MUST remain distinct; visuals remain pending.                                                                                                                |
| LN-HIST-015 | Hosts MAY observe an acquired replacement guard through an App-owned disposable lease. Entry MUST occur after editor/transcript protection succeeds, and exit MUST follow action settlement. Observation MUST NOT replace protection, grant write authority, or affect another App. Disposed old leases MUST NOT remove a later binding.                                                                                         |
| LN-HIST-016 | Selected native Repository History MUST start its admitted index owner once and observe cached status. Search, capture notifications and incomplete pages MUST NOT schedule renderer batches. Detaching MUST drain only accepted observation, discard late updates and retain native work. Failed status reads MUST remain visible and recover without restarting the owner or falling back.                                     |
| LN-HIST-017 | Repository History MUST adapt the explicit App-owned native History index port through public contracts. Query and context MUST retain immutable saved identities, bounded request values and native failures. The selected port MUST take precedence over legacy service injection; its absence MUST NOT invent transport, admission or repository navigation authority.                                                        |
| LN-HIST-018 | A backup service MAY expose explicit persisted selection separately from observation. When selected, observer start/stop and plugin teardown MUST NOT disable native capture. Settings MUST use the explicit selection action and reconcile saved state after failure without replay. Existing hosts without that extension MUST retain their prior behavior.                                                                    |
| LN-HIST-001 | The repo MUST ship `@lapis-notes/history` at `packages/history` as an independently versioned first-party external plugin. An application profile MAY enable it by default. It MUST NOT reuse AI conversation-history view types or commands.                                                                                                                                                                                    |
| LN-HIST-002 | History MUST capture vault create, modify, rename, delete, and restore events into `AppDatabase` file-history tables only. It MUST NOT write snapshots into the vault, `.obsidian/`, or `.lapis/`.                                                                                                                                                                                                                               |
| LN-HIST-003 | Tracking MUST skip internal `.lapis` paths, glob excludes, binaries, oversized files, and read failures. Defaults MUST be 256 KiB, 50 revisions, a 10s modify merge window, and the documented exclude globs. Empty include-glob and extension allowlists MUST track remaining UTF-8 text.                                                                                                                                       |
| LN-HIST-004 | The plugin MUST register the `history` view through `ViewAccess.command` with `open-file-history` / `Open file history`. The opener MUST reveal an existing instance wherever it was moved or create, activate, and reveal the default right sidebar.                                                                                                                                                                            |
| LN-HIST-005 | The plugin MUST register `history-compare` through `ViewAccess.internal` and reuse one main-area tab. Previous or selected-pair compares MUST use Design Core FileDiff. Live-file compare MUST use one-way MergeEditor. Restore and apply MUST write through the vault API, record a restore revision, and suppress the next matching-hash modify.                                                                               |
| LN-HIST-006 | Storybook MUST demonstrate the real History panel in all six governed placements and a compare story covering FileDiff, MergeEditor, select-for-compare, restore, and History-leaf preservation. Compare Autodocs MUST document `HistoryComparePanel`, its `app` and `compareState` properties, explanatory component and story copy, and copyable public `@lapis-notes/history` source. New visuals MUST stay `visual-pending`. |
| LN-HIST-007 | Deno desktop, web, editor-demo, and audited Storybook hosts MUST register History as `enabledByDefault: true` and load it before metadata and layout restoration.                                                                                                                                                                                                                                                                |
| LN-HIST-008 | The timeline context menu MUST offer Select for compare and Compare with selected. The anchored revision MUST show a compare icon until cleared or the focused file changes. Compare with selected MUST stay disabled until a different revision is anchored and MUST open FileDiff of that pair.                                                                                                                                |
| LN-HIST-009 | The history-compare header MUST show a leading History breadcrumb plus parent-path segments of the compared file. The header title MUST be the filename and MUST NOT be editable. Selecting History MUST open or reveal the History panel for that file.                                                                                                                                                                         |
| LN-HIST-010 | Storybook MUST provide `Plugins/History/Shell` Desktop and Mobile stories that boot a real App with Explorer on the left, a multi-section Welcome note plus its stored-pair compare in the main area, and History plus Search retained on the collapsed right. Docs source MUST use public `@lapis-notes/history` imports. New visuals MUST stay `visual-pending`.                                                               |
| LN-HIST-011 | History MUST register a Design Core settings section titled History under core-plugins. The section MUST expose exclude globs, include globs, tracked extensions, retention, size cap, merge window, and debounce. Values MUST persist through plugin data and apply to capture.                                                                                                                                                 |

### LN-HIST-003 acceptance details

Tracking policy verifies:

- Default caps are 256 KiB, 50 revisions per file, a 10s modify merge window, and a short create/modify debounce.
- Default exclude globs are `.obsidian/**`, `.lapis/**`, `**/.git/**`, and `**/.jj/**`.
- An empty include-glob list accepts remaining paths after excludes.
- An empty tracked-extension allowlist accepts remaining UTF-8 text; a small binary deny list is skipped.
- A modify inside the merge window replaces the latest same-path modify instead of appending.

### LN-HIST-005 acceptance details

Compare and restore verify:

- FileDiff receives earlier and later snapshot texts ordered by `createdAt` and may use unified or split view from one toolbar toggle whose icon follows the current selection.
- MergeEditor one-way places the selected revision on the left and the live file on the right.
- Apply persists `onResolvedChange.content` only after an explicit user action.
- Whole-file restore writes through `vault.modify` or `vault.create` and records a `restore` event.
- Compare chrome keeps only its bottom border, places File Change Stats on the trailing edge of the revision row, and flushes embedded FileDiff and MergeEditor top, start, and end borders and radius.
- Wrap text is a pressed toggle that sets Design Core `wrap` and wraps long compare lines.
- Embedded FileDiff and MergeEditor MUST fill the compare body through Design Core ScrollArea so unwrapped horizontal scrollbars sit just above the workspace footer.

### LN-HIST-011 acceptance details

Settings registration verifies:

- `onload` registers a Design Core section titled History in the
  `core-plugins` navigation group, not only a legacy `PluginSettingTab`.
- Exclude globs, include globs, and tracked extensions are editable string
  lists. Defaults keep the documented excludes and empty include/extension
  allowlists.
- Retention, size cap, merge window, and debounce remain editable capture
  caps. Changing a field persists through plugin `saveData` and updates
  tracking.
- `Plugins/History/Shell` Desktop opens Settings, selects History, and
  proves exclude/include lists plus persisted plugin data.

## Runtime flow

```text
vault create / modify / rename / delete
        ↓
HistoryPlugin tracking + merge window
        ↓
AppDatabase.getFileHistory / storeFileHistoryRevision
        ↓
history command panel → history-compare tab
        ↓
FileDiff or MergeEditor → vault write
```

The plugin owns capture policy, settings, and presentation. It does not own
Turso drivers, workspace layout, or AI conversation files. The canonical
palette opener is `History: Open file history` (`history:open-file-history`).

The History panel chrome is an Explorer-style icon toolbar. It uses the
legacy compare icons (`git-compare`, `git-compare-arrows`) plus restore, and
it omits an in-panel title and file path. Timeline markers use
`git-commit-vertical`; the selected revision fills that marker. The panel
consumes `--ui-workspace-view-*` so ungrouped sidebars keep panel paint.
Compare FileDiff and MergeEditor keep Design Core typography: chrome
inherits the view font, and code uses `--ui-diff-mono` bound to
`--studio-font-mono`. The compare chrome arranges revision timestamps in
the leading column, a centered Explorer-style icon toolbar, and File Change
Stats at the trailing edge on one row. Below 40rem of owning-pane width, the
toolbar wraps onto a centered second row while timestamps and stats remain
above. It omits the file path
and close control, keeps the chrome bottom border, and flushes Diff card
radius. The compare tab header shows `History` plus parent-path
segments and the filename title; History opens or reveals the History
panel. `Plugins/History/Shell` is the full-app Desktop and Mobile catalog
family. Live-file compare enables MergeEditor scroll sync. FileDiff and
MergeEditor fill the compare body through Design Core ScrollArea so
unwrapped horizontal scrollbars sit just above the workspace footer.
Unified and split FileDiff share one toolbar toggle whose icon follows
the current view. Wrap text is a pressed toggle that wraps long FileDiff
and MergeEditor lines. The plugin registers a Design Core History settings
section for exclude/include globs, tracked extensions, and capture caps.

History registry-media Autodocs use the shared full-workspace framing governed
by LP-SPEC-044.

The signed runtime declares its compiled Svelte imports through the exact
compiler-versioned renderer contracts in LP-SPEC-014 and LP-SPEC-047. Host-owned
components and archived components share that renderer graph; npm package peers
remain portable.

Repository exports require the released API 0.2.0 contract. The independent
package metadata retains that peer prerequisite; legacy History
behaviors remain compatible. `jj-history` is an optional feature peer: hosts
using repository exports supply its public client, while legacy file-history
users do not need it.

The [shared repository guide](../../../../docs/repository-history.md) documents
public entrypoints, host ownership, optional clients and provenance.

Current shared-shell qualification uses the released Design Core 0.6
public boundary and matching Notes framework archives. Published dependency
ranges now admit that boundary directly; the Avatar repair remains a recorded
local candidate until the separate release gate.

Current App-backed catalog seeds and copyable host examples use `.lapis`
for application state, matching the Notes-wide default. Historical vault data
and the frozen Deno host are not migrated or edited.
