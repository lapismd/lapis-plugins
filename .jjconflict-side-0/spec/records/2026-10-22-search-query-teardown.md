# Search panel and query teardown

The Desktop migration's complete catalog passed all 500 assertions in its
first configuration but failed with four unhandled errors. Focused reruns
isolate two remaining errors to recent-query persistence after the Search
plugin has been disabled and the App's editing registry closed.

The owning Search view now awaits Svelte unmount at close and reuses that
idempotent teardown at unload. The exact unit regression changes from one
failure to a pass; all six view cases pass. SearchPanel ignores results from
a disabled plugin, awaits recent-query persistence and reports current query
failures through the owning App's existing notice surface.

The new pending-query disable story passes before and after; its source
fixture does not independently reproduce the consuming App teardown race.
The actual cold Desktop regression across Drafts, Chat Layout Review and
Repository File History now passes all 23 cases with zero unhandled errors.
Earlier attempts retain four, then two errors in their logs.

Search source check has zero diagnostics; its complete tests, build and
publint pass. Complete source check/test/build lanes pass 13 / 13 / 12 tasks, with 119
release-tool regressions. The complete cold Desktop consumer passes all 2,000
interaction/accessibility executions, 500 per theme/viewport configuration.
The final isolated-port source catalog passes all 258 cases across its four
normal sequential shards (63 / 83 / 49 / 63), with zero unhandled errors.
An earlier complete catalog attempt passes 255 cases before the browser
connection closes in Bookmarks registry capture; it is a failed attempt, not
a full-suite pass. No assertion, timeout or baseline is weakened.

Publication and visual approval remain separate. Desktop uses a temporary
public archive; manifests and registry lockfiles remain portable.

The repeated final-shard browser disconnect is traced to concurrent IPv4/IPv6
listeners sharing localhost port 63315 across repositories. Notes' exact shared
conflict stories fail 14 cases and record 12 icon errors before isolated port
63421 passes all 14 unchanged. Plugins now uses strict IPv4 port 63422; its
complete fresh 258-case run passes while the other catalogs run independently.

Static Storybook initially exhausts the default approximately 4 GiB Node heap.
The serial rerun with `NODE_OPTIONS=--max-old-space-size=6144` passes in 52.70
seconds. Source specification and App-ownership gates pass. Both complete
source checks had already passed their required audit, with only the two
existing documented exceptions (one moderate and one high). A redundant final
audit retry times out at npm's quick-audit endpoint on Node26 and Node24; no
manifest/lockfile dependency or CVE exception is changed.

The release builder correctly refuses an uncommitted source tree. The verified
source is checkpointed before deterministic payload reproduction and verification;
that follow-up records its exact source revision. No package is published.
