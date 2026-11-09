# Bases embeds: released Core intake

## Scope

The root validation graph and Bases runtime require Design Core `^0.12.3` for
independent landmarks and IDs in repeated Board/Activity embeds. The portable
registry lock remains authoritative; temporary Core candidate evidence is
retained separately in `2026-11-09-bases-embeds.md`.

## Regression boundary

Plugin PR #68 at `9e0be87c2539b5725017dc1a2809c7d082a0b102` used released Core
0.12.2. Hosted CI `42543936643`, job `128925304718`, recorded exactly two
repeated Board/Activity Embed accessibility failures (14 passing cases and
33 existing private Sync skips in that job). Other jobs passed. The owning fix
is Core PR #69, merged as `1cb85ac4e2dec3d59f5bca9e6ed6f20a0338981f`.

Core version PR #70 passed complete CI `42682855192` at
`d2d72dce515937694eea5efb99419f374a0eb56b` and merged as
`e83d2b9b12f215d5d59d4bad223ab96fdf0558b4`. The approved release is 0.12.3.

## Registry qualification

Core release workflow `42685682445` passed. A direct npm check verified the
0.12.3 tarball SHA-256
`019b4fffd7b90dd1f7ad4ce9ae682d768d90b825e1521409de283c640f0cd7b9`
and SLSA provenance against the release source above. npm initially accepted the
publication before its public metadata became visible; no duplicate publish was
performed. The fresh registry-only Docker qualification passed as recorded below. Remote
Docker uses omarchy, 4 CPUs and 12 GiB, with expensive lanes run serially. No
archive manifest, local package override, alias or dependency-source edit is
permitted in this lane. The narrow reproduction is
`stories/plugins/bases/Embeds.stories.ts`, followed by full package, cold static
Storybook, canonical eight-shard interaction/accessibility and Bases media lanes.

Visual Delta baselines remain unchanged; changed stories stay visual-pending.
The user separately approved pending plugin publication and registry deployment.

## Shared settings identity regression

The first registry-only run,
`lapis-plugins-validation-bf30eb25-0d5c-4822-854e-fd365b3d5a97`, passed the
three exact Embed stories, audits, spec and tooling tests. Its package lane
reported one History settings type error (50/51 tasks passed): History retained
Core 0.12.2 while the shared UI graph resolved 0.12.3. This is a real dependency
identity failure, not an exception.

`pnpm update @lapismd/design-core --recursive --depth 0 --lockfile-only
--ignore-pnpmfile --ignore-scripts --save=false` with pnpm 10.34.5 regenerates
compatible 0.12.x resolutions together without changing package minimums or
refreshing unrelated transitive dependencies. Only root and Bases require the
new minimum. The cold rerun begins with the exact History package check, then
the Embed reproduction, followed by all required wider gates.

## Current-main integration

Remote main advanced to `07658710fdf3f21a4ceb5e4ddbadb77c897c8cf1` through
the already-merged Core 0.12.2 dependency update (#65). The Embed branch is
restacked on that single-parent base, retaining its dependency minimums and
Changeset. The lockfile was regenerated with the pinned command above; incidental
Lezer snapshot churn was removed. Local conflicted `main` remains untouched.

Run `lapis-plugins-validation-d7e63ac0-231e-41bf-84ae-058268c19593` proved the
History check had zero errors/warnings and all three Embed stories passed. It
was deliberately stopped during the wider package lane because its base was
superseded. It is not counted as full qualification. A new cold run qualifies
the integrated tree against current remote main.

An intermediate lockfile-cleanup mistake in run
`lapis-plugins-validation-4684c5ac-a0ee-4bcc-beab-184b0dba785c` was rejected
at frozen installation before tests. Regenerating the lock and restricting
cleanup to the snapshots section restored package metadata; the exact frozen
installation then passed. This aborted setup is not qualification evidence.

## Final registry-only result

Receipt `lapis-plugins-validation-284747f5-1777-497c-a59b-df00bd7eeddf`
qualifies source snapshot `d18d5f0c9113115750c5d9aa0630f25e7357a21c` against
base `07658710fdf3f21a4ceb5e4ddbadb77c897c8cf1`, with an empty archive manifest.
It passes the exact History check with zero errors/warnings, all three Embed
stories, all 51 package build/check/test tasks, 193 tooling tests, all 17 npm
packs, deterministic runtime archive verification and a cold static Storybook
build. Canonical eight-shard interaction/accessibility acceptance passes 277
cases across 64 files, retaining the same 57 private `sync-unfinished` skips.
There are zero functional, type, interaction, accessibility or transport failures.
All 28 Bases media assets are regenerated and seven deterministic items verify.
The existing audit exceptions remain unchanged; no quarantine, assertion,
timeout or baseline was loosened.

The original repeated-Embed accessibility count is 2 -> 0. The mixed-Core
History type-error count is 1 -> 0. The intermediate lockfile setup failure is
corrected and the new cold frozen installation passes. Signed-commit rewriting
changes identity only; the qualified runtime, dependency, Storybook and tooling
trees are retained. Documentation receipts are updated after qualification.

Core's fresh main CI `42685681211` also passed at its approved release commit.
The local Storybook server was restarted after the final dependency install;
Markdown Embed review shows 40 records, seven wrapping secondary fields, tags,
visible group counts and full-width separators. The expected invalid-YAML
Alert remains visible.
