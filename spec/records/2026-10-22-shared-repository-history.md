# Shared repository History extraction

The History package owns the existing Desktop repository components and pure
controllers through its public `repository` exports. Desktop retains native
admission and writer policy; hosted Notes supplies authenticated exact-text
transport. Legacy `HistoryPlugin` behavior and its runtime ID stay compatible.
The extraction preserves JJ Store, Community and brand license attribution.

## Source qualification

- Original Desktop controller target: 31 passed before extraction.
- Copied controller cases: 84 passed. The lease-identity regression failed once
  before repair; both binding cases pass afterward.
- Eleven shared production-shell scenarios pass interaction and accessibility
  checks, including History placements, narrow/dark and independent Op Log.
- Final complete catalog: 257 passed across four sequential shards (63, 83,
  49, 62), with zero functional or accessibility failures.
- All 12 package builds pass, including publint. All 12 npm archives pack.
- Complete check and test lanes pass all 13 tasks each. Release-script tests:
  119 passed. Static Storybook, specification and App ownership gates pass.
  Archive reproduction follows the required committed-source checkpoint.

The required audit first reported 18 findings. Updated declared Storybook,
Vitest and Vite ranges remove all unaccepted findings. Existing documented
exceptions remain unchanged. Active Design Core floors are `^0.6.0`.

## Regressions exposed during qualification

The first complete catalog attempt had 22 stale fixture/label failures. App
fixtures and public examples now use `.lapis`; Search and AI assertions use
current complete accessible names. The Graph focus scenario first opens a real
note, retaining the workspace's actual active-file context.

Vitest does not add Storybook's fullscreen body class. The shared panel harness
now bounds its own root to the viewport; all four Reading scenarios pass
without changing Markdown or Mira production CSS. The subsequent full run
passed 195 cases and found three AI shell failures. All nine exact AI shell
cases pass after using the current state path and measuring clearance from
resolved dock padding under LN-AI-027. The final full rerun passes all 257.

Shared History exposed a Design Core Avatar image-error lifetime failure. Two
source regressions fail before and pass after Design Core `05aaa6e2`.
Its complete source/browser qualification is recorded in that repository.
Only its officially prepared CSS archive is used for temporary acceptance;
publication is a separate approval gate.

## Consumer evidence and boundaries

Hosted Notes passes a real Node 24/native companion browser flow and cold
server restart with an exact retained operation pin and split file diff.
Its automatic-checkpoint smoke also passes. These are consumer results,
separate from this package's deterministic fixtures.

Desktop consumes the packed History public exports, including three shared
review CSS exports and its large raw Blame fixture. Five exact Blame layout
cases pass after their expected fixture path follows the packaged controller.
Final Desktop qualification is recorded in its own repository.

The unpublished optional `@lapismd/jj-history` peer uses an ignored local
archive overlay. Portable manifest ranges and registry lockfiles stay intact.
Registry-only qualification and package publication remain distribution gaps.
New stories remain `visual-pending`; no visual baselines were changed.
