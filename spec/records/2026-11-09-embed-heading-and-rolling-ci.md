# Embedded heading inset and rolling CI image review

The user requested a small start inset before embedded grouped List chevrons,
and one dependency-image review instead of hash-specific PR duplicates.
Plugin publication remains approved but waits for these follow-ups to qualify.

## Embedded heading regression

Exact target: `pnpm test:storybook -- stories/plugins/bases/Embeds.stories.ts
-t Markdown`, on omarchy Docker with 4 CPUs and 12 GiB. Before receipt
`lapis-plugins-validation-f0cff244-7f07-4b8b-aa45-b6a3e17ffda5` failed once:
chevron inset was 0px against the minimum 8px geometry assertion. After adding
0.75rem internal start padding only to embedded group toggles, receipt
`lapis-plugins-validation-0234e053-796f-4d09-a695-63ae26dc88e2` passes the exact
Markdown story (1 passed, 2 other named stories unselected). Separators remain
full width and counts retain their trailing containment. The final story also
checks chevron containment at 360px.

## CI image automation regression

The current remote Lapis Notes workflow and executable regression family are
the reference; its local checkout predates the rolling policy. Lapis Plugins
retains its own image identity, metadata path and workflow. Immutable image tags
and digest pins remain unchanged. The review branch is now
`automation/lapis-plugins-ci`. A successful rolling proposal closes only
`github-actions[bot]` reviews from the same repository matching the strict old
hash-branch pattern. An already-current pin closes obsolete reviews; a failed
proposal preserves them. Manual publication is restricted to main.

Exact command `node --test scripts/dependency-image-pr.test.mjs`: before, 4
passed and 5 failed; after, all 9 passed. The tests exercise the actual workflow
shell with bounded GitHub/Git fixtures, including consecutive lockfile tags,
terminal/open states, legacy cleanup, no-op and failed publication.

## Wider qualification

Full registry-only Docker qualification passes as recorded below. Hosted CI,
the live rolling proposal and duplicate-review cleanup remain pending. No Visual Delta baseline changes
are authorized; stories remain visual-pending.

## Embedded Table sizing

The Markdown Embed used the registry fixture's explicit column widths
(360 + 220 + 280 + 180 + 240 = 1280px). Browser measurement showed a 1269px
viewport and 1280px content width; the component was honouring the configured
widths. The exact Markdown story's new wide-pane fit assertion failed once
(`expected 1280 to be less than or equal to 1167` in its browser viewport).
A private `embed` fixture profile retains the same 40 realistic records and
default automatic column sizing. Registry screenshots keep their deliberate
wide columns. Acceptance verifies wide-pane fit, real horizontal overflow at
360px, and restoration to the wide layout; no table component or user-defined
column-size contract is changed.

The final exact Markdown rerun passes in
`lapis-plugins-validation-a78cbcd2-31f9-4cea-b07d-85430fcfba4f`, including both
wide/narrow Table geometry and heading inset at both widths. The CI image
family (`node --test scripts/ci-images.test.mjs
scripts/dependency-image-pr.test.mjs`) passes all 14 cases. Spec validation,
mdBook and spec-first pass; the mapped native-services chapter explicitly
preserves native release authority while changing CI review metadata only.
The existing doctor wrapper-alias warning remains unchanged.

## Full registry-only result

Receipt `lapis-plugins-validation-735a6286-cdef-4255-835f-2a1b3bbda937`
qualifies `666c1717d4eede6ac22a8649b7d5f0e3fa0b5150` against
`5a54841a08814a8ead6bc6c55adc01cb174e72a6`, with no archive substitutions.
It passes the exact History check and three Embed stories; all 51 package
build/check/test tasks; 199 tooling tests; 17 npm packs; deterministic archive
verification; a cold static Storybook build; and all eight serial browser
shards (277 active cases across 64 files, with the same 57 retained private
Sync skips). All 28 Bases media files are regenerated and seven deterministic
media items verify. There are zero functional, type, interaction, accessibility
or transport failures. The existing audit exception policy is unchanged.

The chevron and Table-fit regression counts are each 1 -> 0. The rolling
automation regression count is 5 -> 0. Local browser review after refresh
measures 1269px for both Table content and viewport and a 12px chevron inset.
Current remote main is still the tested base. Documentation receipts follow
qualification; runtime, tooling, dependencies and stories retain the tested tree.
