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
  authorizeMembershipRecord,
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
  validateHistoryMembership,
  verifySignedEvent,
} from "../engine.js";
import type {
  NostrEventFilter,
  HistoryMembership,
  MembershipAuthorizationRecord,
  RevisionNode,
  SignedNostrEvent,
  SyncAuthorityContext,
} from "../engine.js";
import { planReconciliationGraph } from "../runtime/reconciliation.js";
import {
  validateAuthenticatedHistoryGraph,
  type AuthenticatedHistoryGraph,
} from "../runtime/incoming-reader.js";
import { publicationAttemptOutcome } from "../runtime/local-engine.js";
import type { PublicationReceipt } from "../runtime/contracts.js";
import { planApplyRecoveryStep } from "../runtime/guarded-apply.js";
import type {
  ApplyIntent,
  ApplyReceipt,
  FileGeneration,
} from "../runtime/incoming-contracts.js";

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
  reconciliation: {
    cases: Array<{
      name: string;
      localRevisionId: string | null;
      remoteRevisionIds: string[];
      localChanges: boolean;
      nodes: Record<string, string[]>;
      output: Json;
    }>;
    failures: Array<{
      name: string;
      localRevisionId: string | null;
      remoteRevisionIds: string[];
      localChanges: boolean;
      nodes: Record<string, string[]>;
    }>;
  };
  incomingGraph: {
    successes: Array<{
      name: string;
      graph: AuthenticatedHistoryGraph;
      output: Json;
    }>;
    failures: Array<{ name: string; graph: AuthenticatedHistoryGraph }>;
  };
  outboxRetry: {
    successes: Array<{
      name: string;
      revisionEventId: string;
      headEventId: string;
      revisionReceipt: PublicationReceipt;
      headReceipt?: PublicationReceipt;
      output: string;
    }>;
    failures: Array<{
      name: string;
      revisionEventId: string;
      headEventId: string;
      revisionReceipt: Json;
      headReceipt?: Json;
    }>;
  };
  applyRecovery: {
    successes: Array<{
      name: string;
      intent: ApplyIntent;
      current: Record<string, FileGeneration>;
      recoveredReceipt: ApplyReceipt | null;
      output: Json;
    }>;
    failures: Array<{
      name: string;
      intent: ApplyIntent;
      current: Record<string, FileGeneration>;
      recoveredReceipt: ApplyReceipt | null;
    }>;
  };
  membershipAuthority: {
    membership: HistoryMembership;
    installedEpochs: number[];
    ancestry: Record<string, string[]>;
    cases: Array<{
      name: string;
      record: MembershipAuthorizationRecord;
      authorized: boolean;
    }>;
    invalidMemberships: Array<{
      name: string;
      patch: {
        duplicateFirstDevice?: boolean;
        activeIdentityGeneration?: number;
        retireActiveIdentityAt?: number;
      };
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
const membershipContext: SyncAuthorityContext = {
  isAncestorOrEqual(candidate, descendant) {
    const pending = [descendant];
    const seen = new Set<string>();
    while (pending.length) {
      const id = pending.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      if (id === candidate) return true;
      pending.push(...(fixtures.membershipAuthority.ancestry[id] ?? []));
    }
    return false;
  },
};
const reconciliationNodes = (input: Record<string, string[]>) =>
  new Map(
    Object.entries(input).map(([eventId, parents]) => [
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

  it.each(fixtures.reconciliation.cases)(
    "reconciliation: $name",
    (fixture) => {
      expect(
        planReconciliationGraph({
          ...fixture,
          nodes: reconciliationNodes(fixture.nodes),
        }),
      ).toEqual(fixture.output);
    },
  );

  it.each(fixtures.reconciliation.failures)(
    "reconciliation failure: $name",
    (fixture) => {
      expect(() =>
        planReconciliationGraph({
          ...fixture,
          nodes: reconciliationNodes(fixture.nodes),
        }),
      ).toThrow();
    },
  );

  it.each(fixtures.incomingGraph.successes)(
    "incoming graph: $name",
    (fixture) => {
      expect(validateAuthenticatedHistoryGraph(fixture.graph)).toEqual(
        fixture.output,
      );
    },
  );

  it.each(fixtures.incomingGraph.failures)(
    "incoming graph failure: $name",
    (fixture) => {
      expect(() => validateAuthenticatedHistoryGraph(fixture.graph)).toThrow();
    },
  );

  it.each(fixtures.outboxRetry.successes)(
    "outbox retry: $name",
    (fixture) => {
      expect(publicationAttemptOutcome(fixture)).toBe(fixture.output);
    },
  );

  it.each(fixtures.outboxRetry.failures)(
    "outbox retry failure: $name",
    (fixture) => {
      expect(() =>
        publicationAttemptOutcome(
          fixture as unknown as Parameters<
            typeof publicationAttemptOutcome
          >[0],
        ),
      ).toThrow();
    },
  );

  it.each(fixtures.applyRecovery.successes)(
    "apply recovery: $name",
    (fixture) => {
      expect(
        planApplyRecoveryStep(
          fixture.intent,
          fixture.current,
          fixture.recoveredReceipt,
        ),
      ).toEqual(fixture.output);
    },
  );

  it.each(fixtures.applyRecovery.failures)(
    "apply recovery failure: $name",
    (fixture) => {
      expect(() =>
        planApplyRecoveryStep(
          fixture.intent,
          fixture.current,
          fixture.recoveredReceipt,
        ),
      ).toThrow();
    },
  );

  it.each(fixtures.membershipAuthority.cases)(
    "membership authority: $name",
    (fixture) => {
      expect(
        authorizeMembershipRecord({
          membership: fixtures.membershipAuthority.membership,
          installedEpochs: fixtures.membershipAuthority.installedEpochs,
          context: membershipContext,
          record: fixture.record,
        }),
      ).toBe(fixture.authorized);
    },
  );

  it.each(fixtures.membershipAuthority.invalidMemberships)(
    "invalid membership: $name",
    (fixture) => {
      const membership = structuredClone(
        fixtures.membershipAuthority.membership,
      );
      if (fixture.patch.duplicateFirstDevice)
        membership.devices.push(structuredClone(membership.devices[0]));
      if (fixture.patch.activeIdentityGeneration !== undefined)
        membership.syncIdentity!.generation =
          fixture.patch.activeIdentityGeneration;
      if (fixture.patch.retireActiveIdentityAt !== undefined)
        membership.syncIdentity!.history.find(
          (entry) =>
            entry.publicKey === membership.syncIdentity!.publicKey,
        )!.retiredMembershipGeneration = fixture.patch.retireActiveIdentityAt;
      expect(() =>
        validateHistoryMembership(
          membership,
          membership.vaultId,
          membership.ownerPublicKey,
        ),
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
