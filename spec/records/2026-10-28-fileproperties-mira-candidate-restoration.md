# File Properties repair: Mira candidate restoration

The cold catalog shard 3 reported **65/68** with the three File Properties
persistence/placement stories failing: `Middle (Top Tabs)` never observed
`status: planned` in the vault, `Stale Record And Recovery` recorded
**0/1** text conflicts, and `Concurrent Body Change` never saved
`status: local`. Temporary adapter diagnostics showed every panel commit
refusing with `Properties could not verify the displayed version.` because
`FrontmatterControllerCommit.previousRecord` was absent at runtime.

## Root cause

The failure predates and is independent of the shared panel host's
`vaultChanges.start()/stop()` lifecycle from
[Markdown editor chrome](2026-10-27-markdown-editor-chrome.md). At
2026-10-27 19:54–20:29 UTC the concurrent editor-surface qualification
replaced the ignored local Mira candidate
`.local/mira-candidate/lapismd-mira-0.1.1.tgz` with a build of Mira main
(`082703eb`, SHA-256
`5df6b9065f184a8213ba9d2d7c21be33404231586bea6f6b04c77dda93c4f57f`). That
build carries the CodeMirror stacking-containment contract but not the
displayed-record contract of `cb8f2b2b`, so the landed Properties
edit-protection adapter refused every write. The tracked `.pnpmfile.cjs`
annotation and
[Properties persistence](2026-10-26-properties-persistence.md) still qualify
SHA-256
`03e15e02bf8d4b61f56c096e31e2538a18fecb980e0e99ce6f1a155155dcf0e9`.

## Restoration and evidence

The byte-exact qualified archive was preserved at
`.local/editor-surface/before-mira.tgz` and
`../lapis-notes/.local/validation/phase2-cohort/lapismd+mira-0.1.1.tgz`;
either copy restores the documented SHA-256. After restoration plus
`pnpm install` (lockfile restored to its committed registry-portable bytes;
no tracked dependency change), in the documented environment:

- The three exact stories pass **3/3** (before: **0/3**).
- The complete File Properties family passes **8/8**.
- Cold catalog shard 3 passes **68/68** across repeated, load-stressed and
  cache-purged runs. The first two post-install shard runs also reproduced a
  transient Reading `Middle (Top Tabs)` pointer flake while Vite re-optimized
  the swapped dependency mid-run; it never recurred on a stable cache.
- `mira-frontmatter-contract.test.ts` binds the adapter to the real
  installed Mira runtime: **2/2** passing on the qualified candidate and
  **0/2** on the editor-surface build, naming the missing contract directly.
- Native Editing `Protected Admission And Handoff` failed shard-context runs
  deterministically (**4/4** reproductions, identical under both Mira builds,
  so Mira-independent) at ~1.07s: its `data-ready` boot wait used the default
  one-second `waitFor` budget while the fixture boots a complete App in a
  cold, heap-loaded shard browser. The wait now carries the same explicit
  20-second budget as the shared panel-host boot waits; no assertion changed.
  Its exact eight-file failing prefix passes **38/38** after the fix.
- Full cold four-shard lane: shard 1 **74/76**, shard 2 **105/105**, shard 3
  **68/68**, shard 4 **73/73** — **320/322** with only the two Reading
  Surface isolation failures below.

## Open cross-slice conflict (owner: editor-surface workstream)

The landed Reading Surface scenarios assert
`getComputedStyle(editor.view.dom).isolation === "isolate"`, which only Mira
main `082703eb` supplies, while the landed Properties protection requires
`cb8f2b2b`'s `previousRecord`. No existing archive carries both contracts,
so shard 1 retains exactly **2** deterministic failures under the documented
candidate (`Editing Search Settings` and `Editing Search Settings Dark`,
both `expected 'auto' to be 'isolate'`; reproducible standalone). Closure
requires merging the `properties-edit-boundary-20261026` line into Mira
main, requalifying a new candidate archive through the Mira owner lanes, and
updating the `.pnpmfile.cjs` annotation and both records above. Until then
the documented `03e15e02` candidate remains authoritative and the
editor-surface build stays preserved under `.local/editor-surface/packages/`.
