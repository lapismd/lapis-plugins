# Target-aware remote service contract

History's optional public `RepositoryServices.remotes` port exposes explicit
backup/original targets, native capabilities, configuration revisions, opaque
credential references, connection testing and native push review/execute/status.
Existing backup-only service ports remain compatible. The shared controller
performs one native command per user action and never retries a failed push.
Disposal fences late delivery; expired GitHub handoff remains disabled.

Before adding the source boundary,
`pnpm --dir packages/history exec vitest run src/lib/repository/controllers/remotes-service.test.ts --passWithNoTests`
selected zero cases. The same target afterward passes six independent cases:
exact target/revision saving without transfer, lost-response observation without
replay, overlapping publication refusal, disposal fencing, stale reads/revision
validation and pending-code handoff.

Node 24.10.0; native validation; browser API port 63431:

- Exact boundary: 6 passed, zero failed.
- Complete History unit suite: 55 Vitest cases and 96 repository cases passed.
- History check: zero errors/warnings; public build/publint pass.
- Root `pnpm check` and `pnpm test`: 18 successful tasks each, zero failures.
- Root `pnpm build`: 17 successful tasks.
- All 68 directly affected History interaction/accessibility cases pass cold.
  Other catalog families are unchanged from the preceding full 392-pass lane.
- `pnpm spec:check`: passes after mapping public contract changes to distribution,
  native ownership and governance chapters. No mapping or validator was weakened.
- `pnpm packages:pack -- --already-built`: passes; History archive SHA-256
  `f8462257a9280eda55e7ccee681c128e6ff5b4972f1de8af0e40d4d13988f05f`.

This is a public source contract and presentation coordinator, not native
transport or host acceptance. Core/Protocol adapters, actual host composition,
portable registry adoption and cold remote/credential qualification remain
outstanding. No real secrets, network transfers or visual baselines were used.
