# Independent Sync audit repair

PNG PR #93 passed the root audit after its Hono Node adapter intake, but CI's
separate `pnpm --dir packages/sync audit --ignore-workspace` still reported two
moderate findings against the parked package's 2.1.5 resolution. The exact
command reproduces both findings. Its already permitted range now resolves
registry 2.1.6 with the registry integrity, unchanged peers and no other graph
refresh.

The exact audit passes with zero active findings and the same single governed
low finding. `pnpm --dir packages/sync install --ignore-workspace
--ignore-pnpmfile --frozen-lockfile` passes. Standalone check reports zero errors
or warnings, the test lane collects 18 files with all 205 cases intentionally
skipped under the existing parked policy, and the public build/publint pass.
No tests, exceptions, package versions or publication eligibility change.

The root audit independently remains clear of active findings. Advisories:
https://github.com/advisories/GHSA-qv5m-9pm6-hqp3 and
https://github.com/advisories/GHSA-jpvv-r467-5p4w.
