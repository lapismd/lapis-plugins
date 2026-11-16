# Source-owned version runtime guard — 16 November 2026

LP-SPEC-016 version preparation adopts the shared Lapis CI runtime guard at
reviewed commit `c6f5827520787256cce793a1a33b75f86e14bd81`. The consumer owns
only `.github/versioning-runtime.json` data; no guard implementation is copied.
The guard runs after a releasable public changeset is detected and before the
existing repository-scoped writer App token is minted. Empty main jobs skip the
guard, App minting and version action through the same eligibility condition.

The existing frozen setup and CLI 2.31.1 remain intact. The real command is still
`pnpm release:version` → `node scripts/version-public-packages.mjs`, with its
held-package behavior, GitHub changelog configuration, metadata/documentation
sync and `audit:bases --refresh-provenance`. Commit mode, version action pin,
public-package eligibility and all publication/signing credentials and gates
retain their existing semantics. This slice adds no Changeset or package bump.

## Actual whole-recipe evidence

Lapis CI [PR6](https://github.com/lapismd/lapis-ci/pull/6) owns the shared helper;
[PR7](https://github.com/lapismd/lapis-ci/pull/7) fixes only its detached fixture
baseline. The first proof failed at Changesets status because local `main` was
absent. The corrected fixture compare-and-creates that ref only in the known
disposable hosted checkout, at its exact selected immutable HEAD, preserving
source/config/note bytes and every status/mutation assertion.

[Genuine proof 43785402039](https://github.com/lapismd/lapis-ci/actions/runs/43785402039)
completed successfully on Node 24.15.0 and pnpm 10.34.5. It checked out original
public Plugins source `03edd845b35cb3e33f4c963fce3ea787f8e373c4`, including the
genuine `.changeset/quiet-remotes-keyboard.md` (SHA256
`0e46a5c01028001efd1a88cacaf3a89a86404db04e840e0090e214c06e325267`).
That existing note was consumed in the historical version commit; no new note
content was manufactured or restored into the active repository.

The exact frozen install, source guard and Changesets status passed. The
unchanged whole recipe prepared History 0.5.0 → 0.5.1, changed its changelog,
aligned package/manifest/README metadata, executed the real Bases compatibility
and provenance tests, and consumed the genuine note. Deno was absent from the
qualified PATH. Changelog API reads used the existing read-only workflow token;
no writer App was minted and nothing was published. The operational receipt
records `status:passed`, `recipeQualification:actual-source-node24-no-deno`,
`published:false` and `writerAppMinted:false`; it remains an ignored downloaded
artifact rather than a copied report in canonical source.

## Connection to current source

The historical proof is distinct from this adoption. Current main's runtime
inputs were compared explicitly, rather than treating source-green CI or a
matching executable shim as whole-recipe proof:

The inspected adoption base is `38697acf9fd0553d89887c2ea7f3955fa0668b8f`.
The downloaded successful receipt has SHA256
`8a46805c22b878b80e794170a5b94cbe3e276a2d50fed87a7f7c741703b6c4c9`;
the workflow run binds its helper source to the pinned commit above.

| Input               | Exact historical SHA256, also matching inspected current main      |
| ------------------- | ------------------------------------------------------------------ |
| Root package.json   | `d885c0ef8942b46349472674991b332fb07d66c9f07411eb196a09390745ce0c` |
| Root pnpm-lock.yaml | `5a842187b8b4cc576d2f1124c27705dcabd88029f5ff86370794f2c7de44a1ff` |
| Changesets config   | `8b1dab21462dc42931b276d9b2471089fcd3728c1595b1c8a4eb74a7bdd7fed7` |

All nine source recipe files bound in the qualification JSON match, as do 91
literal relative import/test files followed from the recipe and Bases
compatibility test roots. The complete Bases and compatibility-provenance
subtrees have no diff. The bounded scan has no unresolved relative imports;
it is not arbitrary dynamic-call or complete workflow-security analysis.
Current version-only package data differs after the historical release, while
the actual root lock/runtime tuple and executed source closure stay unchanged.
No additional projected fixture is inferred from package version data alone.

The pinned guard accepts the current CLI2/config/nine source inputs on local
Node 24.19.0. Its data binds exact project config bytes, pnpm, named script
commands and source hashes; changed inputs require source-owned requalification.
The shared helper independently checks its reviewed direct CLI package code and
metadata. Existing current-head CI/audit gates remain necessary for transitive
and product behavior; this bounded preflight replaces none of them.

## Before/after qualification

The exact new integration target initially failed 1/1 because no shared guard
preceded App minting. After adoption it passes 1/1, and the directly affected
authentication/releasability/version targets pass 8/8. The existing workflow
regression now requires all three gated steps: guard, App mint and version.
It retains the original command, authentication, API commit mode, no-release
behavior and immutable action-pin assertions. The actual empty source still
reports that no pending changeset can bump a public package.

The complete native release-tooling lane passes 235/235. Package checks verify
17 manifests, 17 documentation sets, 17 public package boundaries and 18 registry
metadata sources. The registry audit gate exits 0 with its two existing governed
LOW findings retained in metadata; this is not a clean raw audit. The committed
[October29 policy](2026-10-29-unpatched-audit-exceptions.md) owns elliptic and
deepmerge on their existing build-tool paths and removal conditions. Current
official npm latest remains elliptic 6.6.1 and deepmerge 4.3.1. This slice changes
no manifest, lock, override, CVE ignore or expiry, and transfers no coordinator
advisory decision to this repository.

Spec checks passed all three lanes; QMD discovery, App-ownership audit,
formatter and actionlint passed. Doctor passed ten checks with the known
wrapper-alias warning. Full
hosted functional/interaction/accessibility CI and the next actual main
version candidate remain separate from the completed historical recipe proof;
no artificial note is created to trigger either.

## Next bounded adoptions

| Pipeline                           | Preserved source contract                                                        | Required next boundary                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core, Mira, Server                 | Existing CLI3 version/lock/format recipes, with Mira metadata sync               | Prove each genuine source recipe on Node24, preserving its exact config and commands before adding source data/shared action                       |
| Tasks, Docs, Notebook              | CLI3 `node scripts/release.mjs version`                                          | Review the custom metadata/artifact closure and perform its whole genuine recipe proof                                                             |
| Lapis AI, Lapis Terminal, jj-store | Existing CLI2 custom version helpers/metadata sync                               | Qualify each portable npm recipe separately; successful Plugins proof does not transfer                                                            |
| Visual Delta                       | CLI3 and explicit corepack-pinned pnpm command; no root packageManager field     | Add a tested upstream extension for its source-owned package-manager boundary before adoption; do not add a manifest field solely to fit the guard |
| Agent UI                           | Existing CLI2 version action/default command; no release:version manifest script | Establish the original workflow-command contract upstream and prove it without replacing the consumer recipe                                       |

Other repositories without a declared Changesets recipe require their own
source mechanism review rather than automatic guard insertion. Community,
Nostr, Deno-only packages, Notes' frozen setup, and intentional AI Controller/
AI Host Deno formatter/runtime recipes remain excluded from this portable
adoption. No Deno prerequisite is removed or formatter policy bypassed.
