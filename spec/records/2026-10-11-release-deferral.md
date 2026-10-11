# Plugins publication deferral - 11 October 2026

The operator requested retaining the full Plugins release workflow while
keeping it disabled until public Nostr configuration is available.

- GitHub `release.yml` and `renew-registry-heads.yml` are manually disabled.
- Repository variable `NOSTR_RELEASE_ENABLED` is `false`.
- Every job in both workflows requires that variable to equal `true`.
- Existing OIDC, immutable-candidate, protected curation and relay-quorum
  checks remain intact. No alternative npm-only publication path is added.
- Package version preparation remains a separate uncommitted candidate.
- Agent Redaction, AI Controller and Community installation/usage READMEs,
  npm version badges and independent specification Pages deployments are
  already committed and pushed in their owning repositories.

## Verification

The focused OIDC workflow suite had nine passing tests before this change.
The new activation regression failed once on the unguarded selection job;
after guarding every job it passes with all ten tests and no skips.
The complete release-tooling suite passes all 85 tests with no skips.
Workflow lint, formatting, the canonical specification check (validation,
mdBook and spec-first), and the explicit App-ownership audit pass.

`pnpm audit --json` still reports 27 pre-existing findings in the unchanged
Plugins lockfile: one critical, eleven high, eleven moderate and four low.
The owning Plugins dependency refresh and a normal registry-only installation
remain prerequisites for publication. This deferral changes no dependencies,
adds no audit suppression and does not declare the package release verified.
Package release verification and publication remain deferred.
