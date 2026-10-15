import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import { describe, expect, it } from "vitest";
import fixtures from "../../test-support/nostr-wire-fixtures.json";
import {
  parseHeadPayload,
  parseRevisionPayload,
  unwrapDeviceTransportEvent,
  unwrapRootAuthorityEvent,
  verifySignedEvent,
  signRevisionEvent,
  signHeadEvent,
} from "../engine.js";
import type {
  SignedNostrEvent,
  RevisionPayload,
  HeadPayload,
  SyncCryptoProvider,
} from "../engine.js";
describe("existing Nostr Sync wire records", () => {
  it.each([
    [fixtures.revision, 78],
    [fixtures.head, 30078],
    [fixtures.secondHead, 30078],
  ] as const)("preserves an existing device envelope", (raw, kind) => {
    const event = structuredClone(raw) as SignedNostrEvent;
    const unwrapped = unwrapDeviceTransportEvent(event, kind);
    expect(unwrapped.transportEvent).toEqual(raw);
    expect(unwrapped.legacy).toBe(false);
    expect(unwrapped.deviceEvent.pubkey).not.toBe(event.pubkey);
    expect(event).toEqual(raw);
  });
  it("preserves the owner attestation and independently signed outer record", () => {
    const event = structuredClone(fixtures.membership);
    const result = unwrapRootAuthorityEvent(event);
    expect(result.legacy).toBe(false);
    expect(result.rootEvent.pubkey).not.toBe(event.pubkey);
    expect(event).toEqual(fixtures.membership);
  });
  it("retains explicit legacy reads", () => {
    const event = structuredClone(fixtures.legacyRevision);
    expect(unwrapDeviceTransportEvent(event, 78)).toEqual({
      transportEvent: event,
      deviceEvent: event,
      legacy: true,
    });
  });
  it("does not trust library verification cached before mutation", () => {
    const event = structuredClone(fixtures.revision);
    expect(verifyEvent(event)).toBe(true);
    event.content += "tampered";
    expect(() => verifySignedEvent(event)).toThrow(/signature/i);
  });
  it.each(["tags", "created_at", "kind"] as const)(
    "rejects re-signed outer %s metadata that differs from its attestation",
    (field) => {
      const original = fixtures.revision;
      const event = finalizeEvent(
        {
          kind: field === "kind" ? 30078 : original.kind,
          created_at:
            field === "created_at"
              ? original.created_at + 1
              : original.created_at,
          tags: field === "tags" ? [["d", "another-vault"]] : original.tags,
          content: original.content,
        },
        new Uint8Array(32).fill(3),
      );
      expect(() =>
        unwrapDeviceTransportEvent(event, event.kind as 78 | 30078),
      ).toThrow(/metadata/i);
    },
  );
  it("rejects a corrupted inner signature despite a valid outer signature", () => {
    const envelope = JSON.parse(fixtures.revision.content);
    envelope.deviceEvent.sig = "0".repeat(128);
    const event = finalizeEvent(
      {
        kind: 78,
        created_at: fixtures.revision.created_at,
        tags: fixtures.revision.tags,
        content: JSON.stringify(envelope),
      },
      new Uint8Array(32).fill(3),
    );
    expect(() => unwrapDeviceTransportEvent(event, 78)).toThrow(/signature/i);
  });
  it.each([
    "{bad",
    '{"schemaVersion":9,"type":"lapis-sync-device-attestation"}',
  ])("rejects malformed signed envelopes: %s", (content) => {
    const event = finalizeEvent(
      {
        kind: 78,
        created_at: fixtures.revision.created_at,
        tags: fixtures.revision.tags,
        content,
      },
      new Uint8Array(32).fill(3),
    );
    expect(() => unwrapDeviceTransportEvent(event, 78)).toThrow();
  });
  it("emits the same templates around persisted encrypted payloads", async () => {
    for (const [event, payload, kind] of [
      [fixtures.revision, fixtures.payload, 78],
      [fixtures.head, fixtures.headPayload, 30078],
    ] as const) {
      const inner = JSON.parse(event.content).deviceEvent;
      const bytes = Uint8Array.from(
        inner.content.match(/../g).map((byte: string) => parseInt(byte, 16)),
      );
      const calls: string[] = [];
      const crypto = {
        publicKey: inner.pubkey,
        syncPublicKey: event.pubkey,
        encryptObject: async (input: {
          plaintext: Uint8Array;
          type: string;
          epoch: number;
        }) => {
          expect(JSON.parse(new TextDecoder().decode(input.plaintext))).toEqual(
            payload,
          );
          expect(input.type).toBe(
            kind === 78 ? "revision-payload" : "head-payload",
          );
          expect(input.epoch).toBe(1);
          calls.push("encrypt");
          return { bytes, objectHash: "fixture" };
        },
        signDeviceEvent: async (input: unknown) => {
          const { id, pubkey, sig, ...template } = inner;
          expect(input).toEqual(template);
          calls.push("device");
          return inner;
        },
        signTransportEvent: async (input: unknown) => {
          const { id, pubkey, sig, ...template } = event;
          expect(input).toEqual(template);
          calls.push("transport");
          return event;
        },
      } as unknown as SyncCryptoProvider;
      const result =
        kind === 78
          ? await signRevisionEvent({
              crypto,
              vaultId: "fixture-vault",
              payload: payload as RevisionPayload,
              createdAt: event.created_at,
            })
          : await signHeadEvent({
              crypto,
              vaultId: "fixture-vault",
              payload: payload as HeadPayload,
              createdAt: event.created_at,
            });
      expect(result).toEqual(event);
      expect(calls).toEqual(["encrypt", "device", "transport"]);
      expect(event.content).not.toContain("Encrypted checkpoint fixture");
    }
  });
  it.each(["content", "id", "sig", "pubkey"] as const)(
    "rejects a substituted %s",
    (field) => {
      const event = structuredClone(fixtures.revision);
      event[field] = "0".repeat(event[field].length);
      expect(() => unwrapDeviceTransportEvent(event, 78)).toThrow();
    },
  );
  it("retains payload schemas and archive ancestry", () => {
    expect(parseRevisionPayload(fixtures.payload)).toEqual(fixtures.payload);
    expect(parseHeadPayload(fixtures.headPayload)).toEqual(
      fixtures.headPayload,
    );
    expect(
      parseRevisionPayload({
        ...fixtures.payload,
        schemaVersion: 1,
        currentEpoch: undefined,
        membershipGeneration: undefined,
      }),
    ).toMatchObject({
      schemaVersion: 2,
      currentEpoch: 1,
      membershipGeneration: 0,
    });
  });
  it("encrypts before signing and propagates locked-key failure", async () => {
    const calls: string[] = [];
    const crypto = {
      publicKey: "device",
      syncPublicKey: "outer",
      encryptObject: async () => {
        calls.push("encrypt");
        throw new Error("Keys locked");
      },
      signDeviceEvent: async () => {
        calls.push("device");
      },
      signTransportEvent: async () => {
        calls.push("transport");
      },
    } as unknown as SyncCryptoProvider;
    await expect(
      signRevisionEvent({
        crypto,
        vaultId: "fixture-vault",
        payload: fixtures.payload as RevisionPayload,
        createdAt: 10,
      }),
    ).rejects.toThrow("Keys locked");
    await expect(
      signHeadEvent({
        crypto,
        vaultId: "fixture-vault",
        payload: fixtures.headPayload as HeadPayload,
        createdAt: 10,
      }),
    ).rejects.toThrow("Keys locked");
    expect(calls).toEqual(["encrypt", "encrypt"]);
  });
});
