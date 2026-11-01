# Search file observation in hosted workspaces

`LN-SRCH-005` now observes Vault file identity as well as database publication.
The native index can publish a hit before the renderer discovers its file;
the later Vault create event must make that hit visible. Both subscriptions
are disposed with the Search panel. Native indexing and explicit App ownership
remain unchanged.

## Regression evidence

- Server `web/playwright.rust-metadata.config.ts`, the retained native metadata
  journey: one failure before the projection repair; one pass after the repair
  and explicit retirement of saved editor claims in the fixture.
- `observe-search-results.test.ts`: two passing cases cover delayed file
  discovery, unrelated database domains and observer disposal.
- The intermediate hosted attempts remain failed receipts: they exposed an
  incorrect recovery fixture and saved editors left active during shutdown.
  They are not counted as passing native acceptance.

## Source qualification

The explicit verified archive cohort is `.local/ui-parity/search-cohort.json`.
The normal remote Docker lanes pass:

- `pnpm check`, including audit, package policy and App ownership:
  `lapis-plugins-validation-5687cdbf-fc3e-47d9-b368-99b5536b53d5`.
- `pnpm test`: `lapis-plugins-validation-9e25406a-14d9-4bb1-8973-8b449afcee5d`.
- `pnpm build`, including package publint:
  `lapis-plugins-validation-a7b64616-8cae-4962-aba6-9f92745efbd4`.
- `pnpm spec:check`: validation, mdBook, mapped contracts and ownership pass.
- Complete eight-shard `pnpm test:storybook`:
  `lapis-plugins-validation-dc3e1ef3-c28d-4256-ae36-58218afc25c2`.
- `pnpm build-storybook`:
  `lapis-plugins-validation-21e558fd-f730-4549-adb1-6dbc889a733c`.

Audit retains the two previously approved low findings; no exclusion was added.
The separate registry-lock `pnpm audit` reports one unignored moderate minimatch
finding through the old published History/Core graph. The qualified archive
graph has zero unignored findings. That registry distribution limitation stays
open until the separately authorized source releases and lock refresh.
Npm/runtime artifact qualification follows the committed source. Publishing,
signing, registry mutation, pushes and deployment remain outside this task.
Visual review is pending; no baselines were updated.

`pnpm ci:release` passes from committed source `cb60ef51` in
`lapis-plugins-validation-a872e349-3aa1-4201-8b35-2337c88ce6d6`: 17 npm
archives and 17 reproduced/verified runtime payloads are retained, along with
the static catalog. This is local artifact qualification and invokes no
production signer or publisher.
