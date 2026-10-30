# Published foundation dependency refresh

The root and eight consuming package manifests now use published Design Core
`0.3.1`, Mira `0.0.3`, Spec Validator `0.1.4`, and the existing Mira editor,
AI, and Mermaid packages at `0.0.2`, through npm semver ranges. The ignored
hooks no longer remap the requested foundations. Existing Community and
AI Controller mappings are retained as requested. Direct installed origins
were verified as npm registry packages on 2026-10-11.

Validation:

- `pnpm check` stops at the required audit: 27 advisories (one critical,
  eleven high, eleven moderate, four low). The parent lockfile reproduces exactly the same advisory IDs and severity
  totals; no advisory exemption is added.
- Initial `pnpm ci:packages` stopped at Word Count's Svelte check with one
  no-input warning. A fresh focused check now passes with zero errors and
  warnings; the parent source also passes with the final installed graph.
  This initial warning is not a remaining blocker.
- The final package aggregate stops at Spellcheck's Svelte check: zero errors,
  one no-input warning in its TypeScript-only configuration. The focused
  `pnpm --filter @lapis-notes/spellcheck check` reproduces it. Spellcheck's
  19 unit tests pass. The aggregate does not establish a full package pass.
- `pnpm spec:check` and the explicit App ownership audit pass.
- Remaining package, Storybook, pack, and release checks are
  not qualified by these stopped aggregate commands.

The registry lock was generated in a temporary metadata project that omits
only the unavailable Community and AI Controller entries; the original registry
lock also lacked those prerequisites. Local validation uses retained ignored
hooks with `pnpm install --lockfile=false --force`. This arrangement preserves
registry resolutions for the requested dependencies but does not establish a
full frozen registry-only install. No audit gate or package check was weakened.

The migration remains uncommitted while required consumer lanes are blocked.
