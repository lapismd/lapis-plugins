# Plugin file artwork and CSV documentation qualification

Source: enclosing Jujutsu change `qylwqwnn`, based on `a8fd2491` with the
previously verified Bases accessibility change `1faa35a1` duplicated as
`56e3a584`. Default-checkout CSV, Markdown and registry-media work is preserved.

## Behavior

Bases registers its stacked-card SVG with the public lifecycle-owned
`Plugin.registerIcon` helper and contributes the returned ID for `.base` and
`.bases` editor patterns. The host needs no extension map or artwork copy.
LP-SPEC-056 records that contract. Notes owns the API and Explorer adaptation;
Design Core `99fa0952` owns the scoped renderer.

Archive validation now saves its actually installed dependency graph before
restoring the portable source metadata. `pnpm run audit` audits that graph from
an isolated temporary root, retaining ordinary pnpm advisory policy and failure
status. Ordinary registry audit still uses the source lockfile. LP-SPEC-057,
two executable graph/failure regressions and the quality-policy regression
cover this repair. No advisory ignore was added.

At the user's explicit request, Canvas Docs now identify the public
WorkspaceShell, use the governed isolated 700px frame, and provide a complete
App, vault, plugin-load, file-opening and teardown example. Canvas and Registry
Screenshots declare their real application composition. Existing CSV edit,
resize, persistence and registry assertions remain intact.

## Source results

- Bases package regression: 163 passing / one failing before, then all 164
  passing after icon registration and cleanup were implemented.
- `pnpm ci:packages`: all 48 build/check/test tasks pass across the 16 active
  packages. The final run reuses 45 qualified tasks and reruns the affected
  Bases tasks; normal build and prepack/publint also pass locally.
- Initial Bases browser run: 13 pass and six accessibility failures from
  unchanged unnamed Select controls. The existing source fix above is included
  as its own prerequisite commit. The exact seven selected cases then pass,
  followed by all 19 Bases interaction/accessibility cases.
- `pnpm validation:check`: 47 runner/composition cases pass. Final runner,
  composition and new audit regressions pass together as 49 cases.
- Audit-policy regression: one failure after routing through the new helper,
  then one pass after the test was updated to enforce the helper plus the
  unchanged ordinary CI audit. The graph tests verify the selected lock bytes,
  forwarded flags, nonzero exit status, source preservation and temporary-root
  cleanup.
- Release-tooling suite: initially 139 pass / three fail; after the policy
  correction, 140 pass / two unchanged baseline failures remain below.
- CSV specification regression: seven findings before, one remaining helper
  contract finding on the first repair, then zero findings. Both affected CSV
  families pass all five cold browser cases. Static Storybook and the full
  specification/App-ownership lane pass after the repair. Rendered Docs also
  expose the full public source through the actual Show code switch and a
  700px story iframe. The first browser probe incorrectly queried a button
  role; after inspecting the real switch, the exact content/frame checks pass.
- Spec-first passes for the protected source and authored chapters. Visual
  review remains pending; no baseline was created or updated.

Logs and immutable source/consumer manifests are retained in ignored
`.local/file-icons-*.log` and `.local/validation/runs/` directories. Important
runs are `8c3249c8` (48 tasks), `d005998e` (seven exact Bases cases),
`d866786e` (19 Bases cases), `1969cf37` (five CSV cases), `53739c7b` (static
catalog) and `4a488903` (specification/App ownership).

## Public artifacts

The public Bases npm tarball contains 159 files and is prepared through normal
prepack/publint. Its SHA-256 is
`a7ab0601c7feacca7341eea612b417f481ff40c276e400a3307f7c603fc40930`.
Artifact source is `ea51f96f267982e2e82bdce2ffb0f83566cb3fd2`; subsequent changes
are tooling, documentation and story metadata, with Bases public inputs intact.

Two complete runtime builds produce the same authenticated payload:
`1daf9b75d16070d48a78202fd6a693c2de59dc8fc3d987a14304cd94d9be966c`.
The runtime contains the actual SVG and public registration call. The public
payload verifier passes. Test-only Ed25519 signing, two identical signed
archives and the public signature/file verifier pass; the signed archive hash
is `0f9271f4b39ef43c750b70aef0307b8f1b9839b31fed9916474ef175f18a5dcc`.
The temporary private key is removed and its absence asserted. This is local
test qualification, with no production signing or publication.

Desktop's packed-package workspace case paints this actual SVG and opens the
same file in Bases in all four viewport/theme combinations. Notes and Desktop
retain their separate host evidence and exact API/Explorer archive cohorts.

## Explicitly accepted existing findings

On 2026-10-26 the user accepted these findings as separate issues for this
implementation, preserving the owning concurrent work and blocking publication:

- Five unchanged prerequisite advisories: three high `sharp` findings in root
  development tooling, low `elliptic` through the browser polyfill (no patched
  release), and low KaTeX through Mira. The candidate API no longer carries the
  old Zod advisory GHSA-mrhx-c7xc-m3w5; Notes upgrades Zod through its public
  compatible v3 entry. The ordinary audit command remains failed on the five
  findings and retains that policy.
- Existing CSV package metadata synchronization failure; no package sync was
  run over the concurrent CSV work.
- Four existing CSV style findings: `opacity-0`, `group-hover:opacity-100`,
  `overflow-visible` and `group`. The same exact source audit reproduces all
  four on immutable parent workspace `file-icons-baseline`.
- Two release-tooling failures, also reproduced on that immutable parent:
  metadata dispatch expects 15 packages while there are 16, and the existing
  registry lockfile contains local paths and a pnpm-hook checksum. Neither
  assertion is weakened and that lockfile is unchanged by this slice.

The seven CSV Docs/composition findings were separately reproduced on the
parent (`25221f52`) and fixed here at the user's request. Their acceptance was
not inferred from the other exceptions. Ordinary audit/style/metadata/release
failures above are not presented as passing gates or a release qualification.
