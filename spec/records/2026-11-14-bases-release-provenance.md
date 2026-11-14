# Bases release provenance freshness

Version PR101's hosted unit job 132346912982 failed the exact standalone
`pnpm audit:bases` target: 81 behavior cases passed, one report-freshness suite
failed because package version 0.3.3 differed from report version 0.3.2.
Root package tests alone do not include this independent audit.

The owning release-version tool now reruns all audit probes after Changesets
and package synchronization using a provenance-only mode. Every normal
behavioral baseline assertion remains active. Before writing reports, the mode
admits only observed package/dependency version changes and rejects all other
report differences. It never writes the accepted compatibility baseline.
Ordinary invocation still checks exact complete report freshness.

A private, tracked-source fixture with Bases version 0.3.3 reproduces the
original one-suite failure with 81 passing behavior cases. Provenance refresh
then passes 81 cases, and the unchanged original `pnpm audit:bases` target also
passes all 81. The fixture independently verifies byte-identical baseline and
unchanged source hashes, observations, feature inventory and upstream identity.
Its version change is private test setup, not a published manifest change.

The focused Node suite changed from five passing / one failing case before the
helper existed to all six passing. Negative cases retain rejection of behavior,
source, upstream, coverage and dependency-identity drift. All 223 release-tool
cases pass. Full source package and specification qualification is retained
separately from eventual version PR, publication and consumer acceptance.

A private-fixture mutation of one accepted behavioral baseline is rejected by
`--refresh-provenance`; neither the tampered baseline nor either report is
rewritten. All 51 package build/check/test tasks pass (48 existing cache hits),
with all directly affected audit cases executed fresh. The first full spec
check identified one missing mapped native-services chapter; that canonical
coverage is added before rerunning the same check.

Final qualification also sets a later private fixture version while retaining
a deliberately mismatched behavioral baseline. The refresh fails before
writing the pending version provenance. Restoring the accepted baseline then
makes refresh and the unchanged original audit pass all 81 cases. After that
write guard was added, all 51 source package tasks and all three specification
lanes passed again. The dependency audit retains only its two previously
approved LOW ignores; no exception or package resolution changed.
