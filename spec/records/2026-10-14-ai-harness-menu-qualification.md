# AI harness menu qualification

Plugins PR 7 passed all nine jobs on its third CI attempt and merged as
`4589f345aa879ccbb27a454f2272878bc602ee7d`. Its main run
[38530410868](https://github.com/lapismd/lapis-plugins/actions/runs/38530410868)
then reproduced the two original AI failures: Harness Model Refresh could not
find the Cursor model, and Settings Harness Model Refresh inherited a modal
pointer lock. This is an interaction readiness defect, not a runner-label issue.

The plays now observe the selected agent/runtime and public model loading state.
They dismiss the focused menu, await its removal, close any remaining parent,
and wait for pointer ownership to return before continuing. Pointer hover,
checked default, old-model absence, runtime diagnostics and accessibility gates
remain intact. Assertions and timeouts are not weakened.

Both original stories passed locally in isolation and the old 62-story shard.
The first explicit loading/teardown repair reproduced two local failures; the
completed dismissal sequence passes both exact stories and all 23 Chat stories.
All 177 interaction/accessibility stories then pass on fresh processes. Root
check/test/build pass 13/13, 13/13 and 12/12 tasks; audit uses the unchanged
recorded exceptions. Specification and App ownership, all 105 release-tool tests,
the static catalog build and twelve npm packs pass. GitHub qualification remains
the source merge gate.

An earlier CI attempt also reported one File Properties Sidebar Group
`derived_inert` diagnostic. Its cold exact local reproduction passes 1/1 and
the original complete local catalog passes 177/177. The fatal runtime guard is
retained; recurrence in the repaired full lane must be investigated separately.

This slice changes the acceptance plays and their governing evidence. Plugin
runtime code, package versions and visual baselines are unchanged. The private
Sync workspace and its local main bookmark remain separate from GitHub main.

## Pointer geometry follow-up

[PR 8 run 38535351390](https://github.com/lapismd/lapis-plugins/actions/runs/38535351390)
passed every other lane but recorded 61 passes and one Harness Model Refresh
failure in Storybook shard 2: the persisted runtime remained ACP after the
synthetic Native click. Settings Harness Model Refresh passed.

A cold exact local run also reproduced a closed model submenu (one failure).
Source tracing found no startup default writer, and model discovery already
rejects stale generations. A new pointer-coordinate assertion then fails
deterministically: `userEvent.click` sends x=0 to an option whose left edge is
x=376. The submenu intent corridor hit-tests real coordinates. Both harness
plays now move and click at each rendered control's center, retaining the
coordinate regression assertion. The two exact stories pass on a cold run.
This is a test-infrastructure repair; plugin runtime and versions are unchanged.
All 23 Chat stories and 177 full interaction/accessibility stories pass on fresh
processes (49/62/37/29). Root check/test/build pass 13/13, 13/13 and 12/12;
audit, spec and App ownership, 105 release-tool tests, static Storybook and
twelve npm packs pass. GitHub qualification at the updated head remains the
merge gate.
