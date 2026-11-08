# Bases view settings layout

Edit current view uses a fixed 36rem height, bounded by the available popover
viewport. The back/actions header remains outside the named Shadcn Scroll Area;
only the settings fields scroll. The view name, layout, Kanban grouping and
registered custom options use one field stack, with 0.5rem label/control gaps
and 1rem between rows. Shorter viewports reduce the popover height.

Property mappings retain the Bases font family and normal tracking. Property
IDs render as secondary metadata, rather than Command keyboard shortcuts.
The leading check represents the saved mapping independently of search focus.

## Focused regression

Exact command:
`node .local/kanban-validation/run.mjs test:storybook stories/plugins/bases/kanban/BasesKanban.stories.ts -t Notes`.

- Initial regression: one failed, with no named settings scroll region; receipt
  `lapis-plugins-validation-190b375e-b24a-4777-9977-0524493108ec`.
- The first field composition retained an obsolete part marker and lost its
  field layout; one spacing assertion failed. Retaining the Field identity
  repaired the layout. The next test mistakenly requested the Activity-only
  date control in Notes; it now checks the final badge-colour control instead.
- The bounded scrolling and spacing regression passes, receipt
  `lapis-plugins-validation-0eeda55e-5fac-4b37-9291-1a84078fe00c`.
- The typography regression then reproduced one failure: property ID tracking
  was 1.2px rather than the row's normal tracking; receipt
  `lapis-plugins-validation-e2ed29c5-465a-44ed-a4b0-7c33de1e4014`.

Final exact Notes acceptance passes with zero failures, receipt
`lapis-plugins-validation-feba835a-3fc4-4283-94ce-2789440e0b90`.
The full directly affected Bases family passes all 25 cases across seven files,
including schema/custom options, view management, file and embed surfaces,
Kanban and Activity; receipt
`lapis-plugins-validation-b36acc0f-5fe9-4f7a-8378-eb4d15d76037`.
These runs use registry dependencies only, with empty archive inventories.
The specification check passes all three lanes. The full registry-only `ci:release` lane passes all 51 package tasks,
183 release-tool tests, audits, ownership/specification gates, 17 npm packs,
17 verified plugin payloads and the static Storybook build. Receipt:
`lapis-plugins-validation-84940c50-202f-4162-9133-c269abdf00af`, source
`99f822bf9d9573342d5edfae8a67030049d65cd3`, with an empty archive inventory.
The final complete registry-only interaction/accessibility lane passes all eight
shards: 271 passed cases, zero failures and the same 57 existing skips across
64 files. Receipt: `lapis-plugins-validation-24b8a47c-ab84-4e8d-b0d9-063d24ebd5fe`, source
`d015e241c289190dee4c08445678d7582ca5e1fe`, with an empty archive inventory.
Storybook 6006 was cold-restarted and the Activity preview loaded successfully;
manual review confirms normal picker typography and internal settings scrolling
with a stationary header. Visual review remains pending.
No visual baselines or existing skip policies are changed.
