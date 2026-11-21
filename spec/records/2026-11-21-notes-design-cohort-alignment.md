# Notes and Design cohort registry alignment

Date: 2026-11-21

## Scope

The private workspace development cohort advances to the already published
registry releases `@lapis-notes/api` 0.6.12, `@lapis-notes/ui` 0.2.8,
`@lapis-notes/workspace` 0.4.10 and `@lapismd/design-core` 0.13.7. Public plugin
manifests and their compatible ranges remain unchanged, so this prerequisite
has no package release intent or Changeset.

## Before evidence

The exact candidate without an exceptional receipt failed the focused source
check once with:

```text
Plugins dependency catalog: unrelated first-party metadata changed
```

That failure is intentional. Selected first-party packages now retain their
normalized peer and package metadata in ordinary comparisons instead of being
reduced to an integrity placeholder. First-party snapshot edges are likewise
compared in full after selected-version and peer-context normalization.

## Bounded transition

The one-use receipt binds the complete transition to base revision
`32b1680b478e8094716c94cdc89a4854660bf4d8`, unchanged intake-policy bytes,
exact before/after root manifest, workspace and lockfile bytes, every canonical
chapter digest and the complete changed-path set. A later update cannot replay
the receipt because its base revision, bytes and path set will differ.

Pull-request checks read the immutable event base revision rather than the
candidate's immediate parent. This preserves the complete reviewed transition
through repair commits; non-pull-request checks retain a fail-closed VCS-parent
fallback.

## Verification

The focused receipt and source-reader regressions, dependency-intake suites,
specification checks and repository qualification are recorded by the pull
request checks. Registry publication, plugin package release and coordinator
replay remain separate gates.
