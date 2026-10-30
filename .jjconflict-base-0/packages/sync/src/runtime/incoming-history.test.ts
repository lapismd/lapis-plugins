import { describe, expect, it, vi } from "vitest";
import {
  createEngineHarness,
  reopenEngine,
  fixtureCrypto,
} from "../../test-support/engine-harness";
import {
  fixtureIncomingAuthority,
  installFixtureApply,
} from "../../test-support/reconciliation-harness";
import { signHeadEvent, signRevisionEvent } from "../protocol/revision";
import { canonicalize } from "../protocol/canonical-json";

describe("incoming encrypted history", () => {
  it("ingests a peer tip and its encrypted ancestry durably", async () => {
    const peer = await createEngineHarness({ "peer.md": "one" }, 5);
    await peer.engine.checkpoint();
    peer.edit("peer.md", "two");
    const revision = await peer.engine.checkpoint();
    const local = await createEngineHarness();
    const head = peer.engine.snapshot().outbox.at(-1)!.head;
    const authority = fixtureIncomingAuthority([peer.options.crypto.publicKey]);
    await local.engine.ingestHeads([head], peer.repository.blobs, authority);
    expect(Object.keys(local.engine.snapshot().revisions)).toHaveLength(2);
    expect(await local.engine.reconciliation(authority)).toMatchObject({
      kind: "fast-forward",
      targetRevisionId: revision!.id,
    });
    expect(local.persistedText()).not.toContain("peer.md");
    expect((await reopenEngine(local)).snapshot()).toEqual(
      local.engine.snapshot(),
    );
  });

  it("requires explicit membership authority even for valid signatures", async () => {
    const peer = await createEngineHarness({ "peer.md": "one" }, 5),
      local = await createEngineHarness();
    await peer.engine.checkpoint();
    const head = peer.engine.snapshot().outbox[0].head;
    await expect(
      local.engine.ingestHeads([head], peer.repository.blobs, undefined!),
    ).rejects.toThrow("membership authority");
    await expect(
      local.engine.ingestHeads(
        [head],
        peer.repository.blobs,
        fixtureIncomingAuthority([]),
      ),
    ).rejects.toThrow("not authorized");
    expect(local.engine.snapshot().heads).toEqual({});
    expect(local.repository.record).toBeNull();
  });

  it.each(["missing", "corrupt"])(
    "keeps the prior accepted state when a content object is %s",
    async (failure) => {
      const peer = await createEngineHarness({ "peer.md": "one" }, 5),
        local = await createEngineHarness();
      await peer.engine.checkpoint();
      const head = peer.engine.snapshot().outbox[0].head;
      const contentHash = [...peer.repository.objects].find(
        ([, bytes]) => bytes[1] === 1,
      )![0];
      if (failure === "missing") peer.repository.objects.delete(contentHash);
      else peer.repository.objects.get(contentHash)![30] ^= 1;
      await expect(
        local.engine.ingestHeads(
          [head],
          peer.repository.blobs,
          fixtureIncomingAuthority([peer.options.crypto.publicKey]),
        ),
      ).rejects.toThrow(/Corrupt incoming object|Missing object/);
      expect(local.engine.snapshot().heads).toEqual({});
      expect(local.engine.snapshot().revisions).toEqual({});
      expect(local.repository.record).toBeNull();
    },
  );

  it("preserves alternate encrypted archive references for the same original signed event", async () => {
    const a = await createEngineHarness({ "note.md": "original" }, 5),
      local = await createEngineHarness();
    const first = await a.engine.checkpoint();
    const record = a.engine.snapshot().revisions[first!.id],
      crypto = fixtureCrypto(6);
    const authority = fixtureIncomingAuthority([
      a.options.crypto.publicKey,
      crypto.publicKey,
    ]);
    await local.engine.ingestHeads(
      [a.engine.snapshot().outbox[0].head],
      a.repository.blobs,
      authority,
    );
    const alternate = await crypto.encryptObject({
      epoch: 1,
      type: "revision-archive",
      plaintext: new TextEncoder().encode(canonicalize(record.event)),
    });
    await a.repository.blobs.put(alternate.bytes);
    const payload = {
      ...record.payload,
      parents: [{ eventId: first!.id, archiveHash: alternate.objectHash }],
      changes: [],
      message: "child",
    };
    const child = await signRevisionEvent({
      crypto,
      vaultId: "test-vault",
      payload,
      createdAt: first!.created_at + 1,
    });
    const archive = await crypto.encryptObject({
      epoch: 1,
      type: "revision-archive",
      plaintext: new TextEncoder().encode(canonicalize(child)),
    });
    await a.repository.blobs.put(archive.bytes);
    const head = await signHeadEvent({
      crypto,
      vaultId: "test-vault",
      createdAt: child.created_at,
      payload: {
        schemaVersion: 2,
        vaultId: "test-vault",
        revisionEventId: child.id,
        revisionArchiveHash: archive.objectHash,
        root: payload.root,
        keyEpoch: 1,
        currentEpoch: 1,
        membershipGeneration: 1,
      },
    });
    await local.engine.ingestHeads([head], a.repository.blobs, authority);
    expect(local.engine.snapshot().revisions[first!.id].archiveHash).toBe(
      record.archiveHash,
    );
    expect(
      local.engine.snapshot().revisions[child.id].payload.parents[0]
        .archiveHash,
    ).toBe(alternate.objectHash);
    expect(await local.repository.blobs.has(alternate.objectHash)).toBe(true);
  });

  it("fails closed when no installed key can authenticate the encrypted records", async () => {
    const peer = await createEngineHarness({ "note.md": "one" }, 5),
      local = await createEngineHarness();
    await peer.engine.checkpoint();
    const authority = {
      ...fixtureIncomingAuthority([peer.options.crypto.publicKey]),
      keyEpochs: async () => [2],
    };
    await expect(
      local.engine.ingestHeads(
        [peer.engine.snapshot().outbox[0].head],
        peer.repository.blobs,
        authority,
      ),
    ).rejects.toThrow("installed keys");
    expect(local.repository.record).toBeNull();
  });

  it("rejects cross-vault HEAD substitution and a signed mismatched root", async () => {
    const peer = await createEngineHarness({ "peer.md": "one" }, 5),
      local = await createEngineHarness();
    await peer.engine.checkpoint();
    const entry = peer.engine.snapshot().outbox[0];
    const record = peer.engine.snapshot().revisions[entry.revisionEventId];
    const payload = {
      schemaVersion: 2 as const,
      vaultId: "other-vault",
      revisionEventId: record.event.id,
      revisionArchiveHash: record.archiveHash,
      root: record.payload.root,
      keyEpoch: 1,
      currentEpoch: 1,
      membershipGeneration: 1,
    };
    const authority = fixtureIncomingAuthority([peer.options.crypto.publicKey]);
    const foreign = await signHeadEvent({
      crypto: peer.options.crypto,
      vaultId: "other-vault",
      payload,
      createdAt: entry.head.created_at,
    });
    await expect(
      local.engine.ingestHeads([foreign], peer.repository.blobs, authority),
    ).rejects.toThrow("scope mismatch");
    const mismatched = await signHeadEvent({
      crypto: peer.options.crypto,
      vaultId: "test-vault",
      payload: { ...payload, vaultId: "test-vault", root: "0".repeat(64) },
      createdAt: entry.head.created_at,
    });
    await expect(
      local.engine.ingestHeads([mismatched], peer.repository.blobs, authority),
    ).rejects.toThrow("HEAD root");
    expect(local.repository.record).toBeNull();
  });

  it("does not regress a same-address HEAD when an older record arrives late", async () => {
    const peer = await createEngineHarness({ "peer.md": "one" }, 5),
      local = await createEngineHarness();
    await peer.engine.checkpoint();
    const oldHead = peer.engine.snapshot().outbox[0].head;
    peer.edit("peer.md", "two");
    await peer.engine.checkpoint();
    const current = peer.engine.snapshot().outbox[1];
    const authority = fixtureIncomingAuthority([peer.options.crypto.publicKey]);
    await local.engine.ingestHeads(
      [current.head, oldHead],
      peer.repository.blobs,
      authority,
    );
    expect(Object.values(local.engine.snapshot().heads)).toHaveLength(1);
    expect(await local.engine.reconciliation(authority)).toMatchObject({
      kind: "fast-forward",
      targetRevisionId: current.revisionEventId,
    });
  });

  it("retains incomparable device tips and identifies their common ancestor", async () => {
    const a = await createEngineHarness({ "note.md": "base" }, 5),
      b = await createEngineHarness({}, 6);
    await a.engine.checkpoint();
    const root = a.engine.snapshot().localRevisionId!;
    const authority = fixtureIncomingAuthority([
      a.options.crypto.publicKey,
      b.options.crypto.publicKey,
    ]);
    installFixtureApply(b);
    await b.engine.ingestHeads(
      [a.engine.snapshot().outbox[0].head],
      a.repository.blobs,
      authority,
    );
    await b.engine.applyRevision(root, authority);
    a.edit("note.md", "left");
    b.edit("note.md", "right");
    const left = await a.engine.checkpoint(),
      right = await b.engine.checkpoint();
    await a.engine.ingestHeads(
      [b.engine.snapshot().outbox.at(-1)!.head],
      b.repository.blobs,
      authority,
    );
    const plan = await a.engine.reconciliation(authority);
    expect(plan).toMatchObject({
      kind: "merge-required",
      baseRevisionId: root,
      leftRevisionId: left!.id,
      rightRevisionId: right!.id,
    });
    expect(plan.tips).toHaveLength(2);
    await expect(a.engine.applyRevision(right!.id, authority)).rejects.toThrow(
      "clean ancestry",
    );
    expect(new TextDecoder().decode(a.files.get("note.md")!.bytes)).toBe(
      "left",
    );
  });

  it("keeps unrelated roots explicit and removes revoked tips from current planning", async () => {
    const a = await createEngineHarness({ "a.md": "a" }, 5),
      b = await createEngineHarness({ "b.md": "b" }, 6);
    await a.engine.checkpoint();
    await b.engine.checkpoint();
    const authority = fixtureIncomingAuthority([
      a.options.crypto.publicKey,
      b.options.crypto.publicKey,
    ]);
    await a.engine.ingestHeads(
      [b.engine.snapshot().outbox[0].head],
      b.repository.blobs,
      authority,
    );
    expect((await a.engine.reconciliation(authority)).kind).toBe("unrelated");
    expect(
      (
        await a.engine.reconciliation(
          fixtureIncomingAuthority([a.options.crypto.publicKey]),
        )
      ).kind,
    ).toBe("clean");
    expect(Object.keys(a.engine.snapshot().revisions)).toHaveLength(2);
  });

  it("allows local checkpoints while incoming downloads are blocked without overwriting their outbox", async () => {
    const peer = await createEngineHarness({ "peer.md": "peer" }, 5),
      local = await createEngineHarness();
    await peer.engine.checkpoint();
    let release!: () => void, started!: () => void;
    const block = new Promise<void>((resolve) => {
      release = resolve;
    });
    const downloading = new Promise<void>((resolve) => {
      started = resolve;
    });
    const source = {
      ...peer.repository.blobs,
      async get(hash: string) {
        started();
        await block;
        return peer.repository.blobs.get(hash);
      },
    };
    const authority = fixtureIncomingAuthority([
      peer.options.crypto.publicKey,
      local.options.crypto.publicKey,
    ]);
    const incoming = local.engine.ingestHeads(
      [peer.engine.snapshot().outbox[0].head],
      source,
      authority,
    );
    await downloading;
    local.edit("local.md", "local");
    const checkpoint = local.engine.checkpoint();
    try {
      await vi.waitFor(() =>
        expect(local.engine.snapshot().outbox).toHaveLength(1),
      );
    } finally {
      release();
    }
    const created = await checkpoint;
    await incoming;
    expect(local.engine.snapshot().localRevisionId).toBe(created!.id);
    expect(local.engine.snapshot().outbox).toHaveLength(1);
    expect(Object.keys(local.engine.snapshot().revisions)).toHaveLength(2);
  });

  it.each(["membershipGeneration", "epoch"] as const)(
    "preserves prior history if %s changes during incoming authentication",
    async (field) => {
      const peer = await createEngineHarness({ "peer.md": "peer" }, 5),
        local = await createEngineHarness();
      await peer.engine.checkpoint();
      const policy = fixtureIncomingAuthority([peer.options.crypto.publicKey]);
      const authorize = policy.authorize;
      policy.authorize = async (record, context) => {
        const accepted = await authorize(record, context);
        local.authority[field] = 2;
        return accepted;
      };
      await expect(
        local.engine.ingestHeads(
          [peer.engine.snapshot().outbox[0].head],
          peer.repository.blobs,
          policy,
        ),
      ).rejects.toThrow("authority changed");
      expect(local.engine.snapshot().heads).toEqual({});
      expect(local.repository.record).toBeNull();
    },
  );
});
