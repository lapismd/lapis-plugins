# Lapis Sync incremental delivery plan

Status: stage 0 complete, 15 October 2026. Design Core 0.3.4, Mira 0.0.5
and Notes API 0.1.4 are published and consumed from npm. Qualified Sync sources
are landed in main and superseded temporary workspaces are removed after
recovery preservation. Feature slice 1 now provides real Deno account/vault
connection checks in a persistent private development app; see the
[slice 1 handoff](2026-10-15-sync-slice-1-connection.md). Stop for review before
feature slice 2. See the
[Design Core checkpoint](2026-10-14-sync-stage-0b-design-core-release.md) and
[Mira checkpoint](2026-10-14-sync-stage-0b-mira-release.md).
The [Notes source checkpoint](2026-10-14-sync-stage-0b-notes-source.md) and
version PR #30 are merged with all required checks passing. The
[Notes release checkpoint](2026-10-15-sync-stage-0b-notes-release.md) records
publication and passing clean registry-consumer verification. The caught Catalog
diagnostic is explicitly deferred by the user because it fails no CI tests.
See the [reconciliation record](2026-10-14-sync-stage-0a-reconciliation.md).
The [main landing record](2026-10-15-sync-stage-0c-main-landing.md) records the
source revisions, focused checks, runnable reviews and recovery archives.
Stage 0 precedes all feature slices.
This record replaces the delivery sequence and per-slice test scope in the
[original plan](2026-10-12-lapis-sync-deno-plan.md) and
continuation ledger retained in `lapis-plugins-sync-runtime/spec/records/`.
That historical ledger will transfer with the runtime stack in stage 0C. This record does not authorize subsequent implementation slices or declare
unfinished requirements complete.

The user requested independently verifiable pieces, a functional app after
each piece, short execution sessions, and targeted testing until a working
sync path exists. Those task-specific instructions supersede the earlier
full-suite-per-slice workflow for this work. Repository-wide policy files and
CI/release gates are unchanged. The user's subsequent instruction adds remote
reconciliation and landing first, continued work in the updated main workspaces,
and PRs/releases for shared dependencies before consuming their changes.

## Delivery agreement

- Execute one stage-0 checkpoint or numbered feature slice per approval. Stop with a runnable result and
  wait for manual review before starting the next slice.
- At the start, name the observable outcome, owning packages, exact focused
  checks and work explicitly deferred. Aim for a 30–45 minute work session;
  this is a stopping budget, not a promise that a slice will fit.
- If the slice will exceed that budget or needs a broad prerequisite, stop
  and report the blocker and propose a smaller runnable slice. Do not silently
  expand into editor, navigation, storage or framework redesign. Preserve
  unfinished work separately; it is not an approved or completed slice.
- Every completed slice leaves ordinary editing, saving and navigation usable.
  New functionality is cumulative. Unsupported Sync actions remain disabled
  with a reason; connection health must not imply content is synchronized.
- Use the real development app and Deno process for endpoint behavior.
  Storybook remains useful for UI regression checks, but a fixture is not
  evidence of live sync. Reuse the existing UI and runtime interfaces.
- Commit each focused, verified slice in its owning repository. State the
  checks deferred. Keep private review builds separate from release readiness.
  Complete stage 0 first, then implement subsequent slices directly in the
  updated main workspaces. Do not resume feature development in the temporary
  Sync workspaces or create replacements for them.
- No automatic continuation, background implementation or full-suite run at
  a review stop. This plan creates no scheduled work.

## Starting point and reuse

The Sync UI, signed/encrypted Nostr codecs, object graphs, local checkpoint and
outbox engine, ancestry logic, host key/storage primitives and guarded apply
kernels already exist. Production runtime wiring, Deno services and the
continuous server participant remain incomplete. Qualified primitives do not
yet constitute a working app-to-Deno sync path.

Reuse the legacy coordinator's transport boundaries, codecs, pairing,
reconciliation and autosave behavior where they fit. Reuse the new durable
primitives where integration is smaller. Do not build a second engine or
provider framework merely to start the Deno path. Choose the smallest adapter
against public contracts, and record that choice in its slice handoff.

The following table records the historical temporary inputs at plan creation.
Their named Jujutsu changes and ignored evidence are preserved under the stage
0C recovery record; the three superseded directories are now removed.

| Workspace                    | Recorded qualified parent | Pending state at plan creation                                   |
| ---------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `lapis-plugins-sync-runtime` | `c924ba0b`                | Clean before this planning change                                |
| `lapis-notes-sync-runtime`   | `5f672a5a`                | Five uncommitted navigation/spec files; unqualified as a whole   |
| `mira-sync-runtime`          | `4cddcaf3`                | Last recorded portable editing-session slice; recheck before use |

The unfinished navigation change remains parked at
`local/sync-navigation-pending-20261014` and in the recovery archive. It is not
qualified or included in main. Unrelated main/release work and ordinary
development data remain preserved.

## Stage 0: reconcile remotes, release dependencies and land into main

This is the first part of execution, before Deno connection work. It has three
reviewable checkpoints. Apply the same stopping budget to each; a release
pipeline or conflict-resolution effort must not become a hidden long run.

### 0A. Fetch and reconcile the participating repositories

Completed in the [reconciliation record](2026-10-14-sync-stage-0a-reconciliation.md).
The historical source inputs remain recoverable; stage 0C now completes their
qualified landing into current main workspaces.

1. Read each owning tracked guide. Inventory the main and temporary workspaces
   for `lapis-plugins`, `lapis-notes`, `mira-mde` and any other shared source
   required by the Sync stack, including `design-core` if affected. Identify
   local-only commits, uncommitted work, tracking branches and remote names.
2. Use Jujutsu to fetch the relevant remotes in every participating repository.
   Compare against the freshly fetched remote main; do not assume the local
   bookmark is current. Record which repositories have remote changes.
3. Integrate remote updates into each main line while preserving local work.
   Resolve divergence and conflicts in the owning repository before landing
   temporary changes. Do not force-push, discard unrelated work or conceal
   unresolved conflicts in a commit.
4. Record the reconciled base revisions and the exact temporary changes to
   transfer. Preserve unqualified work separately with a recoverable reference.

**Review:** a per-repository report of fetched remote changes, reconciled main
revisions, conflicts/resolutions and retained pending work. The current main
app must still launch, open a note and save it. Run focused regressions for
conflict resolutions that change behavior; no Sync feature work in this step.

### 0B. Release required shared-package changes

Design Core is complete in the
[0.3.3 release record](2026-10-14-sync-stage-0b-design-core-release.md).
Mira's editing-session capability is complete in the
[0.0.5 release record](2026-10-14-sync-stage-0b-mira-release.md).
Notes API 0.1.4 publication and registry verification are complete in the
[release record](2026-10-15-sync-stage-0b-notes-release.md). Stage 0B is complete;
consumer refresh and temporary Sync-stack landing belong to stage 0C.

The Notes source candidate and bounded CI follow-up are recorded in the
[source checkpoint](2026-10-14-sync-stage-0b-notes-source.md). Keep its source
qualification, version PR and actual npm publication visibly distinct. Hosted
codec and native checks now pass; source PR #28 and version PR #30 are merged.
The user accepted deferring the caught diagnostic after confirming that all
12 required checks and 249 Catalog cases pass. Its unmerged prototype remains
parked separately and is excluded from the release.

For a required change in `design-core`, `mira-mde`, or another independently
consumed shared package, prepare a focused upstream PR against its updated
main. This includes existing temporary Mira work if Sync will depend on it,
and published host API changes required across repository boundaries.

Run that repository's required PR/release checks, resolve review or CI issues,
land the PR through its normal workflow and create the appropriate release.
Verify the actual package versions and artifacts are available in the registry;
a local build, Git tag or draft release alone does not satisfy this checkpoint.
Attach each created PR to this chat and record its URL, source revision,
released version and validation evidence.

Upstream edits needed to prepare the PR/release happen first. Dependent local
app/plugin integration waits until the release is available. Do not continue
against source aliases, package patches, linked packages, local tarballs or
ignored dependency overrides. Use normal npm semver dependencies and update
only the ranges/lockfile entries needed to consume the required release. If a
compatible release already supplies the capability, consume it without making
an unnecessary new PR or release. Process dependencies in dependency order.

The user's instruction authorizes this required shared-dependency PR/release
workflow. It does not request publication of the unfinished Sync plugin,
unrelated upgrades or deployment. If credentials, external review or CI block
the release, report that concrete blocker and stop dependent integration.
The targeted-testing agreement for feature slices does not waive checks
required to publish a shared package.

**Review:** the PR/release links and registry versions actually used, plus the
focused consumer check against those released packages. Allow separate review
stops per shared repository; do not bundle several releases into one long run.

### 0C. Rebase, land and switch to main

Completed in the [main landing record](2026-10-15-sync-stage-0c-main-landing.md).
Main uses the released prerequisites, the Sync source/UI checks and cold
application save/reload check pass, and the three superseded workspaces are
removed after recovery preservation. Commits stay local for this review;
complete CI and feature slice 1 remain deferred.

Recheck remotes before landing, since 0B may have advanced them. Rebase the
temporary Sync changes onto the updated owning main lines using Jujutsu, resolve
conflicts and run the affected checks before transferring them into the main
workspaces. Reconcile already-landed or superseded changes rather than duplicate
them. Keep unfinished navigation or other unqualified work explicitly pending
unless it has now passed its focused verification.

Refresh consumers from the released shared dependencies, then build only the
outputs needed to launch the app. From the actual main workspace, verify cold
startup, note opening/editing/saving, and the existing Sync UI's honest current
state. Do not claim the landing enables sync or bypass the existing apply guards.
Record main revisions, resolved conflicts, dependency versions and exact launch
instructions. Preserve unrelated main changes rather than folding them into
Sync commits; stop if overlapping work prevents a safe landing.

Once transferred work and any parked changes have recoverable references and
the main app passes review, forget/remove the superseded temporary workspaces.
Preserve needed ignored evidence and development data before cleanup. All
subsequent feature development, validation and demos run from the updated main
workspaces. A future required shared-package change repeats 0B before dependent
work proceeds; it must not reintroduce a local unpublished dependency path.

**Exit:** no unresolved landing conflicts; required shared changes are released
and consumed from npm; main contains the agreed work and runs normally; every
excluded change is accounted for. Stop for review before feature slice 1.

## Invariants from the first applicable slice

- Mandatory E2EE, existing Nostr events, IDs, signatures, envelopes, encrypted
  objects and filter semantics. No plaintext fallback or protocol redesign.
- Deno provides the destination locally; no external relay or Blossom service.
  S3 and other providers stay deferred.
- Each endpoint keeps its own device identity and protected keys, with the
  existing shared vault Sync Identity. Account credentials do not grant
  decryption. Deno must be explicitly enrolled before validating/decrypting
  content; its authorized working vault may contain plaintext.
- Publish encrypted objects and revision before HEAD. Staged, accepted and
  applied are different states. Reject bad authority, ciphertext and scope
  before accepting content or changing working files.
- Incoming writes require the existing durable intent, identity/generation
  guards and exclusive writer admission, including exclusion of legacy Sync.
  An unproven host stays preview-only. Closing a tab alone is not proof that
  all editor, domain and external writers are protected.
- Existing runtime requirements remain outstanding until evidenced. Narrow
  demonstrations may explicitly limit supported operations; they cannot bypass
  safety gates or silently count as complete production integration.
- Retain Apache-2.0 and source attribution, public package boundaries, UI
  layouts and registry stories. Dependency changes are limited to consuming
  required shared releases through stage 0B; no general upgrade sweep. Keep
  Sync release activation/publication and visual-baseline changes separate.

## Runnable slices

Feature slice 1 is complete for private review; slices 2–14 remain pending. Each row has its own review stop and
runs from main. The first seven build the manual round trip; later rows fill
specific gaps without replacing it.

| Slice                                     | Working result                                                                                                                                                        | Manual acceptance                                                                                                                                                                       | Focused automated evidence                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Real Deno connection                   | The installed private development plugin tests its configured Deno URL and managed vault using real account authorization. Ordinary app use continues.                | Open Settings, connect, see the actual destination; stop Deno and retry to see offline; restart it and reconnect. Reload the app and retain configuration.                              | Connection adapter success/denied/offline cases; the changed Settings action; one cold app/Deno smoke.                                                                                                  |
| 2. Real endpoint enrollment               | The desktop and Deno use the existing enrollment protocol and protected custody. Deno is an authorized endpoint with its own device key.                              | Enroll Deno, compare device identities, restart/unlock and retain membership. An authenticated but unenrolled endpoint cannot access content.                                           | The actual enrollment/custody path, restart and wrong/expired invitation rejection. No test keys or raw secret entry in production UI.                                                                  |
| 3. Local checkpoint and history           | Checkpoint records a real saved note using the encrypted durable engine and displays real History/Compare data. Upload remains unavailable until slice 4.             | Edit/save a note, checkpoint, inspect its diff, restart offline and reopen that revision. Ordinary editing continues afterward.                                                         | Real snapshot-to-presentation integration, one restart/readback case and locked-key rejection. Prove pending editor text is saved through the supported host boundary or checkpoint is visibly blocked. |
| 4. Manual upload to Deno                  | Sync sends that checkpoint through the Deno object/event adapter. Durable server validation accepts the revision and HEAD. Server working-file apply remains pending. | Click Sync; inspect accepted server history, restart Deno and retrieve the same IDs. Retry the upload without creating another revision.                                                | Real process round trip with object/revision/HEAD ordering, missing dependency, unauthorized scope, stable retry and known-plaintext inspection. Reuse existing crypto/filter tests.                    |
| 5. Download and compare                   | A second enrolled client retrieves authentic history and objects from Deno into its encrypted local repository and displays them without modifying working files.     | Pair client B through the same Deno enrollment flow, fetch client A's revision, open History/Compare and verify B's working files are untouched.                                        | Live filtered discovery/ingestion, one stable paging boundary, tampered object rejection and real UI selection. Client B must use separate local storage, not A's cached history.                       |
| 6. Apply on the server                    | An explicit sync operation applies an accepted revision to Deno's managed working vault through the guarded journal.                                                  | Send a saved note from A; read it through the existing server/Web vault UI. Modify the target after planning and verify the operation refuses stale overwrite.                          | Real server guarded create/update, durable receipt and stale-generation rejection. Prove writer exclusion for the supported managed vault before enabling apply.                                        |
| 7. Manual return path                     | A server edit becomes an encrypted server-authored revision; the desktop manually fetches and safely applies it. This is the first manual bidirectional milestone.    | Change the note through the server/Web app, explicitly checkpoint/sync it, then Sync on A and see the change. Repeat A → Deno → A and verify imported changes do not echo as new edits. | Server capture/sign/publish and desktop guarded apply in one real round trip; dirty-writer rejection, exclusive old/new Sync ownership and one interrupted-apply recovery case.                         |
| 8. Offline queue and retry                | The manual loop retains pending work across disconnect, app restart and server restart, then retries without duplicate history.                                       | Disconnect Deno, make/checkpoint two edits, restart the app, reconnect and Sync. Both checkpoints survive and the accepted tip converges.                                               | A dropped response and persisted-outbox reopen through the real provider. Exercise the existing durability implementation rather than replace it.                                                       |
| 9. Automatic normal sync                  | Existing autosave policy captures supported app edits; a durable catch-up feed triggers reconciliation. Manual Sync remains available.                                | Edit A, wait for Deno/B; edit through server Web and see A update without pressing Sync. Disconnect/reconnect and receive a missed edit.                                                | Single-flight scheduling, one reconnect/catch-up gap and disable/unload cancellation. One live two-client smoke.                                                                                        |
| 10. External server edits                 | The server participant captures files changed outside Web/API with no browser open, including startup/periodic rescan.                                                | Close browsers, edit a managed file externally, then see it arrive on A. Restart Deno after a missed watcher event and recover the change.                                              | One real external change, missed-event rescan and origin-suppression regression. Guard external-write races before apply.                                                                               |
| 11. Conflict resolution                   | Divergent histories open the retained Merge UI; resolving them publishes a forward merge revision.                                                                    | Edit the same note independently on A and Deno, inspect both versions, resolve and verify convergence.                                                                                  | One real text conflict, nonconflicting merge and stale-draft rejection; focused merge interaction/axe. Unhandled binary/delete/rename cases remain blocked and reviewable.                              |
| 12. History restore                       | File History restores a selected version as pending local work and then a new encrypted revision.                                                                     | Restore an earlier note version, inspect the local diff, sync and verify it arrives at Deno/B without losing intervening history.                                                       | Restore-to-checkpoint integration and stale-target rejection; the changed History/Compare interaction.                                                                                                  |
| 13. Remaining operation and recovery gaps | Close each remaining writer, rename/delete/binary, key recovery/rotation or conflict-case gap individually using the manual loop already working.                     | Choose one outstanding acceptance scenario, demonstrate it, restart if relevant and verify existing sync still works.                                                                   | Only that case and its direct integration regression. This row is a backlog: split it into named, independently approved slices before executing any work.                                              |
| 14. Broader qualification                 | After the working milestones are approved, run the deferred acceptance matrix from main and assess release readiness.                                                 | Repeat the agreed desktop/server-Web/two-device journey from the main workspace. Review remaining limitations before release consideration.                                             | Full relevant checks, browser/catalog, security/fault, platform and package/archive lanes from the original plan. Schedule this separately; do not append it to an ordinary slice.                      |

Slices 1–5 are useful reviewable development states without incoming working-file
writes. Slice 4 proves encrypted storage on Deno, not a synchronized server
working vault. Slice 6 proves local-to-server working-file synchronization.
Slice 7 proves manual bidirectional synchronization. Slice 9 adds normal
automatic operation. These are distinct milestones, not interchangeable claims.

## Boundaries for the first manual milestone

Start with one explicitly configured vault, one Deno process and saved Markdown
notes. Introduce a second desktop profile at slice 5. Reuse the same note and
revision chain for review so progress is visible across slices.

The runtime must detect unsupported operations and divergence and retain them
for review. Until their slices are complete, do not infer deletion, choose a
timestamp winner, overwrite an active draft or claim every file is synced.
The status icon becomes green only when the supported scope is fully caught
up; an upload-only or preview-only stage must say what remains pending.

For slices 6–7, inspect the actual host prerequisites at the start. Enable apply
only where all relevant writers, lifecycle boundaries and legacy Sync ownership
are guarded. Reuse proven host capabilities; if an integration gap needs a
separate fix, propose it as a bounded runnable slice and stop. Do not turn
manual sync on by bypassing the production guard requirement. Broader writer
support can follow, but unsupported hosts/operations stay visibly blocked.

Existing native/headless recovery tests are reusable evidence. Add only the
integration case needed to prove the newly exposed path. Do not rerun all
previous foundation qualification after every UI or provider adapter change.

## Targeted verification policy for this task

Each implementation slice records:

1. Its exact failing or missing behavior before editing. Add a focused test
   where it protects substantive behavior; record before/after results.
2. The regression and directly affected tests. Select named tests/files and
   changed story plays, not the whole catalog. For changed UI, include the
   relevant interaction/accessibility check.
3. The affected package type/check and build needed to run the result. Shared
   dependency changes follow stage 0B first; consumer validation uses released
   registry packages with the minimum required manifest/lockfile updates.
4. Relevant specification/ownership checks when their boundaries change, and
   the repository's lightweight dependency audit without expanding into an
   unrelated upgrade effort. Report findings; do not add ignore exceptions.
5. One manual end-to-end check of the slice's claim through the real app. Use
   a cold app/server start when runtime wiring, imports or lifecycle changed.

For this planning-only change, use formatting, document/spec validation and the
dependency audit. No product test, build or Storybook run is needed.

Defer full repository/consumer suites, all placement stories, static Docs,
registry screenshot capture, platform matrices, exhaustive fault injection,
publint/pack/archive reproduction and signing/release checks to slice 14 unless
one is necessary to reproduce the current slice's failure or is a required
shared-package PR/release gate under stage 0B. Do not weaken
assertions, hide failures or represent deferred checks as passing. If a
focused failure is outside the agreed slice, record it and stop for a scope
decision instead of beginning unrelated repairs.

## Handoff after every slice

Keep the handoff short and concrete:

- **Working now:** the newly usable behavior and its limitations.
- **Review here:** exact checkout, app/server start commands or running URLs,
  vault/profile and numbered actions with expected results. Leave the demo
  available where practical; provide a reproducible launch path otherwise.
- **Evidence:** focused commands/results and owning commit IDs; separate
  real-process, unit and fixture evidence. Include any still-pending checks.
- **Next slice:** one proposed outcome. Wait for the user's review and request
  to continue before implementation.

The immediate next execution, after review, is **finish the focused Notes source
qualification gates**, then its version/publication checkpoint. Stage 0A and the Design Core/Mira release checkpoints are
complete. Feature
slice 1, real Deno connection in the existing app UI, starts from main only
after the remaining stage-0 checkpoints are complete and reviewed.

Broader qualification may be scheduled after the first approved manual round
trip; it need not wait for every follow-on feature. Choose its scope explicitly
at that review, then keep subsequent feature slices focused.
