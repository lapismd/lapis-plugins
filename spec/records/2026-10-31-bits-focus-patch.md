# Composed Bits UI lifecycle and focus patch

The user explicitly authorized manually patching Bits UI on October 31.
Use a tracked pnpm patch for the published 2.20.2 package and retain normal
registry names/ranges. This is the scoped exception to the workspace's generic
patch prohibition; it does not authorize another package identity or test waiver.

The payload combines:

- Link Preview selection-timer/destruction cleanup retained from Notes' existing
  2.20.2 patch. Its document-listener cleanup is already upstream in 2.20.2.
- Slider destroyed-state guards for all six single/multi pointer handlers,
  retained from Plugins source `201b1feb60fe97ee383ea30b061e453e1ad5e853`,
  [the prior receipt](2026-10-27-preview-lifecycle-slider-drain.md) and LP-SPEC-058.
- FocusScope's same-container guard from owning Bits source
  `692fbdf5095941464561189fd81ffc2cb4b81c6c`,
  [upstream PR #2264](https://github.com/huntabyte/bits-ui/pull/2264).

The original Plugins 2.19.5 patch SHA256 is
`4fbe511eb1c148b33aa474fa3bd7efd13d8401111b37dbbb7f9bd64c951ec894`.
Preserve existing lifecycle behavior while aligning the version with Notes/Core.
Root pnpm patch settings do not propagate from a published dependency; each host
must register the reviewed patch and lock its hash explicitly.

## Before state

- `node --test scripts/bits-ui-lifecycle-patches.test.mjs`: two passes.
- `pnpm audit --json`: one blocking moderate minimatch advisory,
  GHSA-g3hv-75wg-m249 through API 0.2.0 -> minimatch 10.2.6.
- The source-owned API fix is already published in 0.2.2. Validation also aligns
  its UI/Core/Mira peers through ordinary registry versions; no minimatch
  implementation is patched in this consumer.
- The existing package-release workspace `qzorkqrm` and conflicted local `main`
  remain untouched. This isolated workspace starts at actual remote
  `879581d1549187bdbac2d75b40d02e0df46e721a`.

## Installed patch input

The canonical composed 2.20.2 patch SHA256 is
`debd3bc7d43917f0967f0cc1e212fc5c7721c751d3b92bf8f31030d1c96289ad`.
A normal frozen registry install passes. The active graph across 18 workspace
roots has four reachable references to one Bits runtime, and all three patched
file SHA256 hashes match the owning artifact. The two lifecycle/lock regressions
pass, including all six Slider guards on 2.20.2. The obsolete 2.19.5 patch is
removed from the current graph; historical receipts retain its original hash.

The repaired API/Core cohort removes the blocking minimatch audit finding.
`pnpm audit --json` exits zero, with no nonignored advisories and the two
previously accepted low findings retained. No new ignore or exception is added.

## Consumer qualification

The independent private Sync graph also registers the same root patch using a
relative repository path, with a separate frozen lock. It explicitly supplies
API 0.2.2, Core 0.7.2, UI 0.1.5 and Mira 0.1.3. Both roots' reachable Bits copies
match all three canonical postimage hashes. Sync remains private and parked.

The original incomplete native setup found six failing cases and four Svelte
errors after dependency re-optimization, with Sync's independent dependencies
absent. That run is retained at
`/tmp/lapis-plugins-bits-bases-family-before.log`; it does not qualify the
normal Docker fixture. The empty `Gallery` filter was stopped before any cases
ran and contributes no acceptance count.

The proper cold Docker Query Controls case reproduced one failure against the
2.20.2 accessibility contract: a Select was queried as a button. Changing only
the twelve affected Select role queries across three Bases story files retains
all original purpose names, values, options, geometry and actions.

- Original exact: one failure, three intentionally filtered cases, run
  `lapis-plugins-validation-aa19d665-1801-411c-aa74-62ecb12bc912`.
- Identical exact after: one pass, three intentionally filtered cases, run
  `lapis-plugins-validation-ee92c673-080a-49f5-b02a-7cb1a9b153b6`.
- Complete Bases Views/Workflows/Registry Screenshots and Transcript Reading:
  19 passes across four files, zero failures/errors/skips, run
  `lapis-plugins-validation-6587edd9-e953-4c79-b452-52005e5ad414`.

The canonical patch's owning Core Linux regression independently improves
31 passes/one failure to 32 passes/zero failures with unchanged assertions;
that source-owner result does not substitute for this repository's consumers.

## Complete catalog and tooling

- Full Docker quality lane: 18 of 18 package tasks pass, with zero strict
  Svelte/type errors or warnings; run
  `lapis-plugins-validation-34b4762a-5bab-4c90-a575-d25c6a7624a6`.
- Full Docker unit lane: 18 of 18 tasks pass (one dependency build cache hit),
  including 1,085 Vitest and 96 History repository cases, with zero failures;
  run `lapis-plugins-validation-d16c0069-cb6b-48c4-9dcf-69d54f4cd288`,
  `/tmp/lapis-plugins-bits-test.log`.
- Full Docker package build/publint: 17 of 17 tasks pass (one cache hit);
  run `lapis-plugins-validation-30b1e289-0911-418c-b5ce-c3c3146d314f`,
  `/tmp/lapis-plugins-bits-build.log`.
- Cold Docker static Storybook build passes in 1m13s; run
  `lapis-plugins-validation-d296bc71-55ee-4722-a383-c9fc582db047`,
  `/tmp/lapis-plugins-bits-static.log`. Existing browser-externalization and
  chunk-size warnings remain visible.
- Independent parked Sync Docker check/build pass; its test command retains
  all 205 governed skips across 18 files and supplies no functional test proof.
  Run `lapis-plugins-validation-950d374e-c761-4e87-ae82-f13dfa2cd62b`,
  `/tmp/lapis-plugins-bits-sync.log`.
- Full eight-shard cold Docker catalog: 264 passes, zero failures/errors,
  57 unchanged private Sync skips across 63 files; source run
  `lapis-plugins-validation-566be776-b432-4c6a-a702-c66f69704bf7`.
  JUnit confirms every skipped case belongs to the parked Sync catalog.
- Complete native Node release-tooling suite: 162 passes, no failures/skips;
  `/tmp/lapis-plugins-bits-tooling-native.log`. This supplements required Docker
  package validation. A concurrent Docker tooling dispatch correctly refused
  the held workspace lease before executing tests.
- Latest validator doctor and semantic discovery pass. Final source spec-first
  maps 12 protected files, including patch payloads, to five canonical chapters.

## Remaining qualification

Record the composed patch checksum and frozen graph, original affected cold
stories, complete interaction/axe/check/test/build/audit/package lanes, and
separate actual publication/host acceptance before claiming release completion.
Failed attempts remain retained. No baselines or diagnostic thresholds change.

Remove a hunk only after a released upstream package provides equivalent
behavior and every consumer passes the original lifecycle/focus regression on
a fresh unpatched install. Keep the upstream contribution and removal gate in
the canonical specification until that proof exists.
