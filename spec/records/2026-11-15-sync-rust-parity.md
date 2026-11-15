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

Rust now recomputes the NIP-01 serialized event ID and verifies the BIP-340
signature with the x-only public key. It verifies both outer and inner records,
requires matching kind/timestamp/tags, rejects malformed envelopes and does not
trust mutable verification caches. The fixed wire records are shared with the
retained TypeScript compatibility test.

## Focused results

| Command | Result |
| --- | --- |
| Baseline Rust Sync unit run | 67 passed, 0 failed |
| Focused TypeScript parity fixture | 58 passed, 0 failed |
| Focused Rust parity fixture families | 7 passed, 0 failed |
| Rust protocol family after signature/envelope work | 51 passed, 0 failed |

The first TypeScript fixture run failed one of 58 cases because a transformed
JSON import discarded `__proto__`. Parsing the source bytes moved that exact
case from one failure to zero. Rust canonical number formatting and filter
empty-string behavior were also corrected to the retained TypeScript outputs.

## Remaining Stage 2 gates

This slice does not yet qualify membership generation/cutoff ancestry,
authenticated missing-dependency ingestion, reconciliation, persisted retry
identity, durable idempotent apply receipts, rename/delete/binary/text merge
planning, interrupted apply or one complete fixture history. Wider package,
clippy/build/audit/spec gates and hosted CI are recorded only after those
runtime targets close. No Tauri, server, storage, release, publication or
visual claim follows from this receipt.
