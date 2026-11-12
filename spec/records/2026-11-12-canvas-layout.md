# Canvas selection-layout qualification

LN-CANVAS-042 and LN-CANVAS-016 implement thirteen layout commands: six alignment
choices, equal horizontal/vertical gaps, row/column/grid arrangement and equal
width/height. The original exact browser target was:

    pnpm exec vitest run --project storybook stories/plugins/canvas/Layout.stories.ts

It failed once before production changes because the selection toolbar had no
Arrange control. The repaired target passes persistent left alignment, a single
undo/redo, row arrangement and retention of imported dimensions, identities,
connectors, document metadata and node/edge extension fields.

The seventeen pure tests cover every command, selection bounds, outside spacing
anchors, real imported dimensions and selected-group roots. A selected group
moves contained descendants once, including explicitly selected children;
equal-size commands change only their requested dimension. Unselected cards
outside a selected group remain untouched. Commands flush pending editors,
start one geometry history gesture and pass through the existing protected
board apply contract. Busy commands cannot coalesce through a second activation.

The native details menu supports focusable buttons and Escape dismissal. The
first Escape check dispatched from the previously focused board and assumed
closed details removed their contents. The corrected check focuses a menu
button, proves the details closes, checks the button becomes invisible and
verifies focus returns to its summary. No product assertion or warning was
suppressed. Its owned DOM listener avoids Svelte's non-interactive-details
handler warning and is disposed with the menu.

The independent layout candidate exposed the existing Canvas nested-button
defect in the new story (one axe failure). LN-CANVAS-043 moves the Canvas-owned
edit button outside rendered Markdown, preserves pointer editing and provides
a visible keyboard focus ring. This prerequisite is included in layout so the
slice can qualify against released Mira 0.1.4 while the separate theme slice
awaits the approved upstream release. No accessibility exclusions are added.
Native packaged acceptance also caught the hover edit button intercepting the
center of an unselected imported small card. Pointer edit chrome now appears
only on a selected card; keyboard focus continues to reveal the edit action.

Source checks report zero errors/warnings; the independent Canvas unit suite passes
107 cases. Root check, unit and build lanes pass 18/18, 18/18 and 17/17 tasks;
release tooling passes all 199 tests and all 17 npm packs pass. Specification and
App-ownership gates pass. Initial fixture typing errors and the details warning
were corrected before these receipts. An obsolete cold run of the warning-bearing
snapshot was explicitly stopped. The independent cold catalog passes 65 files,
301 tests and 57 existing skips with zero failures (run
2d9c70ca-de53-46c5-acdb-fc3b6444c49a). The selected-only hover correction also
passes the combined group candidate's full catalog: 65 files, 302 passes,
57 existing skips and zero failures (run b1ad1110-613d-472e-a696-5065387c0b70).
Six packaged Web cases, including actual layout persistence and undo/redo,
pass on that combined candidate. The separate SVG group case exposed an
API-owned MIME defect and is tracked in the group and API qualification records.

The combined layout/theme candidate passed the full catalog with 306 passes,
57 existing skips and zero failures (run e51c434f-8074-4104-9e9f-9cc7b9a58a21).
The independent candidate uses registry dependencies. The preceding
theme/Mira source candidate passed twice with
65 files, 305 passes, 57 existing skips and zero failures. Its dependency was
qualified through isolated archives; Mira 0.1.5 registry publication and source
consumer intake remain gated by the separately requested release approval.
No source dependency protocol, visual baseline or public release asset changed.
