# Dependency lifecycle patches

The tracked pnpm patches in this directory are temporary runtime corrections
for every Bits UI version resolved by this workspace.

- Link Preview cancels its deferred selection probe when its root closes or is
  destroyed. This follows the lifecycle fix described by upstream issue
  `huntabyte/bits-ui#2103`.
- Scroll Area replaces its uncancellable resize debounce with a cancellable
  timer that is cleared when the shared scrollbar state is destroyed.

Both callbacks otherwise read Svelte derived state after the owning effect has
been destroyed and emit `derived_inert`. Keep the patches and their release
test in sync with `pnpm-lock.yaml`. Remove them only after every resolved Bits
UI version contains equivalent upstream teardown behavior and the focused and
full Storybook interaction suites pass without the patches.
