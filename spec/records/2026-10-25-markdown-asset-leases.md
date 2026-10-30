# Markdown portable asset URL leases

Desktop's R1.3.8 native application checks find one failed attachment case while
27 other shell/vault/database/Notes cases pass. Ordinary Markdown images are
rendered by Mira's image component, which requests `readAssetUrl`; the app-bound
Markdown adapter currently supplies only the custom `renderEmbed` path. Reading
therefore attempts a relative image URL instead of the admitted vault URL.

The installed Markdown source revision `99806c68` and current `7a3afee2` both
lack the two public asset URL hooks. This is separate from the database engine.
Add only acquisition/revocation through the owning App vault; retain registered
embeds and missing-file behavior. No native-only renderer or consumer override.

The exact source regression is
`pnpm --filter @lapis-notes/markdown exec vitest run src/lib/mira/file-adapter.test.ts -t 'leases vault resource URLs|releases portable asset URL'`.
Before: two failures, five skipped. After and complete qualification are running.

The repository starts with an unrelated modified `pnpm-lock.yaml`. Preserve it
uncommitted. Initial `pnpm audit` reports nine existing findings (one critical,
three high, two moderate, three low); no audit ignore or dependency change is
introduced. Full acceptance and audit disposition remain pending.
