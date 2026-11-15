# Released API compatibility provenance

Hosted Plugins run 43671610783 passes all four catalog shards, static Storybook,
quality and release artifacts. Its unit lane exposes one stale provenance check
in the separately invoked `pnpm audit:bases`: all 81 behavior cases pass, while
the report records API 0.6.0 instead of installed API 0.6.2.

The same exact command reproduces locally: one failed suite, 81 passed cases.
`node scripts/bases-compatibility.mjs --refresh-provenance` verifies that only
provenance changed, then updates the report's one API-version value. The
unmodified `pnpm audit:bases` now passes all 81 cases with zero failed suites.
No capability expectations, assertions, visual baseline or behavior changed.

The preceding source's complete `pnpm ci:release` passed on the empty JJ working
copy, including deterministic archives and fresh static Storybook. This narrow
follow-up runs the report consumer, formatter and specification checks; product
and artifact source bytes remain unchanged. Hosted verification must still pass
on the resulting commit before merge and authorized GitHub publication.
