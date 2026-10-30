# Released Mira overlay consumer qualification

Mira source PR 10 and version PR 11 merged after every required check passed.
The approved production workflow publishes `@lapismd/mira@0.0.4` under `latest`
and passes clean installation, integrity, provenance, and GitHub-release
verification. Only the core package changes version.

Markdown and the private shared Storybook host require `~0.0.4`. The committed
consumer lockfile resolves that published package and Bits UI 2.19.5. The unused
2.18.1 patch declaration is retired; the existing, separately approved 2.19.5
Link Preview cleanup patch and resolved-version audit remain intact. No local
provider hook, copied dependency source, or dismissible-layer patch is included.

The original Linux File Properties / Left Sidebar failure is first qualified
against the packed provider (one failure to one pass), with all 177 Linux
interaction/accessibility cases passing (49/62/37/29). After installation from
npm, the cold exact File Properties target passes 1/1 and the entire local
catalog again passes 177/177 with the fatal Svelte warning guard enabled.

Released-provider validation also passes root checks and units (13/13 tasks
each), builds (12/12), specification and App ownership, all 105 release-tool
tests, twelve npm packs, and the static Storybook build. Audit uses the unchanged
recorded advisory policy. Visual baselines remain unchanged.

The archive builder requires an empty Jujutsu working-copy commit, so archive
reproduction and payload verification run from the committed source before its
follow-up is pushed. Clean GitHub CI must then pass all nine required jobs.
Dependency-image refresh records the new frozen-lock hash and immutable image
pin. Plugin version preparation, production publication, and registry dispatch
retain their separate release gates.
