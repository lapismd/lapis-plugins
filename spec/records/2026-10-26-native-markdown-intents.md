# Native Markdown editing-intent source binding — 2026-10-26

This slice connects the public Mira input lease and existing captured-source
Markdown writer to the App-owned native editing-intent lifecycle. It does not
select either application host or qualify captured-state recovery.

## Source and scope

The isolated `lapis-plugins-native-editor-claims-20261026` workspace starts from
qualified History/source baseline `214917c849e7e9440bd6792d480677c745db6873`.
Only the existing Markdown session/conditional-persistence prerequisites and
native binding/review scenario are carried from the earlier feature branch.
Current registered Markdown embed dispatch and its tests remain intact.
Unrelated Search, Graph, AI, Properties and Outline changes are excluded.

The API prerequisite is committed Notes `d89c0fbe`, with public pack SHA-256
`1d28fa66bff0791987ae70d9a114db064b2b80bbde913c973dc18f23bc5b740b`.
Mira's independent public input lease is committed `c5d1e4b6`; its editor pack
SHA-256 is `e79ba9cd1fbdc3e1e078dbea6c1dac9e49a11e045dcd58fa329401cff2fa8d82`.
All temporary validation dependencies are checksum-checked public archives.
Tracked manifests, lockfiles and Storybook configuration retain their normal
contracts; there are no consumer source aliases or dependency patches.

## Behavior

- The original App, physical destination and acknowledged source text remain
  bound together. Conditional hosts use the public FileTextPersistence owner;
  unbound conditional writes fail rather than using an unconditional fallback.
- Native selection holds raw input synchronously before admission, reports
  changed dirty generations and joins the existing save operation. The registry
  yields a protected saved generation and rearms before editing resumes.
- Independent previews retain independent conditional baselines and existing
  source-owned conflict recovery. Raw input admission never accepts/discards
  document text or introduces a second save callback.
- The review story uses public FileEmbed and a real App/Mira writer. Synthetic
  admission controls use the shared labelled FixtureControls surface. It is a
  component scenario, not native host acceptance or a replacement application.

## Exact evidence and retained failures

The exact source target is:

```sh
pnpm --filter @lapis-notes/markdown exec vitest run src/lib/mira/file-write-binding.test.ts -t 'native intent admission|retained dirty source|retaining native intent'
```

The retained earlier source cohort moves from **0 passed / 3 failed** to
**3 passed / 0 failed**. The minimal current-parent owner run
`27d0841c-130f-41be-ad50-3b88db74f97f` repeats all **3** exact cases, all **20**
adapter/binding cases and **139** Markdown cases, with strict checks, build,
publint and public pack passing.

The exact public browser target is:

```sh
pnpm exec vitest run --project storybook stories/plugins/markdown/panels/NativeEditing.stories.ts
```

- An earlier private worker omitted canonical deferred Sync dependency
  installation and failed before the real preview could run. The worker now
  follows the owning repository's existing isolated Sync install sequence;
  product Storybook configuration is unchanged.
- Cold run `a2415c49-2514-46b0-af07-6defa21e55b8` reaches the real App but
  reports **1 failed** story and **1** unhandled orphan-effect error. The fixture
  had constructed App after an await, outside the Svelte owner.
- Constructing App synchronously inside its existing onMount boot boundary
  repairs the fixture. Cold run `481bc3dd-aa43-43a3-9744-c4509cfd986d` passes
  **1/1**, including real CodeMirror input refusal before admission, saved draft
  handoff, protected mutation and rearm.
- A formatter invocation cannot infer a Svelte parser in this repository;
  TypeScript/Markdown/JSON use its existing formatter. No formatter dependency
  or production tooling policy is changed.

## Complete source checkpoint

Frozen `a93265492a4681ab4058ebf591e1b52883ea9d45`, report
`43f417ac-40ff-46d9-91e3-f44c4c861edb`, passes all **16** strict check tasks,
**1,023 Vitest plus 91 Node package cases** (**1,114** total), all **15**
build/publint tasks, package/registry boundaries, App ownership, the component
composition audit and static Storybook. Its failed aggregate stays failed.

Retained findings and their separate closure are:

- Audit reproduces the existing high Zod advisory and the style audit reports
  the same four CSV utility findings. No dependency, audit ignore, CSV source
  or styling policy changes in this slice. Clean-parent comparison follows.
- The unsharded browser process disconnects at History after **183 passed**
  cases, matching the previously recorded source-cohort lifecycle failure.
  Four explicit cold bounded shards initially give **68**, **93**, **54** and
  **69** passing cases, with a browser-close error at the final two Link Preview
  acceptance stories. Those two exact stories pass cold **2/2** in report
  `f4693333-a1dd-4fdf-886f-44733e6f5781`. The private container had Docker's
  64 MiB default shared memory; the canonical owning runner specifies 2 GiB.
  Aligning that private resource makes the original fourth shard pass **71/71**
  in `677e6ffe-56a6-476f-ae89-845dcad31191`: the complete catalogue is
  **286/286**, with no assertion, interaction or accessibility failure.
- Payload building correctly refuses an undescribed working-copy source; the
  subsequent verifier finds no payload. Private immutable-snapshot qualification
  now supplies the builder's existing exact `--commit` option. This preserves
  its ordinary clean-working-copy guard and publishes nothing.
- Specification validation finds four verification rows placed outside its
  existing table. Moving the rows into that table repairs their discovery;
  the final source chapter mappings are included with the scoped change.

## Payload, baseline and documentary closure

Frozen product `abebc6f0124a94e0440ed4f2e5f773bc38f06841` passes the public
build/pack and **21** focused release/signature cases in report
`0404b5eb-f2f7-44a6-bb49-60c79fc92acb`. Two independent runtime payload builds
verify with identical SHA-256
`2525d637b99c30d7d626135f49b7f12e12db78d6fbc9f7f957ebb2bba682644f`.
The qualified Markdown npm archive has SHA-256
`d8e7bb594bbd7fc5d89629f68b139129a5d6741094f4da4996fb9726549cd0c5`.
These are private validation artifacts; nothing is published or installed.

Clean parent-tree `214917c8` is retained in the empty History workspace at
`c19d8dee`. Report `5b5793ea-4745-478d-ba96-fff2bd75e4dd` reproduces the same
high Zod advisory `GHSA-mrhx-c7xc-m3w5`, the same 1,156 dependency audit graph,
and all four identical CSV utility diagnostics. The package manifest, lockfile,
audit implementation and both affected CSV inputs are byte-identical between
parent and candidate. Those API dependency/CSV styling findings were already
accepted and recorded in the parent History/Search intake; the standing request
to choose the logical backlog-completion answer retains that scoped exception.
No audit ignore, source policy, assertion or baseline is weakened.

Final formatting, complete canonical specification and composition checks run
against the repaired verification table and all required owning chapter mappings
in final report `dfac8d3c-aa8a-4b3c-bab5-48e04a173e9b` before this source
slice is committed. Product bytes stay equal to the frozen
qualified snapshot; final edits only refresh documentary evidence.

## Remaining gates

The source lanes above qualify this package under its explicitly retained
parent findings. Visual baselines remain pending. Both real host selections and native/HTTP
recovery acceptance remain separate; Deno stays frozen and signing,
distribution and default cutover remain deferred.
