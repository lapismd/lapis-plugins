# Saved Lapis Sync Rust/Tauri plan

The user requested a full-context future plan in the Plugins and Desktop
specifications, retaining the original enrolled, readable Lapis Server scope.
They selected a Plugins-owned Rust engine with shared TypeScript parity
fixtures. This receipt covers documentation only; feature implementation,
test-unskipping, activation and release remain deferred.

## Inputs and preservation

Plugins started clean at `d927d877` (parent `a76d286a`); the existing conflicted
`main` bookmark is preserved. Desktop started at `d24cbd57` with six unrelated
changed files, which remain outside this slice. No Notes/Server source,
historical record, requirement status, dependency, loader, story or test changes.

New current documentation is
`spec/src/plugins/sync/implementation-context.md` and
`spec/src/plugins/sync/implementation-plan.md`, linked from Sync and SUMMARY.
The Desktop counterpart is `spec/src/backlog/lapis-sync.md`, with its own
navigation and evidence. Cross-repository links use repository URLs rather
than machine-specific paths; new targets become remote-readable after landing.

The context attributes historical claims to the exact original receipts and
commits. Current investigation evidence is explicitly separate: 85 focused API
tests passed, Sync checks reported zero errors/warnings, and all 205 Sync tests
were skipped. Those product commands preceded this documentation slice and are
not new native or release qualification.

## Documentation validation

Runtime: Node `24.10.0`, pnpm `10.34.5`, spec-validator `0.2.0` (current
Deno-free release). Commands use the installed Node 24 toolchain. QMD doctor
passes native module/index checks under Node 24 in both repositories; the
earlier Node 26 ABI failure is not reproduced. Existing script-alias warnings
remain informational; no global package or loader configuration is edited.

| Command                                                                        | Result                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `pnpm exec spec-validator doctor --json`                                       | Pass; QMD native modules/index healthy, existing alias warning |
| `pnpm spec:search --semantic "Lapis Sync native Rust deferred implementation"` | Pass; QMD returns Sync and native-service chapters             |
| Before edit: `pnpm exec spec-validator validate --json`                        | Pass; 34 chapters, 736 requirements, zero findings             |
| Final `pnpm spec:check`                                                        | Pass: validate, mdBook and spec-first, 3 lanes                 |
| Scoped `pnpm exec prettier --check` on all five changed Markdown files         | Pass, zero unformatted files                                   |
| Read-only local-link/file-limit check on the five changed Markdown files       | Pass: 49 local links, each file within 400 lines/32,768 bytes  |
| Read-only comparison of the original/current Sync requirement rows             | Pass: all 49 rows have identical non-whitespace content        |
| `pnpm audit`                                                                   | Pass: zero active findings, 2 existing ignored low findings    |
| `pnpm --dir packages/sync audit --ignore-workspace`                            | Pass: zero active findings, 1 existing ignored low finding     |

The initial ad hoc file-limit check failed on the owning Sync index (1 finding):
it was already 36,951 bytes before this slice. Compacting table whitespace with
Prettier ignore markers brings the edited chapter to 23,804 bytes; the exact
49-row comparison proves requirement content is unchanged. The three new
principal documents are each below both limits. The same check initially found
the Desktop plugin chapter at 405 lines after adding a separate pointer; the
pointer is now integrated into its existing exclusion paragraph at 400 lines.
The failed checks are retained here rather than claimed as product failures.

Desktop's initial specification baseline independently has 14 governance/evidence
findings; its fresh receipt records those and the current consumer checks.
These are documentation checks on the selected host toolchain, not product or
Docker/native consumer qualification. The Desktop portable runner is recorded
separately in that repository.

## Contract and acceptance review

Current Sync/native-service requirements and verification statuses stay intact.
The roadmap owns future native direction, public API/Server dependencies and
eleven delivery stages. It explicitly preserves unavailable runtime state,
mandatory encryption, current parked gates, historical failures and separate
source/artifact/consumer/platform/release acceptance. Existing Deno-oriented
requirements are not silently rewritten as implemented Rust contracts.

Product/native/Storybook suites are outside this document-only slice. They are
specified as future blocking implementation gates; visual baselines remain
unchanged. No source push through the conflicted main bookmark, package
publication or installed-app replacement is part of this slice.
