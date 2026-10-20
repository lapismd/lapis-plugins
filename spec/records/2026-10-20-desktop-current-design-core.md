# Current Desktop Design Core compatibility

Desktop's complete current-source archive installation rejects Design Core
0.5.1 because Source Editor, Markdown and Graph declare only `^0.4.0`. Each
package already uses the public component contracts with the source repository's
0.5.1 development graph. Broaden the three portable dependency ranges and the
catalog development range to `^0.4.0 || ^0.5.1`; preserve the registry lock and
independent release versions. No runtime code, API, baseline or release gate is
changed. Desktop's original seven History Search stories remain the consumer
regression; its archive install MUST retain semver admission.

Qualification commands/results follow after the source-owned range repair.

Source verification (logs under `.local/desktop-current-core-*`):

- Original Desktop archive install: 1 failure, Design Core 0.5.1 rejected by
  a `^0.4.0` plugin dependency. Admission was retained.
- Three affected package checks pass with zero Svelte errors/warnings.
- `pnpm check`: 13/13 package tasks pass; audit retains the same two previously
  ignored advisories, with no new ignore. Package metadata, ownership and native
  CSS audits pass.
- `pnpm test`: 13/13 tasks pass, 793 unit tests (including 62 Markdown, 60 Graph
  and 2 Source Editor tests).
- `pnpm build`: 12/12 package builds pass, including publint.
- `pnpm spec:check`: all three canonical lanes and App ownership pass.
- Scoped formatting first flags the generated registry lockfile; formatting it
  repairs that lane without changing any dependency resolution.
- Root Storybook interaction/accessibility qualification is running. No visual
  baselines are generated, updated or approved; publication remains deferred.
