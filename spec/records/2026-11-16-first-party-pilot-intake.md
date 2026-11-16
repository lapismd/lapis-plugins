# Controlled first-party pilot intake and Bases provenance

The coordinator's actual pilot updated PR127 from current main0abf4958 through
reviewed bot head7784b5b6. The guarded post-upgrade hook generated its normal
`.changeset/lapis-dependencies-6882649476db.md`, containing ten independent patch
intents. The preceding4e96106e candidate had no note after an artifact error;
coordinator PR35 repaired the exact validator cohort guard and normal bot
regeneration supplied the source-owned intent. No note is hand-invented here.

## Narrow reproduced failure

On bot head7784b5b6, exact `pnpm audit:bases` reproduces the observed hosted
failure:81 individual tests pass, but one afterAll report-freshness assertion
fails. The stored JSON names installed API0.6.2 while the actual frozen registry
installation resolves0.6.7. There is no changed compatibility observation.

The existing `--refresh-provenance` mode executes every behavioral baseline
assertion and rejects changed source hashes, reviewed upstream identity,
coverage, dependency identities or observations before writing. It refreshes
only the observed API version in report.json; report.md is already byte-identical.
The same original `pnpm audit:bases` then passes all81 tests with zero failed
suites. Six dedicated producer controls also pass, including rejection of
behavioral, source, inventory and dependency-key drift. No implementation,
assertion, baseline, visual or acceptance threshold is changed.

The following controls remain byte-identical:

- `docs/bases-compatibility/baseline.json` SHA256 `b832b88892ec5c70b70232f132eef99ec80f19380f04814c0c3529a4d9254926`.
- `docs/bases-compatibility/inventory.json` SHA256 `90b229bfe7ddfc7a3e0c526e4af5514564fd1c65385b18c4e8f7ddbddab8c1ca`.
- `docs/bases-compatibility/upstream.json` SHA256 `245f3ede4b58b34dd4a791ee6b7b51e141687c815e5295cc4a243c5eb105abaa`.

Report comparison proves every field identical except
`implementation.dependencies.@lapis-notes/api`:0.6.2→0.6.7. All nine actual
implementation source hashes, manual gaps and individual observations remain.
This is executable query/metadata evidence, not complete product or native parity.

## Full-PR canonical scope

- `ai`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `bases`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `bookmarks`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `canvas`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `csv`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `graph`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `markdown`: `@lapismd/mira-editor` `~0.0.4` → `~0.0.5` (dependencies); `@lapismd/mira-plugin-mermaid` `~0.0.4` → `~0.0.5` (dependencies).
- `search`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `source-editor`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).
- `transcripts`: `@lapismd/design-core` `^0.13.2` → `^0.13.4` (dependencies).

Root/provider and each affected package chapter record the actual normal registry
intake. Historical broad Core compatibility unions and existing API peer lines
remain unchanged where their manifests retain them. No runtime version is
manufactured. The source-owned bot Changeset remains the release-intent authority.

Doctor succeeds with the existing wrapped-script alias warning, and QMD semantic
discovery finds the owning LN-BASE-045 and intake chapters. The required released
validator0.2.1 is already in the bot candidate's frozen graph. `pnpm run audit`
exits0 under the unchanged recorded policy: two LOW findings are ignored by that
existing policy; this is not a clean raw audit or a new advisory exception.
There are no new manifest, lockfile, override or audit policy changes in this
report/canonical repair.

Full-range specification validation, current-head hosted CI and all relevant
package, browser, artifact, signature and publication checks remain gates before
merge/release. Old candidate passes do not qualify a new head. Signing material
stays in the owning CI environment; the user's standing deployment approval does
not bypass source or artifact qualification. Nostr and Deno-only release paths
remain excluded.

Final local acceptance passes `pnpm audit:bases` (81/81), the six producer
controls, Bases Svelte/type checks with zero diagnostics, all three normal
specification lanes and an explicit full-PR-base spec-first check:13 protected
files mapped to13 canonical chapters. Added canonical prose and this record
use the existing workspace Markdown formatter; an initial attempt referenced a
formatter absent from this repository and was corrected without adding a tool
or dependency. Audit exits0 under its unchanged two-LOW ignored policy.
The source repair changes one JSON provenance value and canonical evidence;
all manifest/lock, producer logic, baseline, inventory and upstream files remain
unchanged from bot7784b5b6. Final-head CI is still required before merge.
