# Native backup selection and passive observation

Status: **Source qualified**. Hosted adoption remains separate.

The existing Repository plugin retains its settings/status presentation. Hosts
may provide optional `BackupService.setEnabled(enabled)` for explicit persisted
selection. With that method, start/stop, close/reload/leave and configuration
projection only observe; legacy services preserve their existing behavior.

## Regression and focused evidence

- Before implementation, `node --import tsx --test
--test-name-pattern="explicit native selection"
test/repository/repository-native-backup.test.mjs` failed one exact case:
  the service received no persisted selection call.
- After implementation, all five new native/legacy selection cases and all
  96 Repository Node cases pass. The three retained Settings cases pass,
  including passive configuration events and a lost acknowledgement after
  a saved selection. Complete History Svelte and TypeScript checks pass.
- Exact baseline snapshot `c63c5d47`; focused source snapshot `bb1eaf68`.
  Source helpers are isolated Docker snapshots with checksum-verified public
  dependencies, four CPUs and 12 GiB per worker.
- The first broad attempt stopped at three missing mapped-context chapters.
  Distribution, native-service and governance context are now supplied. No
  functional product regression occurred in that attempt.

## Complete source evidence and retained baselines

Snapshot `10d84511` passes all 1,013 Vitest plus 96 Repository Node cases,
all285coldcatalog cases, complete Svelte/TypeScript checks, package metadata,
App ownership, specification, build and static Storybook. The npm tarball has
SHA-256 `e714935f9f0a9365f74aaeca3aa67f8b0fef089e95ef107d24eabe915710b028`.
Two independently produced verified runtime payloads match SHA-256
`ececef12fe4cca7568c7ada1a430d00005f619788e373e121ca4d99edda7831e`.

The full run is **failed with recorded findings**, not wholly green: one high
Zod audit finding, four CSV Tailwind findings and one committed dependency-graph
release test. The release suite otherwise passes139of140cases. The exact same
three commands reproduce those failures on parent `214917c8`, using identical
public prerequisite archives; the manifest and lockfile inputs are unchanged.
Baseline snapshot `a3684aa4` checks out exact parent214917c8. These known source
findings remain separately owned and unsuppressed under the user's standing
backlog-finishing direction and previously accepted baselines.

Final canonical source closure and App-ownership pass on snapshot `5916a07e`.
The runtime/controller inputs match full qualification snapshot `10d84511`;
only specification and evidence change afterward. Hosted
adapter/native/browser acceptance belongs to Notes CORE022/SRV028/WEB073/API186
and remains a separate gate. There is no npm publication, registry dispatch,
installed-app replacement or visual-baseline approval in this slice.
