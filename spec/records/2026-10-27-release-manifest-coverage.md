# Manifest-derived release regression coverage

R7-priority deferred-test repair starts in isolated `r7-release-tests-20261027`
on clean committed Plugins `773bed9e99450bcba1f0896144da1afa0d6a1532`.
No package, catalog, lockfile, release payload or selected consumer archive changes.
The clean historical Markdown pin814f6d2d still has15 active packages and its
metadata expectation passes; its source and qualified public archive stay intact.
Current main has17 active packages after subsequent intake.

## Exact before

```sh
node --test --test-name-pattern='metadata dispatch dry run|parked Community cannot enter' scripts/dispatch-plugin-metadata.test.mjs scripts/parked-plugins.test.mjs
```

Before any test edit, both exact cases fail: metadata dispatch compares17 with15,
and parked-package coverage compares17 with16. Zero pass/two fail. The source
catalog correctly selects active packages; production behavior is unchanged.

The independent test oracle reads each package's npm and runtime manifests and
excludes only private plugins or folders without a runtime manifest. Complete
metadata payloads now compare repository, package/runtime identity and source
commit against those declarations, including uniqueness. Parked Community/Sync
selection and stale release plans retain their fail-closed assertions. Separate
fixtures cover one/two active inventories, private/non-plugin exclusion and a
malformed runtime manifest. No fake production package or fixed replacement
count is added. The same owning release suite exercises both consumers and the
new test-only helper.

Exact after, complete release tooling, required audit, formatting and canonical
specification results follow. Product/native/browser suites are out of scope for
this private regression-fixture change. Portable-lock enforcement remains a
separate unmodified guard; an existing failed guard is never reported passing.

## First complete tooling run

The remote SSH connection initially refuses before any container starts. That
setup failure is retained separately; no host fallback is used. The same frozen
packet48ab6cc7/c50fb964 is retried after SSH recovers and completes without OOM,
with an empty tracked mutation diff. Its unchanged773 parent reports140 pass/
six fail across146 release cases. After the manifest repair,145 pass/four fail
across149 cases; exact2 and affected13 pass, as does changed-file formatting.

Two remaining failures are enforced source-lock contracts: the Bits UI2.19.5
lifecycle patch is declared in workspace configuration but absent from the source
lock's patched hashes, and OIDC rejects its pnpm hook/local paths. They reproduce
on the exact parent and remain unchanged. The other two failures are fixture
leaks: the worker's outer base773 is inherited by independently created JJ
repositories; git pack correctly refuses that missing object. Each snapshot test
now launches the actual source exporter in a child environment with its own
fixture base, additionally asserting the captured base. No source exporter or
ancestry assertion changes. The complete consuming validation/release suites
are rerun; no global environment mutation is introduced.

Required audit against the installed verified-archive graph reports five
advisories: GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c,
GHSA-wq5f-xc86-pv6w, GHSA-848j-6mx2-7j84 and GHSA-238p-pmpm-9mq7.
These are the retained sharp/elliptic/KaTeX prerequisite findings accepted in
[the file-icon source record](2026-10-26-plugin-file-icons.md#explicitly-accepted-existing-findings),
not a fresh passing audit. Both parent and repaired source retain exact manifest,
workspace, lock and patch bytes; no advisory ignore is added. The initial full
specification check stops at missing mapped native-services/governance chapter
scope notes. Those mapped ownership/isolation notes are now added before retry;
no validator, functional assertion or package source is weakened.

## Private regression qualification

Source `00a1513212f2b5e20b3dcbe016b482bfe8c36309`, receipt
`6d5cf2ef-81a6-43cb-a904-1eb6f3d9d84e`, passes exact catalog2, affected13,
exact JJ snapshots2 and the complete51-case validation suite. Full release
tooling improves140/6 before to147/2 after (149 total after adding three fixture
cases). Only the independently reproduced Bits UI patch-hash and portable-lock
guards remain failed. Required audit retains the exact five prerequisite
advisories above. Formatting and all three specification lanes plus explicit
App ownership pass. Exit one/no OOM is retained for the aggregate because audit
and the two real source-lock guards still fail; the worker mutation diff is empty.

This commit qualifies four private test-assumption repairs. It does not qualify
release readiness, waive the source-lock failures or claim a passing full release
suite. Root has authorized a separate follow-up to repair those actual lock/
patch blockers, without publishing, weakening guards or refreshing unchanged
selected consumer archives. All production, package, patch and lock bytes remain
identical to773bed9e in this private test slice. Final documentation/validation
checks run after this evidence update; package/browser/native reruns remain
outside the test-only scope.
