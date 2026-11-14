# API 0.4 host admission

Tasks' Core 0.13.2 consumer failed two Svelte checks because Workspace 0.3.2
resolved Core 0.9 while the plugin resolved Core 0.13.2, producing distinct API
class identities. The last Workspace 0.3 release still excludes Core 0.13.
The already published API 0.4.0/Workspace 0.4.1 cohort admits Core 0.13 and
Mira 0.2, but the extracted plugins' API peer declarations excluded that host.
The repair belongs in this owning package repository before consumer adoption.

All 17 active plugin API peers now admit `^0.4.0` alongside their existing
0.2 ranges. Canvas retains its existing 0.2.4 editing-session floor. The shared
metadata generator owns those ranges so regeneration cannot undo admission.
Parked packages, plugin IDs, runtime source, native ownership and host-module
allowlists are unchanged. Independent patch Changesets collect release intent;
no fixed or linked version group is introduced.

The root frozen registry cohort uses API 0.4.0, UI 0.1.10, File Explorer 0.2.6,
Language Service 0.1.4, Workspace 0.4.1, Core 0.13.2 and Mira 0.2.0. No source
alias, dependency patch or consumer type cast is added. Semver is development
validation tooling for the actual public admission contract.

## Executed evidence

- The exact new peer-admission target reports 17 failures before the metadata
  change and passes all 17 afterward, retaining the API 0.2.4 host check.
- Docker quality passes every one of 18 tasks. Complete unit/build lanes pass
  all 1,340 reported unit cases and all 17 package builds/publint checks.
- Release preparation passes all 17 npm packs, all 17 plugin payload archive
  checks, and a fresh static Storybook build. One release-tool test initially
  expected only the old publication coordinates; it now asserts the full old
  plus new ranges without dropping any missing-package or aggregate checks.
- Complete eight-shard browser interaction/accessibility qualification passes
  335 cases. The 57 existing unfinished Sync skips remain unchanged. No
  assertion, browser timeout, quarantine or baseline is relaxed.
- The cold static/native browser lane passes all 27 cases.

Functional/archive source: `df6e913de73a3ee9730dcf825e2c7c91ad8c769b`.
Reports:

- Release preparation: `.local/validation/runs/lapis-plugins-validation-7da13e1e-793b-415b-9108-3e19ceadbfcf`.
- Full interactions: `.local/validation/runs/lapis-plugins-validation-90227ee4-74ba-4e3e-94bf-d6024209c4e1`.
- Native browser: `.local/validation/runs/lapis-plugins-validation-4e0e51d6-8672-4111-bed1-f40de54d80eb`.

The final tooling-only correction tightens the framework publication preflight's
new Workspace line to `^0.4.1`, matching the actual qualified API 0.4 pairing.
It changes no package manifest, lockfile or runtime graph from the functional
source above. All 221 release-tool tests and package/documentation boundary
checks pass after that correction. The existing audit policy passes without a
new exception. Specification validation is rerun on the final evidence record.

The retained packs are private validation candidates at their source versions.
They must never overwrite existing public registry coordinates. Exact-head
hosted qualification, Changesets versioning, publication and registry-only
Tasks/other consumer admission remain separate gates.
