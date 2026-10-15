# Sync stage 0B: Notes API release

Status: complete, 15 October 2026. API 0.1.4 is published and clean-consumer
verification passes. Stage 0B is complete. Stop for review before stage 0C;
Sync landing was not started in this slice.

## Qualified candidate

Source [PR #28](https://github.com/lapismd/lapis-notes/pull/28) merged at
`967a92fb123c9cb66fca976c689fafdd00aa65b6`, with all required Lapis CI checks and
all three native desktop targets passing. The complete Catalog has 249 passing
interaction/accessibility cases. Caught line-range diagnostics fail no tests;
the user explicitly directed moving on rather than extending that investigation.

Version [PR #30](https://github.com/lapismd/lapis-notes/pull/30) passed all
12 required checks at `cb3da6585ea892041ea9c668b4530c760d26e335`, then merged at
`ecb193a9493d5749f063ffe430d8eed30d153bf4`. It consumes the nine API patch
Changesets and changes only `@lapis-notes/api` from 0.1.3 to 0.1.4. Other public
versions remain UI 0.1.2, Language Service 0.1.1, File Explorer 0.1.2 and
Workspace 0.2.1.

The default Notes workspace was fetched from both remotes and moved to an empty
change above that main revision. The diagnostic prototype is separately
recoverable at `local/parked-catalog-diagnostics-20261015` (change `wvkppryo`,
commit `2b97e925`). It is unmerged and excluded from the release. Publication
uses clean CI output, not the stale ignored local `dist` directories.

## Release evidence

The normal [Release workflow](https://github.com/lapismd/lapis-notes/actions/runs/38655360200)
was dispatched from the version commit with `publish=true`. Its mandatory
candidate checks precede OIDC publication, a clean registry-only Vite/import
consumer and package-scoped GitHub release creation. The redundant automatic
push Release run was cancelled so this single explicit run owns validation.
No release gate was bypassed.

Downloaded the immutable candidate artifact from that run. It contains only the
API 0.1.4 tarball, tagged `next`. Its SHA-256 and SHA-512 match the manifest;
SHA-256 is `21384ab523f0a57b09c149f8869761dd02ab8be74516c56cd553cfa2452fe6ad`.
The `sync-repository`, `sync-security-host` and `metadata-store` public exports
have both runtime files and declarations. The security service, mutation
snapshot helper and editing-session registry are present in the packed output.
This is packed-artifact inspection, not proof of live Sync integration.

All 12 release validation checks pass, including complete Catalog interaction/
accessibility, Web acceptance and both packaged desktop lanes. OIDC publication
succeeded with signed provenance at transparency log index 3256612702.

The first clean-consumer job failed once with
`ERR_PNPM_NO_MATCHING_VERSION`: npm had accepted publication but explicitly
reported processing, and 0.1.4 still returned HTTP 404. After availability was
confirmed, only that failed verification job and its dependent release step
were rerun. Passed validation and publication jobs were reused; no product or
release-tooling workaround was added.

Actual npm metadata now returns API 0.1.4 with `next: 0.1.4`; `latest` remains
0.1.0. Its downloaded tarball is byte-identical to the CI candidate and has the
same SHA-512 integrity. Published Sync runtime/declaration exports and App's
editing-session registry pass inspection. The npm SLSA provenance statement
references that tarball, the exact version commit, main's `release.yml` and
Release run 38655360200 attempt 1.

Attempt 2's clean registry consumer installation, Vite build and import
resolution pass. The one failed verification job is now green after npm
processing; the final Release run passes all 16 jobs, with no skipped or failed
jobs. The published
[API 0.1.4 GitHub release](https://github.com/lapismd/lapis-notes/releases/tag/api%400.1.4)
targets the exact version commit and was created at 23:59:17 UTC on 14 October
(15 October locally). It is not a draft.

The documentation handoff passes specification validation (6 validators,
26 chapters, 552 requirements) and the existing Plugins audit policy. No audit
exception, baseline, product assertion or timeout was changed in this slice.

## Review boundary

This release supplies the generic host/editor persistence, encrypted local
repository, security custody and pairing contracts required by Sync. It does
not enable a Deno sync connection or incoming working-file application.

Stage 0C remains next: refresh remotes, rebase/land the qualified temporary
Sync stack, consume the released dependencies through npm, and prove main-app
startup and ordinary note editing/saving. Preserve all parked work and
development data; remove superseded workspaces only after the agreed review.
The Sync plugin itself and registry activation remain unpublished.
