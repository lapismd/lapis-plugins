import { describe, expect, it } from "vitest";
import {
  createEngineHarness,
  reopenEngine,
} from "../../test-support/engine-harness";
import {
  fixtureIncomingAuthority,
  installFixtureApply,
} from "../../test-support/reconciliation-harness";

async function connected(seed: Record<string, string> = { "note.md": "peer" }) {
  const peer = await createEngineHarness(seed, 5),
    local = await createEngineHarness();
  const revision = await peer.engine.checkpoint();
  const authority = fixtureIncomingAuthority([
    peer.options.crypto.publicKey,
    local.options.crypto.publicKey,
  ]);
  const target = installFixtureApply(local);
  await local.engine.ingestHeads(
    [peer.engine.snapshot().outbox.at(-1)!.head],
    peer.repository.blobs,
    authority,
  );
  return { peer, local, target, authority, revision: revision! };
}

describe("recoverable guarded apply", () => {
  it("supplies captured authority for host mutation and durable receipt recovery", async () => {
    const { local, target, authority, revision } = await connected();
    const apply = local.options.vault.apply!;
    const expected = {
      vaultId: local.authority.vaultId,
      devicePublicKey: local.authority.devicePublicKey,
      epoch: local.authority.epoch,
      membershipGeneration: local.authority.membershipGeneration,
    };
    let recoveries = 0,
      mutations = 0;
    local.options.vault = {
      ...local.options.vault,
      apply: {
        async receipt(id, ...rest: unknown[]) {
          expect(rest[0]).toEqual(expected);
          recoveries++;
          return apply.receipt(id);
        },
        async mutate(operation, source, ...rest: unknown[]) {
          expect(rest[0]).toEqual(expected);
          mutations++;
          return apply.mutate(operation, source);
        },
      },
    };
    target.crashNextMutation();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Crash after host mutation");
    await (await reopenEngine(local)).resumeApply(authority);
    expect(recoveries).toBe(2);
    expect(mutations).toBe(1);
    expect(target.mutations).toBe(1);
  });

  it("preserves captured mutation authority when membership changes during receipt admission", async () => {
    const { local, target, authority, revision } = await connected();
    const apply = local.options.vault.apply!;
    local.options.vault = {
      ...local.options.vault,
      apply: {
        async receipt(id, ...rest: unknown[]) {
          const fence = rest[0] as { membershipGeneration: number } | undefined;
          expect(fence?.membershipGeneration).toBe(
            local.authority.membershipGeneration,
          );
          const result = await apply.receipt(id);
          local.authority.membershipGeneration++;
          return result;
        },
        async mutate(operation, source, ...rest: unknown[]) {
          const fence = rest[0] as { membershipGeneration: number } | undefined;
          if (
            !fence ||
            fence.membershipGeneration !== local.authority.membershipGeneration
          ) {
            await source?.cancel();
            throw new Error("Host rejected stale captured mutation authority");
          }
          return apply.mutate(operation, source);
        },
      },
    };
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Host rejected stale captured mutation authority");
    expect(target.mutations).toBe(0);
    expect(local.files.size).toBe(0);
    expect(local.engine.snapshot().applyIntent).not.toBeNull();
    expect(local.engine.snapshot().appliedRevisionId).toBeNull();
  });

  it("isolates captured mutation authority from a provider changing its receipt arguments", async () => {
    const { local, target, authority, revision } = await connected();
    const apply = local.options.vault.apply!;
    local.options.vault = {
      ...local.options.vault,
      apply: {
        async receipt(id, ...rest: unknown[]) {
          const fence = rest[0] as { membershipGeneration: number };
          const result = await apply.receipt(id);
          fence.membershipGeneration = ++local.authority.membershipGeneration;
          return result;
        },
        async mutate(operation, source, ...rest: unknown[]) {
          const fence = rest[0] as { membershipGeneration: number };
          if (
            fence.membershipGeneration !== local.authority.membershipGeneration
          ) {
            await source?.cancel();
            throw new Error("Host rejected stale original mutation authority");
          }
          return apply.mutate(operation, source);
        },
      },
    };
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Host rejected stale original mutation authority");
    expect(target.mutations).toBe(0);
    expect(local.files.size).toBe(0);
    expect(local.engine.snapshot().applyIntent).not.toBeNull();
  });

  it("retains recovery intent if authority changes after a durable receipt before progress commit", async () => {
    const { local, target, authority, revision } = await connected();
    const apply = local.options.vault.apply!;
    local.options.vault = {
      ...local.options.vault,
      apply: {
        ...apply,
        async mutate(operation, source) {
          const result = await apply.mutate(operation, source);
          local.authority.membershipGeneration++;
          return result;
        },
      },
    };
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Endpoint authority changed before saving local history");
    expect(target.mutations).toBe(1);
    expect(local.engine.snapshot().applyIntent).not.toBeNull();
    expect(local.engine.snapshot().appliedRevisionId).toBeNull();
    await (await reopenEngine(local)).resumeApply(authority);
    expect(target.mutations).toBe(1);
  });
  it("treats prototype-shaped filenames as ordinary guarded file paths", async () => {
    const seed = Object.fromEntries([
      ["__proto__", "one"],
      ["constructor", "two"],
      ["toString", "three"],
    ]);
    const { local, authority, revision } = await connected(seed);
    await local.engine.applyRevision(revision.id, authority);
    expect([...local.files.keys()].sort()).toEqual(Object.keys(seed).sort());
    for (const [path, content] of Object.entries(seed))
      expect(new TextDecoder().decode(local.files.get(path)!.bytes)).toBe(
        content,
      );
    expect(local.engine.snapshot().applyIntent).toBeNull();
    expect(await (await reopenEngine(local)).checkpoint()).toBeNull();
  });

  it("recovers and removes prototype-shaped paths after durable state reopening", async () => {
    const { local, peer, target, authority, revision } = await connected(
      Object.fromEntries([
        ["__proto__", "keep"],
        ["constructor", "remove"],
      ]),
    );
    target.crashNextMutation();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Crash");
    const reopened = await reopenEngine(local);
    await reopened.resumeApply(authority);
    expect(target.mutations).toBe(2);
    peer.files.delete("constructor");
    peer.edit("__proto__", "updated");
    const changed = await peer.engine.checkpoint();
    await reopened.ingestHeads(
      [peer.engine.snapshot().outbox.at(-1)!.head],
      peer.repository.blobs,
      authority,
    );
    await reopened.applyRevision(changed!.id, authority);
    expect([...local.files.keys()]).toEqual(["__proto__"]);
    expect(new TextDecoder().decode(local.files.get("__proto__")!.bytes)).toBe(
      "updated",
    );
    expect(await (await reopenEngine(local)).checkpoint()).toBeNull();
  });

  it("retains the intent when a host receipt names a different operation", async () => {
    const { local, target, authority, revision } = await connected();
    const mutate = local.options.vault.apply!.mutate;
    local.options.vault = {
      ...local.options.vault,
      apply: {
        ...local.options.vault.apply!,
        async mutate(operation, source) {
          const receipt = await mutate(operation, source);
          receipt.operation.path = "another.md";
          return receipt;
        },
      },
    };
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("receipt does not match");
    expect(local.engine.snapshot().appliedRevisionId).toBeNull();
    expect(local.engine.snapshot().applyIntent).not.toBeNull();
    // Recovery can use the actual durable receipt without rewriting the file.
    const reopened = await reopenEngine(local);
    await reopened.resumeApply(authority);
    expect(target.mutations).toBe(1);
    expect(reopened.snapshot().appliedRevisionId).toBe(revision.id);
  });

  it("fast-forwards an empty vault without authoring a duplicate revision", async () => {
    const { local, target, authority, revision } = await connected();
    await local.engine.applyRevision(revision.id, authority);
    expect(new TextDecoder().decode(local.files.get("note.md")!.bytes)).toBe(
      "peer",
    );
    expect(local.engine.snapshot().appliedRevisionId).toBe(revision.id);
    expect(local.engine.snapshot().outbox).toHaveLength(0);
    expect(local.engine.snapshot().applyIntent).toBeNull();
    expect(await local.engine.checkpoint()).toBeNull();
    expect(target.mutations).toBe(1);
    expect((await reopenEngine(local)).snapshot()).toEqual(
      local.engine.snapshot(),
    );
  });

  it("recovers a mutation whose host receipt survived before local progress", async () => {
    const { local, target, authority, revision } = await connected({
      "a.md": "one",
      "b.md": "two",
    });
    target.crashNextMutation();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Crash after host mutation");
    expect(local.engine.snapshot().appliedRevisionId).toBeNull();
    expect(local.engine.snapshot().applyIntent).not.toBeNull();
    const reopened = await reopenEngine(local);
    await reopened.resumeApply(authority);
    expect(target.mutations).toBe(2);
    expect(reopened.snapshot().appliedRevisionId).toBe(revision.id);
    expect(reopened.snapshot().applyIntent).toBeNull();
  });

  it("retains an encrypted intent after local progress persistence fails", async () => {
    const { local, target, authority, revision } = await connected();
    target.failNextProgressCommit();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Disk unavailable");
    expect(local.persistedText()).not.toContain("note.md");
    local.repository.failCommit = false;
    const reopened = await reopenEngine(local);
    await reopened.resumeApply(authority);
    expect(target.mutations).toBe(1);
    expect(reopened.snapshot().appliedRevisionId).toBe(revision.id);
  });

  it("preserves a file edited after an unrecorded mutation and blocks false applied state", async () => {
    const { local, target, authority, revision } = await connected();
    target.crashNextMutation();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Crash");
    local.edit("note.md", "new user content");
    const reopened = await reopenEngine(local);
    await expect(reopened.resumeApply(authority)).rejects.toThrow(
      "File changed after apply",
    );
    expect(new TextDecoder().decode(local.files.get("note.md")!.bytes)).toBe(
      "new user content",
    );
    expect(reopened.snapshot().appliedRevisionId).toBeNull();
    expect(reopened.snapshot().applyIntent).not.toBeNull();
    await expect(reopened.checkpoint()).rejects.toThrow("pending apply");
  });

  it("does not turn an unrelated populated vault into deletions", async () => {
    const { local, target, authority, revision } = await connected();
    local.edit("local-only.md", "keep");
    expect((await local.engine.reconciliation(authority)).kind).toBe(
      "local-changes",
    );
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("clean ancestry");
    expect(target.mutations).toBe(0);
    expect(local.files.has("local-only.md")).toBe(true);
  });

  it("rejects resume when membership authority no longer permits the revision", async () => {
    const { local, target, authority, revision } = await connected();
    target.crashNextMutation();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Crash");
    await expect(
      (await reopenEngine(local)).resumeApply({
        ...authority,
        authorize: async () => false,
      }),
    ).rejects.toThrow("not authorized");
    expect(target.mutations).toBe(1);
  });

  it("applies rename, binary replacement and deletion while preserving file identity", async () => {
    const { peer, local, target, authority, revision } = await connected({
      "old.md": "one",
      "gone.md": "remove",
      "image.bin": "old",
    });
    await local.engine.applyRevision(revision.id, authority);
    const original = peer.files.get("old.md")!;
    peer.files.delete("old.md");
    peer.files.set("renamed.md", original);
    peer.files.delete("gone.md");
    peer.files.set("image.bin", {
      ...peer.files.get("image.bin")!,
      bytes: new Uint8Array([0, 255, 2]),
      contentGeneration: 2,
    });
    const changed = await peer.engine.checkpoint();
    await local.engine.ingestHeads(
      [peer.engine.snapshot().outbox.at(-1)!.head],
      peer.repository.blobs,
      authority,
    );
    await local.engine.applyRevision(changed!.id, authority);
    expect(local.files.has("old.md")).toBe(false);
    expect(local.files.has("gone.md")).toBe(false);
    expect(local.files.get("renamed.md")!.fileId).toBe(original.fileId);
    expect(local.files.get("image.bin")!.bytes).toEqual(
      new Uint8Array([0, 255, 2]),
    );
    expect(await local.engine.checkpoint()).toBeNull();
  });

  it("does not persist intent or mutate files if intent durability fails", async () => {
    const { local, target, authority, revision } = await connected();
    local.repository.failCommit = true;
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Disk unavailable");
    expect(local.engine.snapshot().applyIntent).toBeNull();
    expect(target.mutations).toBe(0);
    expect(local.files.size).toBe(0);
  });

  it("rejects extra files appearing during apply instead of claiming the target root", async () => {
    const { local, target, authority, revision } = await connected();
    target.crashNextMutation();
    await expect(
      local.engine.applyRevision(revision.id, authority),
    ).rejects.toThrow("Crash");
    local.edit("new-local.md", "keep me");
    const reopened = await reopenEngine(local);
    await expect(reopened.resumeApply(authority)).rejects.toThrow(
      "Vault changed during apply",
    );
    expect(local.files.has("new-local.md")).toBe(true);
    expect(reopened.snapshot().appliedRevisionId).toBeNull();
  });
});
