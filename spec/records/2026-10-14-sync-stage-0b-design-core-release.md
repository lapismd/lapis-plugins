# Sync stage 0B: Design Core release

Status: Design Core checkpoint complete, 14 October 2026. Stop for manual
review before the separate Mira release checkpoint.
This is the Design Core checkpoint of the
[incremental delivery plan](2026-10-14-sync-incremental-delivery-plan.md).
Mira and Notes shared-package releases, consumer refresh, and stage 0C landing
remain separate pending checkpoints.

## Scope and source

Release the existing status-item, copyable-value, and mobile tab-count
accessibility fixes required by the preserved Sync stack. No new framework
abstraction, Sync feature, visual baseline, or runtime activation is added.

Fresh fetches found no new Design Core, Mira, or Plugins main commits. Notes
main advanced to `eb89c878` through its CI dependency-image PR; its local audit
fixes and generated API metadata remain preserved for reconciliation in the
Notes release/landing checkpoint. Other workspaces and development data remain
intact.

Design Core's two prerequisite commits were copied onto current main
`bcd2db67d4ed441ba25f3d400bfda70b6134e806` without conflicts. The original
`local/shared-sync-prerequisites-20261014` reference remains recoverable.
Work runs in the default Design Core workspace.

- [Source PR #19](https://github.com/lapismd/design-core/pull/19), head
  `9732cad5a2c526ecf9b9e649a9964bc28ed08d8a`, merged as
  `e39d175c093067f4c79de4a8f6267eacc6f9d8bc` after all 11 required checks passed.
- [Version PR #20](https://github.com/lapismd/design-core/pull/20), head
  `32bb07e1f2048af9ec2b988e09b582de5ea232d8`, contains only the 0.3.3 version
  bump, changelog, and removal of its two consumed Changesets. Merged as
  `e047699011c65ff760aab04d53c496cb93c422da` after all 11 required checks passed.
- GitHub required approval for the bot-created version PR's CI run. Approved
  that exact run through the existing workflow gate; no checks were bypassed.

## Verification

- Source dependency audit: zero findings, exit 0.
- Fresh focused Storybook run: 29 interaction/accessibility tests pass across
  Status Item, Workspace Settings, Mobile, About Dialog, and Reusable Framework
  Demo. No functional or accessibility failures remain in these families.
- `pnpm checks:release`: passed, including 734 unit tests, 10 release tests,
  specification checks, zero-error/zero-warning strict consumer type checks,
  static Storybook, and workspace visual metadata validation.
- `pnpm packages:pack`: passed clean-consumer types and cold Svelte/Composer
  lifecycle acceptance with zero Svelte diagnostics. The packed production
  graph has six low-severity propagated KaTeX rows accepted by the existing
  `GHSA-238p-pmpm-9mq7` policy. This checkpoint adds no audit exception.
- [Source PR CI](https://github.com/lapismd/design-core/actions/runs/38622484175):
  all 11 required checks passed, including the complete interaction, browser,
  full/production dependency audit, and aggregate lanes. It reports 688
  interaction/accessibility tests and 85 browser tests passing, with one
  documented WebKit-only skip.
- [Version PR CI](https://github.com/lapismd/design-core/actions/runs/38623497163):
  all 11 required checks passed after approval.

## Publication and review

The default Design Core workspace is clean on merged main `e0476990` at version
0.3.3. All five jobs passed in the
[release workflow](https://github.com/lapismd/design-core/actions/runs/38624793389).
This includes clean registry installation, integrity, and npm provenance
verification. Merged-main CI also passed all required lanes in
[run 38624793421](https://github.com/lapismd/design-core/actions/runs/38624793421).

- Published package: `@lapismd/design-core@0.3.3`, visible from npm.
- [GitHub release](https://github.com/lapismd/design-core/releases/tag/design-core%400.3.3)
  targets `e047699011c65ff760aab04d53c496cb93c422da`.
- Downloaded the CI artifact and independently verified its package identity,
  Apache-2.0 license, source commit, SHA-256 and SHA-512 before publication review.
  The protected publication gate had already cleared before the explicit
  approval request; its stale request returned no pending deployment. No
  alternate publication or gate bypass was attempted.
- Downloaded 0.3.3 directly from npm and verified that both hashes match the
  reviewed CI artifact. Inspected its published source to confirm the status,
  copyable-value, and mobile-count fixes are present.
- Registry integrity:
  `sha512-jflkPlITjq3QRgfaBx6QJiaGseZEOCo3jQZwlGdMJJKlAQw0Ioep0Jq/Lsd+FXoZkjkLXbhn4dBR2gTcvR5UQg==`.

The release's cold registry consumer verifies the released public package;
Notes/Plugins dependency refresh and app integration remain in the subsequent
release/landing checkpoints. No app reset, Sync publication, registry dispatch,
or feature development occurred. Visual review remains pending, with no baseline
updates. Ordinary main app behavior remains at the earlier verified stage 0A.

The Plugins handoff changes only the two supporting records. Its formatter and
specification checks pass; its audit exits 0 under the unchanged existing policy
(two moderate and one high metadata finding, no unaccepted advisories). No
product suites or broad Plugins CI were started for this documentation-only
handoff.

The earlier Notes audit blocker is addressed locally by commits `a60b5bd6` and
`63fb3b83`: 80 of 81 findings resolved; the user explicitly accepted the one
remaining QMD advisory temporarily. Normal and production audits pass under
that recorded policy. This acceptance overrides the earlier no-new-exceptions
instruction only for the documented QMD advisory.
