import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import wireJson from "../../test-support/nostr-wire-fixtures.json";
import {
  ancestorIds,
  canonicalize,
  compareReplaceableEvents,
  isAncestor,
  matchesEventFilter,
  maximalHeads,
  nearestCommonAncestor,
  parseHeadPayload,
  parseRevisionPayload,
  replaceableEventAddress,
  unwrapDeviceTransportEvent,
  unwrapRootAuthorityEvent,
  validateEventFilter,
  verifySignedEvent,
} from "../engine.js";
import type {
  NostrEventFilter,
  RevisionNode,
  SignedNostrEvent,
} from "../engine.js";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type FixtureCorpus = {
  schemaVersion: number;
  canonical: Array<{ name: string; input: Json; output: string }>;
  filter: {
    event: SignedNostrEvent;
    cases: Array<{ name: string; filter: NostrEventFilter; matches: boolean }>;
    invalid: Array<{ name: string; filter: Json }>;
  };
  replaceable: {
    events: Record<string, SignedNostrEvent>;
    addresses: Array<{ event: string; output: string }>;
    comparisons: Array<{ left: string; right: string; output: number }>;
    failures: Array<{ name: string; left: string; right: string }>;
  };
  ancestry: {
    nodes: Record<string, string[]>;
    ancestors: Array<{ start: string; output: string[] }>;
    isAncestor: Array<{
      candidate: string;
      descendant: string;
      output: boolean;
    }>;
    maximalHeads: Array<{ heads: string[]; output: string[] }>;
    nearestCommonAncestor: Array<{
      left: string;
      right: string;
      output: string | null;
    }>;
  };
  revisionReaders: {
    successes: Array<{
      name: string;
      type: "revision" | "head";
      input: Json;
      output: Json;
    }>;
    failures: Array<{
      name: string;
      type: "revision" | "head";
      input: Json;
    }>;
  };
  crypto: {
    sha256: { inputUtf8: string; outputHex: string };
    hkdfSha256: {
      ikmUtf8: string;
      saltUtf8: string;
      infoUtf8: string;
      outputHex: string;
    };
    hmacSha256: { keyUtf8: string; inputUtf8: string; outputHex: string };
    xchacha20poly1305: {
      keyHex: string;
      nonceHex: string;
      aadHex: string;
      plaintextUtf8: string;
      ciphertextHex: string;
    };
  };
  wire: {
    validSignedEvents: string[];
    deviceEnvelopes: Array<{
      event: string;
      kind: 78 | 30078;
      legacy: boolean;
      attestedPubkey: string;
    }>;
    rootEnvelopes: Array<{
      event: string;
      legacy: boolean;
      attestedPubkey: string;
    }>;
  };
};

// Parse the bytes exactly as consumers do. A build-tool JSON import may lower
// `__proto__` through an object literal and silently discard that own key.
const fixtures = JSON.parse(
  readFileSync(
    new URL(
      "../../test-support/protocol-parity-fixtures.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as FixtureCorpus;
const wire = wireJson as unknown as Record<string, SignedNostrEvent>;
const encoder = new TextEncoder();
const event = (name: string) => fixtures.replaceable.events[name];
const nodes = new Map<string, RevisionNode>(
  Object.entries(fixtures.ancestry.nodes).map(([eventId, parents]) => [
    eventId,
    {
      eventId,
      parents: parents.map((parent) => ({
        eventId: parent,
        archiveHash: `archive-${parent}`,
      })),
    },
  ]),
);

describe("frozen TypeScript/Rust protocol parity fixtures", () => {
  it("uses the supported fixture schema", () => {
    expect(fixtures.schemaVersion).toBe(1);
  });

  it.each(fixtures.canonical)("canonical JSON: $name", ({ input, output }) => {
    expect(canonicalize(input)).toBe(output);
  });

  it.each(fixtures.filter.cases)("event filter: $name", (fixture) => {
    expect(matchesEventFilter(fixtures.filter.event, fixture.filter)).toBe(
      fixture.matches,
    );
  });

  it.each(fixtures.filter.invalid)("invalid event filter: $name", (fixture) => {
    expect(() => validateEventFilter(fixture.filter)).toThrow();
  });

  it.each(fixtures.replaceable.addresses)(
    "replaceable address: $event",
    (fixture) => {
      expect(replaceableEventAddress(event(fixture.event))).toBe(
        fixture.output,
      );
    },
  );

  it.each(fixtures.replaceable.comparisons)(
    "replaceable ordering: $left / $right",
    (fixture) => {
      expect(
        Math.sign(
          compareReplaceableEvents(event(fixture.left), event(fixture.right)),
        ),
      ).toBe(fixture.output);
    },
  );

  it.each(fixtures.replaceable.failures)(
    "replaceable failure: $name",
    (fixture) => {
      expect(() =>
        compareReplaceableEvents(event(fixture.left), event(fixture.right)),
      ).toThrow();
    },
  );

  it.each(fixtures.ancestry.ancestors)("ancestors: $start", (fixture) => {
    expect([...ancestorIds(fixture.start, nodes)].sort()).toEqual(
      fixture.output,
    );
  });

  it.each(fixtures.ancestry.isAncestor)(
    "ancestry: $candidate / $descendant",
    (fixture) => {
      expect(isAncestor(fixture.candidate, fixture.descendant, nodes)).toBe(
        fixture.output,
      );
    },
  );

  it.each(fixtures.ancestry.maximalHeads)(
    "maximal heads: $heads",
    (fixture) => {
      expect(maximalHeads(fixture.heads, nodes)).toEqual(fixture.output);
    },
  );

  it.each(fixtures.ancestry.nearestCommonAncestor)(
    "nearest common ancestor: $left / $right",
    (fixture) => {
      expect(nearestCommonAncestor(fixture.left, fixture.right, nodes)).toBe(
        fixture.output,
      );
    },
  );

  it.each(fixtures.revisionReaders.successes)(
    "revision reader success: $name",
    (fixture) => {
      expect(
        fixture.type === "revision"
          ? parseRevisionPayload(fixture.input)
          : parseHeadPayload(fixture.input),
      ).toEqual(fixture.output);
    },
  );

  it.each(fixtures.revisionReaders.failures)(
    "revision reader failure: $name",
    (fixture) => {
      expect(() =>
        fixture.type === "revision"
          ? parseRevisionPayload(fixture.input)
          : parseHeadPayload(fixture.input),
      ).toThrow();
    },
  );

  it("matches the frozen cryptographic outputs", () => {
    const crypto = fixtures.crypto;
    expect(bytesToHex(sha256(encoder.encode(crypto.sha256.inputUtf8)))).toBe(
      crypto.sha256.outputHex,
    );
    expect(
      bytesToHex(
        hkdf(
          sha256,
          encoder.encode(crypto.hkdfSha256.ikmUtf8),
          encoder.encode(crypto.hkdfSha256.saltUtf8),
          encoder.encode(crypto.hkdfSha256.infoUtf8),
          32,
        ),
      ),
    ).toBe(crypto.hkdfSha256.outputHex);
    expect(
      bytesToHex(
        hmac(
          sha256,
          encoder.encode(crypto.hmacSha256.keyUtf8),
          encoder.encode(crypto.hmacSha256.inputUtf8),
        ),
      ),
    ).toBe(crypto.hmacSha256.outputHex);
    const xchacha = crypto.xchacha20poly1305;
    expect(
      bytesToHex(
        xchacha20poly1305(
          hexToBytes(xchacha.keyHex),
          hexToBytes(xchacha.nonceHex),
          hexToBytes(xchacha.aadHex),
        ).encrypt(encoder.encode(xchacha.plaintextUtf8)),
      ),
    ).toBe(xchacha.ciphertextHex);
  });

  it.each(fixtures.wire.validSignedEvents)(
    "verifies frozen signed event: %s",
    (name) => {
      expect(() => verifySignedEvent(structuredClone(wire[name]))).not.toThrow();
    },
  );

  it.each(fixtures.wire.deviceEnvelopes)(
    "unwraps frozen device envelope: $event",
    (fixture) => {
      const result = unwrapDeviceTransportEvent(
        structuredClone(wire[fixture.event]),
        fixture.kind,
      );
      expect(result.legacy).toBe(fixture.legacy);
      expect(result.deviceEvent.pubkey).toBe(fixture.attestedPubkey);
    },
  );

  it.each(fixtures.wire.rootEnvelopes)(
    "unwraps frozen root envelope: $event",
    (fixture) => {
      const result = unwrapRootAuthorityEvent(
        structuredClone(wire[fixture.event]),
      );
      expect(result.legacy).toBe(fixture.legacy);
      expect(result.rootEvent.pubkey).toBe(fixture.attestedPubkey);
    },
  );
});
