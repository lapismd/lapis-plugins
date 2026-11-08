# Bases registry captures with sidebars closed

The Bases registry screenshot stories seed the existing shell focus mode so
Explorer starts closed and the Bases view fills the available workspace. This
applies to Filter options, Cover cards, Overview, Grouped list, Kanban and
Activity. Ordinary shell stories retain their existing Explorer layout.

## Regression and acceptance

- Before: `pnpm test:storybook -- stories/plugins/bases/RegistryScreenshots.stories.ts -t '^Kanban$'`
  failed once when the closed-sidebar assertion ran against the previous seed
  (`lapis-plugins-validation-3f6df6ee-ca4b-4be3-8cb8-cc8b72760766`).
- After: the same target passes. The complete Bases family passes all 29
  interaction/accessibility stories, including all six registry stories and
  the ordinary shell stories. Registry plays assert zero left-sidebar width,
  the accessible reopen control and the existing scrolling/content contracts.
- Remote Docker on omarchy (4 CPUs, 12 GiB) passes `ci:release`: audit,
  specifications, App ownership, 193 tooling tests, all 51 package tasks,
  17 npm packs, 17 plugin payload verifications and a cold static Storybook.
- All 28 declared Bases WebPs are regenerated. A separate deterministic media
  check passes all seven items against the newly built Storybook.

Combined receipt: `lapis-plugins-validation-f7c34b64-e24a-4f02-8180-ca5eaa148654`.
The tested source snapshot is `9f52d3f3bfab762a6b24a3d3b38c7558fe46cd47`;
generated images and this receipt are collected afterward.

The local review story visibly renders with Explorer closed. No public API,
plugin version, publication, registry dispatch or Visual Delta baseline changes
are included. Stories retain `visual-pending` for human review.
