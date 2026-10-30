import { describe, expect, it, vi } from "vitest";
import { LocalSyncEngine } from "./local-engine";
import {
  createEngineHarness,
  reopenEngine,
  FixtureDestination,
} from "../../test-support/engine-harness";

describe("durable encrypted checkpoints", () => {
  it("supplies captured endpoint authority to the durable host state commit", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    const commit = h.repository.compareAndSwap.bind(h.repository);
    const expected = {
      vaultId: h.authority.vaultId,
      devicePublicKey: h.authority.devicePublicKey,
      epoch: h.authority.epoch,
      membershipGeneration: h.authority.membershipGeneration,
    };
    const guarded = vi
      .spyOn(h.repository, "compareAndSwap")
      .mockImplementation(async (version, next, ...rest: unknown[]) => {
        expect(rest[0]).toEqual(expected);
        return commit(version, next);
      });
    expect(await h.engine.checkpoint()).not.toBeNull();
    expect(guarded).toHaveBeenCalledOnce();
    expect((await reopenEngine(h)).snapshot()).toEqual(h.engine.snapshot());
  });

  it.each(["epoch", "membershipGeneration"] as const)(
    "preserves the original %s fence when native commit admission is delayed",
    async (field) => {
      const h = await createEngineHarness({ "note.md": "one" });
      const commit = h.repository.compareAndSwap.bind(h.repository);
      vi.spyOn(h.repository, "compareAndSwap").mockImplementation(
        async (version, next, ...rest: unknown[]) => {
          const fence = rest[0] as
            | { epoch: number; membershipGeneration: number }
            | undefined;
          expect(fence).toBeDefined();
          h.authority[field]++;
          if (fence![field] !== h.authority[field])
            throw new Error("Host rejected stale captured state authority");
          return commit(version, next);
        },
      );
      await expect(h.engine.checkpoint()).rejects.toThrow(
        "Host rejected stale captured state authority",
      );
      expect(h.repository.record).toBeNull();
      expect(h.engine.snapshot().outbox).toEqual([]);
      expect(new TextDecoder().decode(h.files.get("note.md")!.bytes)).toBe(
        "one",
      );
    },
  );
  it("clears decrypted paths on dispose while retaining durable queued history", async () => {
    const h = await createEngineHarness({ "private-folder/note.md": "one" });
    await h.engine.checkpoint();
    const before = h.engine.snapshot();
    await h.engine.dispose();
    expect(h.engine.snapshot().index.treeHashes).toEqual({});
    expect(h.engine.snapshot().index.paths).toEqual({});
    expect(h.engine.snapshot().revisions).toEqual({});
    expect((await reopenEngine(h)).snapshot()).toEqual(before);
  });

  it("commits new offline history while an earlier publication is waiting on the network", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    await h.engine.checkpoint();
    const remote = new FixtureDestination();
    let release!: () => void, started!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const publishing = new Promise<void>((resolve) => {
      started = resolve;
    });
    const publish = remote.publishRevision.bind(remote);
    remote.publishRevision = async (event) => {
      started();
      await blocked;
      return publish(event);
    };
    const draining = h.engine.drain(remote);
    await publishing;
    h.edit("note.md", "two");
    const checkpoint = h.engine.checkpoint();
    try {
      await vi.waitFor(
        () => expect(h.engine.snapshot().outbox).toHaveLength(2),
        { timeout: 3000 },
      );
    } finally {
      release();
    }
    const second = await checkpoint;
    await draining;
    expect(h.engine.snapshot().localRevisionId).toBe(second!.id);
    expect(h.engine.snapshot().outbox).toHaveLength(0);
    expect(remote.events.size).toBe(4);
    expect((await reopenEngine(h)).snapshot()).toEqual(h.engine.snapshot());
  });

  it("creates offline history and reopens the exact signed outbox after restart", async () => {
    const harness = await createEngineHarness({
      "private-note.md": "secret note",
    });
    const revision = await harness.engine.checkpoint({
      message: "secret message",
    });
    expect(revision).not.toBeNull();
    const before = harness.engine.snapshot();
    const reopened = await reopenEngine(harness);
    expect(reopened.snapshot()).toEqual(before);
    expect(before.outbox).toHaveLength(1);
    expect(before.revisions[revision!.id].event).toEqual(revision);
    expect(harness.persistedText()).not.toContain("private-note.md");
    expect(harness.persistedText()).not.toContain("secret note");
    expect(harness.persistedText()).not.toContain("secret message");
    expect(LocalSyncEngine).toBeDefined();
  });

  it("publishes objects before revision and HEAD, retaining stable retry bytes", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    await h.engine.checkpoint();
    const saved = h.engine.snapshot();
    const remote = new FixtureDestination();
    const publish = remote.publishRevision.bind(remote);
    remote.publishRevision = async (event) => {
      for (const hash of saved.outbox[0].objectHashes)
        expect(await remote.blobs.has(hash)).toBe(true);
      return publish(event);
    };
    remote.failAfterHead = true;
    await expect(h.engine.drain(remote)).rejects.toThrow("Lost HEAD response");
    const reopened = await reopenEngine(h);
    expect(reopened.snapshot()).toEqual(saved);
    await expect(reopened.drain(remote)).resolves.toEqual({ pending: 0 });
    expect(remote.events.size).toBe(2);
    expect(remote.calls.map((call) => call.kind)).toEqual([
      "revision",
      "head",
      "revision",
      "head",
    ]);
    expect(remote.head).toEqual(saved.outbox[0].head);
    for (const [hash, bytes] of h.repository.objects)
      expect(await remote.blobs.get(hash)).toEqual(bytes);
  });

  it("keeps staged revisions pending and never publishes their HEAD", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    await h.engine.checkpoint();
    const remote = new FixtureDestination();
    remote.staged = true;
    expect(await h.engine.drain(remote)).toEqual({ pending: 1 });
    expect(remote.head).toBeNull();
    expect((await reopenEngine(h)).snapshot().outbox).toHaveLength(1);
    remote.staged = false;
    expect(await h.engine.drain(remote)).toEqual({ pending: 0 });
  });

  it("rejects competing writers without losing the first durable revision", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    const competing = await reopenEngine(h);
    const first = await h.engine.checkpoint();
    await expect(competing.checkpoint()).rejects.toThrow(
      "Local sync state changed",
    );
    const reopened = await reopenEngine(h);
    expect(reopened.snapshot().localRevisionId).toBe(first!.id);
    expect(reopened.snapshot().outbox).toHaveLength(1);
  });

  it("keeps history untouched on failed local persistence", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    h.repository.failCommit = true;
    await expect(h.engine.checkpoint()).rejects.toThrow("Disk unavailable");
    expect(h.engine.snapshot().outbox).toEqual([]);
    expect(h.repository.record).toBeNull();
    h.repository.failCommit = false;
    await h.engine.checkpoint();
    expect((await reopenEngine(h)).snapshot().outbox).toHaveLength(1);
  });

  it("fails before saving when an older host cannot encrypt the local-state purpose", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    const encrypt = h.options.crypto.encryptObject.bind(h.options.crypto);
    h.options.crypto.encryptObject = async (input) => {
      const encrypted = await encrypt(input);
      if (input.type === "local-state") encrypted.bytes[1] = 0;
      return encrypted;
    };
    await expect(h.engine.checkpoint()).rejects.toThrow(
      "Host does not support",
    );
    expect(h.repository.record).toBeNull();
    expect(h.engine.snapshot().outbox).toEqual([]);
  });

  it.each(["active", "enrolled", "unlocked"] as const)(
    "requires endpoint %s for checkpoint and publication",
    async (field) => {
      const h = await createEngineHarness({ "note.md": "one" });
      h.authority[field] = false;
      await expect(h.engine.checkpoint()).rejects.toThrow(
        /active, enrolled, unlocked/,
      );
      await expect(h.engine.drain(new FixtureDestination())).rejects.toThrow(
        /active, enrolled, unlocked/,
      );
      expect(h.repository.record).toBeNull();
    },
  );

  it("serializes checkpoints, keeps ancestry and suppresses unchanged snapshots", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    const [first, duplicate] = await Promise.all([
      h.engine.checkpoint(),
      h.engine.checkpoint(),
    ]);
    expect(duplicate).toBeNull();
    h.edit("note.md", "two");
    const second = await h.engine.checkpoint();
    const state = h.engine.snapshot();
    expect(state.revisions[second!.id].payload.parents).toEqual([
      {
        eventId: first!.id,
        archiveHash: state.revisions[first!.id].archiveHash,
      },
    ]);
    expect(state.outbox[1].expectedHeadEventId).toBe(state.outbox[0].head.id);
    expect(await h.engine.drain(new FixtureDestination())).toEqual({
      pending: 0,
    });
  });

  it("detects edits during snapshot before committing a stale checkpoint", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    const list = h.options.vault.list;
    let count = 0;
    h.options.vault.list = async () => {
      if (++count === 2) h.edit("note.md", "changed during read");
      return list();
    };
    await expect(h.engine.checkpoint()).rejects.toThrow("Vault changed");
    expect(h.repository.record).toBeNull();
    expect(h.engine.snapshot().localRevisionId).toBeNull();
  });

  it.each(["membershipGeneration", "epoch"] as const)(
    "rejects %s changes between checkpoint planning and persistence",
    async (field) => {
      const h = await createEngineHarness({ "note.md": "one" });
      const authority = h.options.authority;
      let reads = 0;
      h.options.authority = async () => {
        if (++reads === 3) h.authority[field] += 1;
        return authority();
      };
      await expect(h.engine.checkpoint()).rejects.toThrow("authority changed");
      expect(h.repository.record).toBeNull();
      expect(h.engine.snapshot().outbox).toHaveLength(0);
      expect(new TextDecoder().decode(h.files.get("note.md")!.bytes)).toBe(
        "one",
      );
    },
  );

  it.each(["membershipGeneration", "epoch"] as const)(
    "snapshots mutable authority before a %s change",
    async (field) => {
      const h = await createEngineHarness({ "note.md": "one" });
      let reads = 0;
      h.options.authority = async () => {
        if (++reads === 3) h.authority[field] += 1;
        return h.authority;
      };
      await expect(h.engine.checkpoint()).rejects.toThrow("authority changed");
      expect(h.repository.record).toBeNull();
      expect(h.engine.snapshot().outbox).toHaveLength(0);
    },
  );

  it("preserves rename identity and records deletes without inferring content matches", async () => {
    const h = await createEngineHarness({ "one.md": "same", "two.md": "same" });
    await h.engine.checkpoint();
    const file = h.files.get("one.md")!;
    h.files.delete("one.md");
    h.files.set("renamed.md", file);
    h.files.delete("two.md");
    const event = await h.engine.checkpoint();
    expect(h.engine.snapshot().revisions[event!.id].payload.changes).toEqual([
      { fileId: "file-0", operation: "rename" },
      { fileId: "file-1", operation: "delete" },
    ]);
  });

  it("rejects tampered encrypted local state", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    await h.engine.checkpoint();
    h.repository.record!.ciphertext[40] ^= 1;
    await expect(reopenEngine(h)).rejects.toThrow();
  });

  it("authenticates the durable version header against the sealed state", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    await h.engine.checkpoint();
    h.repository.record!.version += 1;
    await expect(reopenEngine(h)).rejects.toThrow(/version|belong/);
  });

  it("rejects an unsupported publication receipt before publishing HEAD", async () => {
    const h = await createEngineHarness({ "note.md": "one" });
    await h.engine.checkpoint();
    const remote = new FixtureDestination();
    remote.publishRevision = async (event) => ({
      eventId: event.id,
      state: "unknown" as "accepted",
    });
    await expect(h.engine.drain(remote)).rejects.toThrow(/receipt|acceptance/i);
    expect(remote.head).toBeNull();
    expect(h.engine.snapshot().outbox).toHaveLength(1);
  });

  it.each(["vaultId", "devicePublicKey"] as const)(
    "rejects local state substitution of %s",
    async (field) => {
      const h = await createEngineHarness({ "note.md": "one" });
      await h.engine.checkpoint();
      const state = h.engine.snapshot();
      state[field] = "another-endpoint";
      const encrypted = await h.options.crypto.encryptObject({
        epoch: 1,
        type: "local-state",
        plaintext: new TextEncoder().encode(
          JSON.stringify({
            version: h.repository.record!.version,
            epoch: 1,
            state,
          }),
        ),
      });
      h.repository.record!.ciphertext = encrypted.bytes;
      await expect(reopenEngine(h)).rejects.toThrow("does not belong");
    },
  );
});
