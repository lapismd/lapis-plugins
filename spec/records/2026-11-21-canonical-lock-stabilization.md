# Canonical dependency-lock stabilization

Dependency Automation recovery run
[`44842401697`](https://github.com/lapismd/dependency-automation/actions/runs/44842401697)
correctly refused to combine the current first-party framework cohort with
unrelated direct lock resolutions. The exact Renovate lock command succeeded,
but its canonical post-upgrade guard reported `unrelated direct importer or
workspace lock setting` before it could create a pull request.

The rejected candidate advanced `@codemirror/lint` from 6.9.7 to 6.9.8 across
the Mira peer contexts and React/React DOM from 19.2.8 to 19.3.1 across the
Storybook and EmbedPDF peer contexts. Those packages already satisfied the
source-owned semver declarations, but they were not members of the admitted
first-party operation. Keeping the failure closed prevented an apparently
framework-only pull request from concealing those independently reviewable
changes.

This prerequisite commits that registry-only lock stabilization separately.
It does not change a manifest range, public plugin contract, package version,
release intent, audit exception, visual baseline, or publication state. A
frozen pnpm 10.34.5 install and the repository-owned canonical intake check
accept the resulting portable graph. The current first-party update can
therefore generate its own canonical receipts and Changesets without unrelated
direct-importer drift.

Qualification covers the frozen install, dependency-intake guard, audit,
specification, source checks, tests, builds, package/archive verification and
the functional Storybook interaction/accessibility lanes. Visual comparison
remains separately deferred.
