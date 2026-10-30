# Portable source lock and dependency-patch authority

This follow-up starts after private test closure407ada2e in isolated
`r7-release-tests-20261027`. Root explicitly requested repairing the actual
remaining portable-lock and stale Bits UI patch-hash blockers, without publication
or guard weakening. Selected consumer archives remain unchanged.

The prior full release suite retains147 passes/two failures: Bits UI2.19.5 has
no locked lifecycle-patch hash, and OIDC rejects local paths/pnpm-hook checksum.
The source currently declares Bits UI in pnpm-workspace.yaml but a separate
package.json pnpm.patchedDependencies map contains only pretext0.0.7. The package
map shadows the workspace map. The new exact patch-authority test is recorded
before moving those declarations; official registry lock regeneration follows.
All existing patch bodies and package release coordinates remain untouched.

The public registry currently provides API0.1.4, Design Core0.6.0 and
sharp0.35.5. Published UI0.1.3 and Mira0.1.1 use Bits UI2.19.5. No package needs
to be published as part of this repair. Any remaining frozen-registry or source
consumer failure will be recorded rather than hidden by archive overrides.

The exact patch-authority baseline is zero passes/two failures before config
edits. The first registry-only generator14f38d0a/f426414d uses Node24.15.0 and
pnpm10.34.5, exits zero/no OOM and changes only its generated lock. It removes
all machine paths and hook checksums and retains both original patch hashes.
The exact patch/OIDC family then passes11/12: a newly resolved Bits UI2.20.2
through Design Core remains outside the declared lifecycle patch. The guard
correctly refuses that resolution. A shared workspace override now selects the
already-qualified2.19.5 version used exactly by published UI/Mira and allowed
by both published Design Core ranges. No new consumer patch or patch-body
change is introduced. Regeneration and full graph qualification follow.

Second registry-only generatorf97bebf6/dd667563 passes with no archive overrides,
using the pinned Node24/pnpm10.34.5 toolchain. It selects only the qualified
Bits UI2.19.5 and both original patch hashes. The complete patch/OIDC family now
passes12/12, including the unchanged source-lock enforcement; its original
remaining source guards are repaired without relaxing either assertion.

Because the shared dependency graph changes, qualification widens to a fresh
frozen registry install, all release/validation tests, required audit, metadata/
App/style/parity gates, complete package check/test/build, static catalog and all
interaction/accessibility shards. Source/public packing runs only after package
build success. Live signing, publication, model assets and unchanged selected
consumer archive refresh remain outside this source prerequisite slice.
