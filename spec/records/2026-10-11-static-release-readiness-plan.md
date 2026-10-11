# Static registry release readiness

The requested outcome is a deployed Astro registry whose signed catalog lets the
local Lapis app install and run every active plugin in this repository. Passing
package tests, previewing the site, or publishing npm packages alone does not
establish that outcome. Community remains parked and the relay registry remains
deferred.

## Current evidence

- The Plugins repair is committed as `3e8980a8`: 772 unit tests, 175 interaction
  and accessibility stories, 95 release-tooling tests, 12 npm packs, and 12
  deterministic runtime payloads pass. The recorded audit exceptions remain.
- The source-preview registry has 12 entries and its rendering fixes are
  committed. Preview metadata is unsigned and pending entries are not
  installable release evidence.
- Notes currently boots four default plugins: File Explorer, Source Editor,
  Markdown, and Search. Its existing host lane does not verify all 12 release
  archives. Bases acceptance assumes a bundled plugin despite LN-WEB-011
  requiring installed-plugin persistence; its focused test times out.
- A fresh Notes AI Local Conversations target reproduces one pointer-readiness
  failure. Waiting for menu teardown repairs the target; complete qualification
  is running separately.
- Desktop verification uses an ignored Deno wrapper with
  `--minimum-dependency-age 0` and a separate ignored lockfile, explicitly
  authorized for local verification. Production dependency policy is retained.
- Community's schema candidate still requires full browser qualification and
  safe consolidation of its divergent Jujutsu change. Its shared library is
  needed even while the Community plugin is parked.
- The production V1 endpoint returns signed JSON with 11 entries. The V2 URL
  currently returns HTML with HTTP 200; that response is not a deployed V2
  catalog. Existing framework/first-publication variables are true, but these
  historical flags do not prove that the new schema/API bytes are published.
  The static-release and V2-deployment variables are absent, and the Plugins
  release workflow is manually disabled. Nostr activation is false.

## Ordered work

1. **Repair qualification blockers in their owners.** Finish the Notes AI story
   regression, replace the stale bundled-Bases assumption with a real installed
   plugin, and diagnose Community's restoring/skeleton browser failures at a
   cold target. Run the complete affected browser/accessibility lanes and source
   check/test/build/spec lanes. Do not waive the reproduced Community baseline.
2. **Build a local signed release fixture.** Bind all 12 npm tarballs and runtime
   bundles to one full source commit and their package versions. Use ephemeral
   fixture keys; verify signatures, exact file lists, checksums, reproduction,
   and schema V2 before serving the fixture. Keep production keys and generated
   production metadata separate. Reuse the registry's materialization and
   release-preview tooling rather than inventing another publication format.
3. **Connect the real local hosts.** Use the public App distribution options to
   configure the local catalog and fixture public keys through an explicit
   acceptance/development boundary. Preserve normal signature and compatibility
   checks. Exercise the real Web OPFS asset route and packaged desktop asset
   route, not a mocked plugin loader or copied plugin constructor. Reuse this
   path in Bases acceptance.
4. **Complete the plugin matrix below.** Install from the catalog, inspect detail
   and media, enable, perform the defining behavior, disable/re-enable, restart,
   and uninstall in fresh disposable vaults. Verify installed version, hash,
   source provenance, persisted configuration, and stylesheet cleanup. Prove
   that bundled plugin updates use the installed release where applicable.
   Run a combined all-active-plugin scenario to expose interaction conflicts.
5. **Consolidate and prepare portable source releases.** Commit verified slices
   in Community, Notes, Plugins, and Registry with Jujutsu; preserve inherited
   controller work, `deno.lock`, and unrelated primary-checkout edits. Resolve
   Community divergence deliberately. Select valid new versions where npm
   content already exists, update Changesets/release notes, and rebuild packs
   and archives from the final commits. Correct stale release documentation.
6. **Publish prerequisites, then requalify registry installs.** Present the
   exact Community/schema and Notes API/Workspace publication candidates for
   the release gate. After approval and publication, refresh semver lockfiles
   from npm, remove temporary acceptance redirects, and prove frozen clean
   registry-only Web and Deno consumers. A temporary tarball pass cannot
   replace this gate. Rebuild Plugins against those released framework bytes.
7. **Prepare the concrete plugin and site rollout.** Present selected versions,
   npm and archive checksums, signatures, generated registry diff, and host/UI
   evidence. Confirm OIDC publishers, GitHub App permissions, app-pinned signing
   roots, protected environments, and Cloudflare Pages configuration. Obtain
   approval for production signing/publication and the first V2 cutover; only
   then enable the static workflows, push the verified release changes, publish
   artifacts, review/merge generated registry entries and signatures, and
   deploy Astro. Relay workflows stay disabled.
8. **Verify the deployed result.** Fetch actual signed V2 JSON and details,
   download every indexed archive, verify signature/hash against the app pins,
   and install from the deployed site/catalog in fresh Web and desktop vaults.
   Check CORS, media, direct links, reload, update/uninstall, and absence of
   Community. Confirm download redirects and the aggregate metrics path under
   its separately approved analytics activation.

## Required plugin behavior matrix

| Package       | Runtime ID            | Defining local-app acceptance                                                                                                                               |
| ------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI            | `ai`                  | Open Chat and History, restore a local conversation, complete a deterministic Fake turn; verify host wiring separately where live providers are configured. |
| Bases         | `bases`               | Open a `.base` file, query seeded rows, edit frontmatter, and retain the view/data after restart.                                                           |
| Bookmarks     | `bookmarks`           | Add/open/remove a bookmark and retain it after restart.                                                                                                     |
| Graph         | `lapis-graph`         | Render linked vault notes and follow a node into its document.                                                                                              |
| History       | `history`             | Record a document revision, compare changes, and restore content.                                                                                           |
| Markdown      | `markdown`            | Edit and render a note, follow links, and verify file-scoped panels.                                                                                        |
| Markdown Lint | `lapis-markdown-lint` | Produce a diagnostic, apply its fix, and clear the matching gutter/Problems item.                                                                           |
| Search        | `search`              | Index a seeded note, query it, and open the result; verify worker assets.                                                                                   |
| Slides        | `lapis-slides`        | Open a Markdown presentation, advance slides, and resolve themed runtime assets.                                                                            |
| Source Editor | `lapis-source-editor` | Edit/save JSON or YAML with the installed source view and reopen it.                                                                                        |
| Spellcheck    | `spellcheck`          | Mark a misspelling and verify correction or dictionary acceptance persists.                                                                                 |
| Word Count    | `wordcount`           | Update visible document/selection counts as text changes.                                                                                                   |

The final gate is a 12-of-12 matrix on supported hosts, successful production
catalog installs, and committed/pushed verified sources. Any unsupported-host
result must agree with the signed platform metadata rather than silently skip a
plugin. Package-unit evidence and governed plugin stories supplement this matrix;
they do not substitute for archive installation in the app.
