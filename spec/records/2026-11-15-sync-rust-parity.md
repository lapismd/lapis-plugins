# Sync Rust parity implementation

Stage 2 starts from the verified TypeScript source oracle at Plugins change
`99c27412`. This receipt is append-only progress evidence, not a claim that the
native engine or Stage 2 exit boundary is complete.

## Starting boundary

The inherited Rust delta exposed 67 Sync unit tests, all passing with the
installed Rust 1.99 toolchain. Audit against `packages/sync/src` found no shared
TypeScript/Rust complete-output corpus, no NIP-01 event-ID or Schnorr signature
verification, no device/root attestation-envelope reader, and incomplete
membership cutoff, ingestion, retry, apply-recovery and merge behavior. The
67-test count therefore did not qualify native parity.

## Protocol parity slice

`packages/sync/test-support/protocol-parity-fixtures.json` is loaded from its
actual JSON bytes by TypeScript and through `include_str!` by Rust. Loading the
TypeScript fixture as a build-tool JSON module was rejected because the
generated object literal discarded the own `__proto__` key. The byte parser is
now an asserted part of the boundary.

The corpus records complete expected successes and failures for:

- canonical JSON, including ECMAScript number formatting and prototype-shaped
  own keys;
- filter validation/matching, empty values and unknown fields;
- replaceable address separation, timestamp ordering and lexical ties;
- diamond ancestry, missing parents, maximal heads and common ancestors;
- current and legacy revision/HEAD readers;
- fixed SHA-256, HKDF-SHA256, HMAC-SHA256 and XChaCha20-Poly1305 outputs;
- frozen NIP-01 records, device attestations, root attestations and explicit
  legacy reads.
- owner-approved membership structure, installed epochs, current/retired Sync
  Identities, revoked-device ancestry and immutable cutoffs.

Rust now recomputes the NIP-01 serialized event ID and verifies the BIP-340
signature with the x-only public key. It verifies both outer and inner records,
requires matching kind/timestamp/tags, rejects malformed envelopes and does not
trust mutable verification caches. The fixed wire records are shared with the
retained TypeScript compatibility test.

The membership policy now has a pure verified-record boundary shared by both
engines. The TypeScript production authority still verifies the signed envelope
before entering it. The complete outcomes cover active and revoked devices,
revision versus HEAD policy, retired identity generations, explicit legacy
cutoffs, attested-device mismatch, unknown devices and invalid membership
lineage. Generation zero and lowercase wire-key rules now match the retained
TypeScript policy.

Incoming history now has a shared pure validation boundary after cryptographic
and object authentication. It rejects missing parents, cycles, mismatched
parent archive references and HEAD archive/root substitution, then returns the
complete accepted IDs. Verified alternate encrypted archives for the same
immutable signed event remain valid. The first integration run rejected that
legacy-compatible alias case; explicit authenticated aliases repaired the exact
incoming-history regression from one failure to zero.

Ancestry reconciliation is also shared as a pure graph transition. Complete
outputs cover clean, fast-forward, dirty-local, merge-required and unrelated
plans, ancestor-tip collapse, missing tips and multiple incomparable merge
bases. Production TypeScript still gathers currently authorized heads and
rechecks their ancestry before calling this planner.

Publication retry now admits only exact revision and HEAD receipts and returns
the same retain, publish-HEAD or complete transition in both engines. Staged
acknowledgements retain the persisted event/ciphertext identity; accepted or
applied revision acknowledgements can advance to the existing HEAD only.

Guarded apply recovery now has a shared pure transition over the durable intent,
observed complete vault generations and an optional host receipt. It validates
receipt-operation identity, safe monotonic write generations, removals, a
contiguous persisted receipt prefix and the complete expected vault before
mutation, receipt admission or finalization. Cases cover required mutation,
durable receipt recovery, already-completed work, stale and edited targets,
mismatched receipts, extra-file finalization rejection and prototype-shaped
paths/operation IDs. The prototype case exposed an inherited `constructor`
lookup in the TypeScript expected-state builder; own-property admission repaired
that exact failure without weakening the retained guarded-apply assertions.

## Focused results

| Command | Result |
| --- | --- |
| Baseline Rust Sync unit run | 67 passed, 0 failed |
| Focused TypeScript parity fixture | 112 passed, 0 failed |
| Focused Rust parity fixture families | 12 passed, 0 failed |
| Rust protocol family after signature/envelope work | 51 passed, 0 failed |
| Rust Sync family after retry/apply-recovery parity | 86 passed, 0 failed |
| Full TypeScript Sync unit run after retry/apply recovery | 19 files, 317 passed, 0 failed |
| TypeScript/Svelte checks, package build and publint | Passed |
| Rust fmt, clippy and build | Passed |
| Root/package audit | Passed; 2/1 governed low findings ignored |
| Specification validation, mdBook and spec-first | Passed |

The first TypeScript fixture run failed one of 58 cases because a transformed
JSON import discarded `__proto__`. Parsing the source bytes moved that exact
case from one failure to zero. Rust canonical number formatting and filter
empty-string behavior were also corrected to the retained TypeScript outputs.

## Remaining Stage 2 gates

This slice does not yet qualify rename/delete/binary/text merge planning,
host-persisted idempotent receipts, interrupted native apply or one complete fixture history. Wider package,
clippy/build/audit/spec gates and hosted CI are recorded only after those
runtime targets close. No Tauri, server, storage, release, publication or
visual claim follows from this receipt.
