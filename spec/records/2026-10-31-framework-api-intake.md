# Published API lifecycle intake

The registry API 0.2.3 artifact matches the qualified Notes source
`0d9d4d9253579541b1e796d7f2c68ef3b19a8df6` and publication run
`41190163735`. Root independently downloads the public tarball and checks its
743,727 bytes, SHA-256
`00f234336b3dd33cbcd0814ae45e819dc82484497caa051cdac9571d17f43700`
and registry SHA-512 integrity. The owning release agent verifies Sigstore
identity, SLSA source/run and the governed `next=0.2.3` tag. `latest` remains
0.1.0; no tag promotion is authorized by this consumer intake.

The owning publication completes all 14 jobs, including a fresh published
consumer and GitHub `api@0.2.3` release verification. That established helper
creates an npm/source/integrity-linked GitHub release with no attached assets;
no asset upload is claimed.

Raise the root API validation minimum to `^0.2.3` and Workspace minimum to
published `^0.3.1`, with the independent private Sync development API minimum
also `^0.2.3`. Keep UI 0.1.5, Core 0.7.2, Mira 0.1.3 and the exact composed
Bits patch unchanged while Core 0.7.3 completes its own source/release gates.
Public plugin peers, package identities and native pins remain unchanged.

Source qualification on the existing Core 0.7.2 registry graph passes the
frozen-install, dependency/patch identity, audit, full check/test/build/catalog
and tooling gates below. Clean-commit artifact preparation follows the normal
source guard. Final Core 0.7.3 intake and actual Bases/History
source/version/publication gates remain separate.

## Source qualification

- Frozen registry installs pass in both roots. Comparing all 1,325 root package
  entries changes only API 0.2.2 to 0.2.3 and Workspace 0.3.0 to 0.3.1; every
  other package version and integrity remains unchanged. Normal resolution also
  normalizes existing peer metadata without changing those artifacts.
- Main graph: 18 roots, 1,172 reachable packages, four Bits edges to one exact
  patched runtime. Independent Sync: one root, 684 reachable packages, four
  edges to one exact patched runtime. Each graph has only API 0.2.3 and all three
  compiled Bits postimages match the canonical hashes. Proofs are retained in
  `/tmp/lapis-plugins-api-intake-graph.json` and
  `/tmp/lapis-plugins-sync-api-intake-graph.json`.
- Existing EmbedPDF 2.15.1 Vue peer-resolution warnings are unchanged from the
  earlier intake; they remain visible. No dependency or diagnostic waiver is
  added. The original two patch/lifecycle tooling cases pass.
- Full Docker check passes all 18 tasks uncached, including audit, metadata,
  App ownership, catalog parity, native CSS and strict Svelte/type checks;
  run `lapis-plugins-validation-abd79f8a-5b9e-46ef-b103-bc89b2f7fd2d`.
- Full Docker unit lane passes 1,085 Vitest plus 96 History repository cases,
  zero failures, with all 18 tasks successful (one dependency build cache hit);
  run `lapis-plugins-validation-38f8aafc-010f-4586-8bcc-588d7e79e1d6`.
- All 17 package build/publint tasks pass (one cache hit), run
  `lapis-plugins-validation-e0e17f02-0122-48b4-987f-e2cafd14d8aa`.
- Complete eight-shard cold Docker catalog passes 264 cases, zero failures or
  errors, with the same 57 private Sync skips. All eight JUnit reports are
  present and every skipped class belongs to parked Sync; run
  `lapis-plugins-validation-9fc6c0e5-cd0b-400d-8fa9-b43df8660417`.
- Static Docker Storybook build passes, run
  `lapis-plugins-validation-7bdfff17-67d7-45f2-845c-154cca809ff7`.
- Independent Sync strict check and build pass, run
  `lapis-plugins-validation-8840dcb8-bd05-417d-ad9d-81c1ee3b2dbc`.
  Its test command retains all 205 governed skips and supplies no functional
  test proof for the parked package.
- Full isolated Docker release-tooling suite passes 163 cases, zero failures
  or skips, run `lapis-plugins-validation-b65f2c80-6835-4343-9ca5-5f30f7b6ca35`.
- The first specification check passes validation/mdBook but rejects two
  missing mapped canonical updates (native services and governance). Add those
  owning contract updates and rerun the same gate: all three lanes pass, with
  zero findings. No mapping is weakened. Logs remain at
  `/tmp/lapis-plugins-api-intake-spec.log` and
  `/tmp/lapis-plugins-api-intake-spec-after.log`.
