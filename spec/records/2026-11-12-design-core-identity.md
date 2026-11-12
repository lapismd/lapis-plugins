# Design Core dependency identity qualification

PR #76 failed its quality lane at History's repository-status.ts:59. The
settings component resolved WorkspaceSettingsPageProps from Design Core
0.12.3, while its owning App registration resolved 0.12.4. AppShellController's
private members make those distinct package identities incompatible.

The exact local reproduction was `pnpm --dir packages/history check`, after
the normal frozen installation and public package build. It reported the same
one Svelte type error and zero warnings. No component or API implementation
change is required. History and Markdown already declare compatible union
ranges; their lockfile resolutions now use the same released 0.12.4 identity.
The unused 0.12.3 package and snapshot entries are removed. The separate legacy
0.9 consumer line and all other transitive versions are retained. No cast,
wrapper, dependency implementation edit or relaxed check conceals the mismatch.

An initial recursive refresh also refreshed unrelated transitive packages.
The final patch instead starts from the bot's exact lockfile and changes only
the two compatible resolutions plus the now-unused 0.12.3 records. Frozen
installation succeeds, and the exact History check passes with zero errors
and warnings. The initial direct spec check required the three mapped canonical
chapters; those now document the dependency identity contract and spec passes.

During qualification the bot replaced head 44ecaa2f with
7590f949cff2b4403f5c5bdf49e9ad4696f15e2d, adding the now-published Mira 0.1.5
intake and current main's Canvas changes. The repair was reapplied to that exact
new candidate while preserving those updates. The obsolete catalog run was
explicitly stopped and replaced by complete checks against the current source.
Current root checks, units and specification checks pass; full catalog and
artifact receipts follow below. Visual baselines remain unchanged and this
dependency PR does not authorize another package publication.

The final complete cold catalog passes 68 families, 316 cases and 57 existing
skips with zero functional or accessibility failures (run
f0cceba0-ad68-4cb7-bdc5-1a346a2af875). All 18 root check/test tasks and the
specification lane pass. All 17 npm packages build, pass publint and pack
(acdd118b-66aa-4131-a5cd-7f40b78157c4). The current candidate retains the
bot's exact registry Mira 0.1.5 intake. No visual baseline was changed.

History, Markdown and Canvas runtime payloads verify after building against the
qualified dependency graph. Their SHA-256 payloads are respectively
1d06268ca5500c71e98ca20e367fa75ab3807f4d647de08b5f67994f2c315246,
8649d83bd404363425a99ece4247355d05644be07381148400aa1f03f58a5f2e and
3c5548e162f7d776c3496951102468203408b21b5b3b33bee16d920adc465b5f.
An initial verification command guessed a lapis-history directory; the
registered runtime id is history. Verification against the actual manifest
coordinates succeeds. These are local qualification artifacts, not releases.
