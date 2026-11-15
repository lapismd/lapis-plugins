# Passive native backup synchronization presentation

This slice extends the existing native remotes composition with an optional
native synchronization port. It reuses the production sync card, complete
conflict inspector and retained App-owned full shell. Native Core owns the
scheduler, merge/application semantics, custody and publication. These memory
stories and observer cases cannot qualify native transport or cold host intake.

The source baseline is one failed missing-observer assertion in
`pnpm --dir packages/history exec vitest run src/lib/repository/components/repository-remotes.test.ts -t 'observes native synchronization'`.
After implementation that case passes. The complete two-file observer/owner
family passes eight cases, including stale passive reads, lost-response exact
recovery, failure to observe recovery, late disposal and no scheduled transfers.

The first eight UI cases fail because the new helper assumes the existing Card
title has a heading role. It is a title element; correcting the query to its
exact visible text retains the actual production component and eight cases pass.
An additional rejected-selection story then reproduces one failure and one
unhandled error: the callback propagated the native selection failure without a
toast. The owning native settings callback now reports it and passively refreshes
status. The exact case passes without unhandled errors; both native composition
families pass all 16 interaction/accessibility cases.

New state inventory: manual opt-in with no renderer transfer, native fetching,
applying, publishing, retained binary conflict inspection/resolution, exact apply
recovery, lost-response observation, narrow dark recovery and rejected selection.
Every scenario uses the production plugin/shell/settings/inspector and declared
memory services. No description banner, replacement shell, source alias, native
transfer or credential write is introduced. Visual tags remain pending and no
baselines change.

Package checks pass. History units pass 71 Vitest cases plus 97 repository cases.
Root check passes 18 tasks, root units pass 18 tasks and root build passes 17
tasks. The first root check reports one missing classification for the new family;
adding its application inventory entry clears that existing audit. The audit
retains the existing two documented low-severity ignores and adds no exception.
The full fresh-process catalog passes 466 cases across 78 files in eight serial
shards. The static catalog builds successfully. Release-tool tests pass 231 cases;
all 17 npm packages pack and retain registry dependency metadata and expected
public exports. History archive reproduction and payload/hash verification pass
from source snapshot `e1b026a22d12177ee6e777c3f2c32175c3ee7fb7` (payload SHA-256
`0e2a9f0bf40a5801e760592acd5791d203892e9d535a8845d0eca4ae54239db6`).
The first archive command correctly refuses an uncommitted implicit source;
providing the exact snapshot allows local qualification. A verification command
initially names a nonexistent output directory; rerunning against the generated
`history-0.4.0` directory passes. Production signing remains CI-owned; the 231
release-tool cases include signature/tamper validation. Spec and App-ownership
checks pass. Released registry intake and cold host acceptance remain independent
gates.
