# Sync pairing and recovery layout follow-up

15 October 2026. This review slice aligns the create/cancel invitation action
beside its label, keeps the Invitation URL input at the trailing edge of its
row, shortens the export action to Export recovery bundle, and uses the shared
file-input geometry. The invitation remains below the header; create/cancel
visibility and authority gates remain controlled by the existing source.

Shared Settings changes were implemented in Design Core, merged through PR #23,
versioned through PR #24, then published as 0.3.5. Both PRs passed their required
CI; the release workflow completed package/provenance verification and created
the release. One unchanged File Listing focus assertion failed the first source
CI run; its exact local family and the complete CI retry passed without edits.

Before Sync integration, the exact Settings file reported **3 failed / 13
passed**. After integration it passes **16 / 16**. All **54 Sync stories** and
**198 unit tests** pass; source, private-host, build, publint, specification/App
ownership and audit checks pass. Source header controls also pass responsive
acceptance at a 28rem Settings frame. No visual baselines changed.

The root registry refresh initially activated a pre-existing ignored local hook
and resolved an old API tarball. Its lockfile changes were discarded; the
refresh was repeated with `--ignore-pnpmfile --no-save`, preserving ordinary
npm ranges and the local hook. No hook or loader configuration is committed.
The private package's own dependencies were reinstalled through its normal
registry manifest; its setup command is documented in `dev/sync/README.md`.

The app and Storybook were cold-restarted after the package refresh. Live review
at localhost:6080 confirms the aligned header, trailing input, shorter label and
unclipped file picker. Screenshot: `/tmp/lapis-sync-pairing-recovery-layout.png`.
The two review services and their persisted development data remain available.
The existing connection-slice draft PR is updated; endpoint enrollment remains
the next separate review-gated feature slice.
