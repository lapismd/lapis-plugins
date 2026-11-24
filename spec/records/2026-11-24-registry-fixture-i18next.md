# Patched localization in registry fixture tooling

Notes PR 198's registry-fixture job fails its ordinary audit on the Plugins
checkout's direct private i18next 25 dependency. The exact owning reproduction
`pnpm run audit` fails once on main source 95d5fef3 with the same moderate
GHSA-6jcc-5g8w-32mx. The existing ignored low advisory remains separate.

The private root range advances to `^26.3.4`, resolving registry 26.7.2.
The exact audit then passes with zero unignored advisories; the existing ignored
low finding is unchanged. No audit ignore, native source pin, plugin manifest,
runtime implementation, package version or release/signing authority changes.
All coordinates remain ordinary published npm ranges and registry integrity.

## Temporary qualification context

Published API 0.6.12 retains its old 25 peer declaration. Its owner fix in Notes
PR 198 adds compatible 26 support and passes real localization/security plus
full owning-package acceptance. This private development fixture explicitly
records the resulting legacy API peer warning until that release is published;
no peer-validation setting is changed. Existing unrelated optional Vue warnings
remain visible too. This root-only change does not authorize plugin publication.
After the API release, refresh the registry API binding and remove the temporary
warning context. Consumer fixture adoption and publication remain distinct from
source checks below.

## Source qualification

The complete portable check and test lanes pass 17 tasks each (zero and one
cache hits respectively); build passes 16 tasks (one cache hit). Package checks
verify 16 public boundaries and 17 registry metadata sources. All four spec
lanes, including source intake and spec-first, pass. The complete cold catalog
run passes **410 interaction/accessibility cases in 71 files**, across all eight
shards with zero failed cases. No visual baseline is changed.

A clean isolated Jujutsu workspace also runs the ordinary fixture recipe:
frozen registry install, unchanged audit, retirement and framework-publication
checks, all builds, 16 npm tarballs, payload build/verification and 16
test-signed registry releases. Working-tree snapshot
`b5f99c90536b6fa0b40b6787409a97b56e5b96bf` supplies those bytes; hosted final-head
qualification and Notes' updated source pin remain separate gates.
An initial fixture attempt used an unnecessary Git-directory override and was
refused by the clean-working-copy guard. Removing that override restores the
ordinary workspace context; the guard remains unchanged and the complete
fixture then succeeds with generated test-only signing keys. No real signing
material or public publication is used.
