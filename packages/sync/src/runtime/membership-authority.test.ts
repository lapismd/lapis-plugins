import { describe, expect, it } from "vitest";
import { createMembershipHistoryAuthority } from "./membership-authority";
import type { HistoryMembership } from "./membership-authority";
import { createEngineHarness } from "../../test-support/engine-harness";
import { installFixtureApply } from "../../test-support/reconciliation-harness";
import type {
  AuthorizedIncomingRecord,
  SyncAuthorityContext,
} from "./incoming-contracts";
import { unwrapDeviceTransportEvent } from "../protocol/revision";

async function scenario() {
  const peer = await createEngineHarness({ "note.md": "one" }, 5);
  await peer.engine.checkpoint();
  const first = peer.engine.snapshot().outbox[0];
  peer.edit("note.md", "two");
  await peer.engine.checkpoint();
  const last = peer.engine.snapshot().outbox[1];
  const snapshot: HistoryMembership = {
    schemaVersion: 2,
    vaultId: "test-vault",
    ownerPublicKey: "a".repeat(64),
    generation: 1,
    currentEpoch: 1,
    devices: [{ publicKey: peer.options.crypto.publicKey, state: "active" }],
    syncIdentity: {
      publicKey: peer.options.crypto.syncPublicKey,
      generation: 1,
      history: [
        {
          publicKey: peer.options.crypto.syncPublicKey,
          generation: 1,
          activatedMembershipGeneration: 1,
        },
      ],
    },
  };
  const policy = createMembershipHistoryAuthority({
    vaultId: "test-vault",
    ownerPublicKey: snapshot.ownerPublicKey,
    membership: async () => snapshot,
    keyEpochs: async () =>
      Array.from({ length: snapshot.currentEpoch }, (_, index) => index + 1),
  });
  const records = peer.engine.snapshot().revisions;
  const context: SyncAuthorityContext = {
    isAncestorOrEqual(candidate, descendant) {
      const pending = [descendant],
        seen = new Set<string>();
      while (pending.length) {
        const id = pending.pop()!;
        if (seen.has(id) || !records[id]) continue;
        seen.add(id);
        if (id === candidate) return true;
        pending.push(
          ...records[id].payload.parents.map((parent) => parent.eventId),
        );
      }
      return false;
    },
  };
  const record = (id: string): AuthorizedIncomingRecord => ({
    ...records[id],
    devicePublicKey: peer.options.crypto.publicKey,
    legacy: false,
  });
  return { peer, first, last, snapshot, policy, context, record };
}

function retire(s: Awaited<ReturnType<typeof scenario>>, cutoff: string) {
  s.snapshot.generation = 2;
  const previous = s.snapshot.syncIdentity!;
  s.snapshot.syncIdentity = {
    publicKey: "c".repeat(64),
    generation: 2,
    history: [
      {
        ...previous.history[0],
        retiredMembershipGeneration: 2,
        cutoffHeads: { [s.peer.options.crypto.publicKey]: cutoff },
      },
      {
        publicKey: "c".repeat(64),
        generation: 2,
        activatedMembershipGeneration: 2,
      },
    ],
  };
}

describe("enrolled history membership authority", () => {
  it("authorizes an active device through the owner-approved Sync Identity", async () => {
    const s = await scenario();
    expect(
      await s.policy.authorize(s.record(s.last.revisionEventId), s.context),
    ).toBe(true);
    expect(await s.policy.keyEpochs()).toEqual([1]);
  });

  it("fails closed without enrolled membership or with a different vault or owner", async () => {
    const s = await scenario();
    for (const membership of [
      null,
      { ...s.snapshot, vaultId: "other" },
      { ...s.snapshot, ownerPublicKey: "b".repeat(64) },
    ]) {
      const policy = createMembershipHistoryAuthority({
        vaultId: "test-vault",
        ownerPublicKey: s.snapshot.ownerPublicKey,
        membership: async () => membership,
        keyEpochs: async () => [1],
      });
      await expect(
        policy.authorize(s.record(s.last.revisionEventId), s.context),
      ).rejects.toThrow(/membership/i);
    }
  });

  it("does not authorize an unknown device even with the correct shared outer signature", async () => {
    const s = await scenario();
    s.snapshot.devices = [];
    expect(
      await s.policy.authorize(s.record(s.last.revisionEventId), s.context),
    ).toBe(false);
  });

  it("retains only revoked-device ancestry at the owner-approved cutoff and rejects its HEAD", async () => {
    const s = await scenario();
    s.snapshot.generation = 2;
    s.snapshot.currentEpoch = 2;
    s.snapshot.devices[0] = {
      ...s.snapshot.devices[0],
      state: "revoked",
      cutoffHead: s.first.revisionEventId,
    };
    expect(
      await s.policy.authorize(s.record(s.first.revisionEventId), s.context),
    ).toBe(true);
    expect(
      await s.policy.authorize(s.record(s.last.revisionEventId), s.context),
    ).toBe(false);
    expect(
      await s.policy.authorize(
        {
          event: s.first.head,
          devicePublicKey: s.peer.options.crypto.publicKey,
          legacy: false,
          payload: {
            ...s.record(s.first.revisionEventId).payload,
            revisionEventId: s.first.revisionEventId,
            revisionArchiveHash:
              s.peer.engine.snapshot().revisions[s.first.revisionEventId]
                .archiveHash,
          },
        },
        s.context,
      ),
    ).toBe(false);
  });

  it("checks retired transport generations and immutable cutoff ancestry", async () => {
    const s = await scenario();
    retire(s, s.first.revisionEventId);
    expect(
      await s.policy.authorize(s.record(s.first.revisionEventId), s.context),
    ).toBe(true);
    expect(
      await s.policy.authorize(s.record(s.last.revisionEventId), s.context),
    ).toBe(false);
    const future = s.record(s.first.revisionEventId);
    future.payload = { ...future.payload, membershipGeneration: 2 };
    expect(await s.policy.authorize(future, s.context)).toBe(false);
  });

  it("rejects future generations and invalid installed key epoch sets", async () => {
    const s = await scenario();
    const future = s.record(s.first.revisionEventId);
    future.payload = { ...future.payload, membershipGeneration: 2 };
    expect(await s.policy.authorize(future, s.context)).toBe(false);
    const policy = createMembershipHistoryAuthority({
      vaultId: "test-vault",
      ownerPublicKey: s.snapshot.ownerPublicKey,
      membership: async () => s.snapshot,
      keyEpochs: async () => [2],
    });
    await expect(policy.keyEpochs()).rejects.toThrow(/epoch/i);
  });

  it("requires the actual attested device even when the caller labels it differently", async () => {
    const s = await scenario();
    expect(
      await s.policy.authorize(
        {
          ...s.record(s.first.revisionEventId),
          devicePublicKey: "b".repeat(64),
        },
        s.context,
      ),
    ).toBe(false);
  });

  it("requires explicit legacy cutoff ancestry once a Sync Identity is activated", async () => {
    const s = await scenario();
    const original = s.record(s.first.revisionEventId);
    const deviceEvent = unwrapDeviceTransportEvent(
      original.event,
      78,
    ).deviceEvent;
    const legacy = { ...original, event: deviceEvent, legacy: true };
    // Legacy event IDs differ from their current outer envelope IDs.
    const context = {
      isAncestorOrEqual: (candidate: string, descendant: string) =>
        candidate === deviceEvent.id && descendant === deviceEvent.id,
    };
    expect(await s.policy.authorize(legacy, context)).toBe(false);
    s.snapshot.legacyTransportCutoffHeads = {
      [s.peer.options.crypto.publicKey]: deviceEvent.id,
    };
    expect(await s.policy.authorize(legacy, context)).toBe(true);
    expect(
      await s.policy.authorize(legacy, { isAncestorOrEqual: () => false }),
    ).toBe(false);
    delete s.snapshot.syncIdentity;
    delete s.snapshot.legacyTransportCutoffHeads;
    expect(await s.policy.authorize(legacy, context)).toBe(true);
  });

  it("rechecks cached tips after revocation instead of applying their old authorization", async () => {
    const s = await scenario(),
      local = await createEngineHarness();
    await local.engine.ingestHeads(
      [s.last.head],
      s.peer.repository.blobs,
      s.policy,
    );
    s.snapshot.generation = 2;
    s.snapshot.devices[0] = {
      ...s.snapshot.devices[0],
      state: "revoked",
      cutoffHead: s.first.revisionEventId,
    };
    expect(await local.engine.reconciliation(s.policy)).toEqual({
      kind: "clean",
      tips: [],
    });
    installFixtureApply(local);
    await expect(
      local.engine.applyRevision(s.last.revisionEventId, s.policy),
    ).rejects.toThrow("clean ancestry");
    expect(local.files.size).toBe(0);
    expect(Object.keys(local.engine.snapshot().revisions)).toHaveLength(2);
  });

  it("uses downloaded cutoff ancestry before accepting a retired-identity tip", async () => {
    const s = await scenario(),
      local = await createEngineHarness();
    retire(s, s.last.revisionEventId);
    await local.engine.ingestHeads(
      [s.last.head],
      s.peer.repository.blobs,
      s.policy,
    );
    expect(Object.keys(local.engine.snapshot().revisions)).toHaveLength(2);
    expect((await local.engine.reconciliation(s.policy)).kind).toBe(
      "fast-forward",
    );
    installFixtureApply(local);
    await local.engine.applyRevision(s.last.revisionEventId, s.policy);
    expect(local.engine.snapshot().appliedRevisionId).toBe(
      s.last.revisionEventId,
    );
  });

  it("accepts approved revoked ancestry under an active child and rejects ancestry beyond its cutoff", async () => {
    const s = await scenario(),
      child = await createEngineHarness({}, 6);
    installFixtureApply(child);
    await child.engine.ingestHeads(
      [s.last.head],
      s.peer.repository.blobs,
      s.policy,
    );
    await child.engine.applyRevision(s.last.revisionEventId, s.policy);
    s.snapshot.generation = 2;
    s.snapshot.currentEpoch = 2;
    s.snapshot.devices[0] = {
      ...s.snapshot.devices[0],
      state: "revoked",
      cutoffHead: s.last.revisionEventId,
    };
    s.snapshot.devices.push({
      publicKey: child.options.crypto.publicKey,
      state: "active",
    });
    child.authority.membershipGeneration = 2;
    child.authority.epoch = 2;
    child.edit("note.md", "active child");
    const revision = await child.engine.checkpoint();
    const head = child.engine.snapshot().outbox.at(-1)!.head;
    const local = await createEngineHarness();
    local.authority.membershipGeneration = 2;
    local.authority.epoch = 2;
    await local.engine.ingestHeads([head], child.repository.blobs, s.policy);
    expect(Object.keys(local.engine.snapshot().revisions)).toHaveLength(3);
    expect(await local.engine.reconciliation(s.policy)).toMatchObject({
      kind: "fast-forward",
      targetRevisionId: revision!.id,
    });
    const recovering = await createEngineHarness();
    recovering.authority.membershipGeneration = 2;
    recovering.authority.epoch = 2;
    await recovering.engine.ingestHeads(
      [head],
      child.repository.blobs,
      s.policy,
    );
    const apply = installFixtureApply(recovering);
    apply.crashNextMutation();
    await expect(
      recovering.engine.applyRevision(revision!.id, s.policy),
    ).rejects.toThrow("Crash");
    s.snapshot.generation = 3;
    s.snapshot.devices[0].cutoffHead = s.first.revisionEventId;
    local.authority.membershipGeneration = 3;
    recovering.authority.membershipGeneration = 3;
    expect(await local.engine.reconciliation(s.policy)).toEqual({
      kind: "clean",
      tips: [],
    });
    await expect(recovering.engine.resumeApply(s.policy)).rejects.toThrow(
      "not authorized",
    );
    expect(recovering.engine.snapshot().applyIntent).not.toBeNull();
    expect(
      new TextDecoder().decode(recovering.files.get("note.md")!.bytes),
    ).toBe("active child");
    const another = await createEngineHarness();
    await expect(
      another.engine.ingestHeads([head], child.repository.blobs, s.policy),
    ).rejects.toThrow("not authorized");
    expect(another.repository.record).toBeNull();
    expect(another.engine.snapshot().heads).toEqual({});
  });
});
