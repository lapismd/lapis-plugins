# Standalone Bases 0.1.4 accessibility candidate

Notes PR #36 progressed past its original first-shard failures, then exposed
published Bases 0.1.3 accessibility defects in its retained consumer catalog.
The source fix in Plugins #26 cannot reach that registry consumer until release.
This candidate starts from Plugins main 96918b89, keeps all existing dependency
ranges, and prepares only Bases 0.1.4 with Changesets. It includes the pending
results-limit label contrast fix already on main.

## Changes

- Each Command input explicitly controls a unique list, including per-option
  lists in custom view settings. Property actions have accessible names.
- The multi-action property picker uses the public Command child composition
  to render grid rows with separate visibility and edit cells. Buttons are no
  longer nested inside listbox options. Native button keyboard events do not
  also invoke the row selection action.
- Hidden-property labels use the existing muted text colour instead of opacity
  that reduced contrast below 4.5:1.
- The new Property Picker Accessibility story leaves the actual picker open for
  axe and checks keyboard visibility changes and independent editing. Existing
  Editable Cells acceptance follows the new named visibility control.

## Focused evidence

The initial exact open-picker regression failed nested-interactive checks after
input/list and label repairs. The final cold run passes all four selected cases
in the two files, with zero interaction/accessibility failures:

```sh
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/bases/BasesWorkflows.stories.ts stories/plugins/bases/BasesViews.stories.ts -t 'Property Picker Accessibility|Schema And View Settings|Editable Cells'
```

This local run uses the already registry-installed Design Core 0.4.0 graph, the
Notes target that revealed the issue. Required CI must also qualify this
candidate's frozen existing dependency graph, full catalog, package checks and
release artifacts. No broad local suites run under the user's memory-pressure
instruction. No assertion, timeout, axe threshold or baseline is weakened.

Publication is not activated. After candidate CI passes, approve the Bases-only
release, verify its npm tarball, and refresh Notes through the registry. Then
complete Notes #36, its API/UI compatibility releases, and Plugins #26 in that
order. A local source alias or patched dependency does not qualify Notes.
