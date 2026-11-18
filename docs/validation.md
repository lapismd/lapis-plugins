# Local validation

`pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:storybook` and the other
portable lanes in `scripts/validation/lanes.json` default to Docker. The
`spec:*` package aliases call the installed `spec-validator` binary. A missing
image is built automatically. Docker errors fail the command; they never rerun
on macOS.
This includes the separate deferred `pnpm test:release:nostr` tooling suite;
running its tests does not enable Nostr publication.
Hosted CI explicitly selects its already-provisioned native environment.
Platform-native packaging, live-provider acceptance and visual baseline approval
remain independent lanes.

The portable image and registered worker lanes do not require Deno. Image
admission rejects an unexpected Deno executable; the finished-image smoke also
checks its absence before launching Chromium and WebKit. Node, pnpm, Jujutsu,
Git and mdBook remain mandatory version probes, with failed probes blocking. The
separately invoked private Sync native-account review keeps its external Deno
prerequisite and is not part of these portable Docker lanes.

## Images and execution

```sh
pnpm validation:doctor
pnpm validation:images
pnpm validation:smoke
pnpm validation:check
pnpm check:storybook-parity
pnpm test:storybook -- stories/plugins/history/panels/History.stories.ts
```

Images are fingerprinted by the pinned Docker recipe, tool installer, package
manifest, lockfile, workspace configuration and daemon architecture. Use
`pnpm validation:images -- --rebuild` to rebuild explicitly.

Each run transfers the exact tracked Jujutsu working-copy revision and ancestry,
including from an isolated workspace. Secrets, ignored local configuration and
host node_modules are not transferred. Frozen registry installs and persistent
pnpm/Turbo volumes are keyed by dependency and tool identities. Browser suites
run bounded sequential shards; explicit file, test and shard arguments stay
literal. Runs use bounded CPU, memory and shared-memory limits. No host source
bind mount or Docker socket is exposed inside a worker.

## Move the test load to another machine

Local Docker still consumes this Mac's resources. To run on another machine,
create a Docker context for its daemon and save ignored
`.local/validation/config.json`:

```json
{
  "context": "my-linux-host",
  "transport": "ssh-cli",
  "cpus": 4,
  "memoryGiB": 12,
  "shmGiB": 2
}
```

Omit `transport` for ordinary Docker context transport; `ssh-cli` streams source,
build context and reports through the SSH endpoint configured in that context.
No local path needs to exist on the remote host. Explicit environment overrides
are `LAPIS_PLUGINS_VALIDATION_CONTEXT` and
`LAPIS_PLUGINS_VALIDATION_RUNTIME`. For an intentional host run:

```sh
LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm check
```

`LAPIS_PLUGINS_VALIDATION_ARCHIVES` may name an ignored JSON array of
`{name, version, path, sha256}` package archives for documented temporary
consumer qualification. Registry-only installation is the default. Archive
identity and checksum are verified; tracked manifests and locks stay portable.

## Reports and cleanup

Reports are copied to `.local/validation/runs/<run>/`, including the exact source,
image/tool identities, invocation outcomes and available test/build reports.
Npm pack outputs persist in the run’s `.release_npm/` directory, including the
manifest and archive checksums. Docker builds qualify Linux outputs; use the
explicit native override when building macOS application artifacts.
Failures retain their container for inspection. Use `pnpm validation -- collect
<run>` to retry report collection, `pnpm validation -- stop <run>` to stop an
owned run, and `pnpm validation -- clean` to preview cleanup. `clean --apply`
removes stopped owned runs after collection; add `--caches` only to explicitly
remove unused owned cache volumes. No global Docker prune is used.

## Story composition

`stories/catalog/story-parity.json` is the explicit inventory under LP-SPEC-054.
Application stories must reach public `WorkspaceShell` through the actual
selected render path, including imported factories and literal props. An unused
shell import cannot qualify a replacement. Duplicate roots, replacement
children, production-style overrides, unresolved alternate branches and
unisolated synthetic controls fail checks. Mixed families use named story
overrides; missing, removed or stale entries fail closed.

Focused component stories name the real public subject. Imperative registry
integration fixtures declare a governing requirement and specific purpose;
they do not claim application-shell parity. Prototypes follow that same explicit
exception policy. Updating a declaration requires review of the rendered path,
not just its title or metadata component.

`FixtureControls.svelte` provides padded dotted-border setup controls. Overlay
placement keeps synthetic actions outside production shell geometry; focused
component and manual attachment fixtures may use inline placement. Functional,
axe and visual approval remain separate. This change does not update PNGs.
