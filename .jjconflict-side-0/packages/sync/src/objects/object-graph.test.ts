import { describe, expect, it } from "vitest";
import originalFixture from "../../test-support/nostr-object-fixture.json";
import { hexToBytes } from "@noble/hashes/utils.js";
import {
  createEngineHarness,
  fixtureCrypto,
  FixtureRepository,
} from "../../test-support/engine-harness";
import {
  buildObjectGraph,
  buildObjectGraphFromStreams,
  emptyIndex,
  inspectObjectGraph,
  materialiseRootWithFileIds,
} from "./object-graph";
import {
  createTreeManifest,
  normalizeComponent,
  parseFileManifest,
} from "./manifests";

describe("encrypted object graph", () => {
  it("reads frozen encrypted objects emitted by the original Nostr Sync source", async () => {
    const repository = new FixtureRepository();
    for (const [hash, hex] of Object.entries(originalFixture.objects))
      repository.objects.set(hash, hexToBytes(hex));
    const read = await materialiseRootWithFileIds({
      rootHash: originalFixture.rootHash,
      epoch: 1,
      crypto: fixtureCrypto(),
      blobs: repository.blobs,
    });
    expect(Object.keys(read.snapshot).sort()).toEqual(
      Object.keys(originalFixture.expected).sort(),
    );
    for (const [path, expected] of Object.entries(originalFixture.expected)) {
      expect([...read.snapshot[path]]).toEqual(expected.bytes);
      expect(read.fileIds[path]).toBe(expected.fileId);
    }
  });

  it("captures a rename with an edit using explicit identity, without reusing old content", async () => {
    const crypto = fixtureCrypto(),
      repository = new FixtureRepository();
    const before = await buildObjectGraph({
      vault: { "old.md": new TextEncoder().encode("before") },
      fileIds: { "old.md": "stable" },
      epoch: 1,
      crypto,
      blobs: repository.blobs,
    });
    const after = await buildObjectGraph({
      vault: { "new.md": new TextEncoder().encode("after") },
      fileIds: { "new.md": "stable" },
      previous: before.index,
      epoch: 1,
      crypto,
      blobs: repository.blobs,
    });
    const read = await materialiseRootWithFileIds({
      rootHash: after.rootHash,
      epoch: 1,
      crypto,
      blobs: repository.blobs,
    });
    expect(read.fileIds["new.md"]).toBe("stable");
    expect(new TextDecoder().decode(read.snapshot["new.md"])).toBe("after");
  });

  it("keeps recreated file identity distinct even at the same path and bytes", async () => {
    const crypto = fixtureCrypto(),
      repository = new FixtureRepository();
    const vault = { "note.md": new TextEncoder().encode("same") };
    const before = await buildObjectGraph({
      vault,
      fileIds: { "note.md": "old-id" },
      epoch: 1,
      crypto,
      blobs: repository.blobs,
    });
    const after = await buildObjectGraph({
      vault,
      fileIds: { "note.md": "new-id" },
      previous: before.index,
      epoch: 1,
      crypto,
      blobs: repository.blobs,
    });
    expect(after.index.paths["note.md"].fileId).toBe("new-id");
    expect(after.index.paths["note.md"].fileManifestHash).not.toBe(
      before.index.paths["note.md"].fileManifestHash,
    );
  });

  it.each([
    "../escape.md",
    "/absolute.md",
    "a//b.md",
    "a\\b.md",
    "a/./b.md",
    "a/../b.md",
    "a\u0000.md",
  ])("rejects unsafe snapshot path %s", async (path) => {
    const h = await createEngineHarness({ [path]: "escape" });
    await expect(h.engine.checkpoint()).rejects.toThrow(/path|component/i);
    expect(h.repository.record).toBeNull();
  });

  it("rejects duplicate names even when they have the same spelling", () => {
    expect(() =>
      createTreeManifest([
        { name: "same", type: "file", object: "a", epoch: 1 },
        { name: "same", type: "tree", object: "b", epoch: 1 },
      ]),
    ).toThrow(/duplicate|collid/i);
  });

  it.each(["..", ".", "a\\b", "a\u0000b", "a/b"])(
    "rejects unsafe manifest name %s",
    (name) => {
      expect(() => normalizeComponent(name)).toThrow();
    },
  );

  it("rejects duplicate file identities", async () => {
    const h = await createEngineHarness({ "one.md": "one", "two.md": "two" });
    h.files.get("two.md")!.fileId = h.files.get("one.md")!.fileId;
    await expect(h.engine.checkpoint()).rejects.toThrow(/identity|file ID/i);
  });

  it("round trips nested files, empty files and binary content without uploading plaintext", async () => {
    const binary = Uint8Array.from([0, 255, 3, 0, 9]);
    const h = await createEngineHarness({
      "nested/note.md": "hello",
      "empty.md": "",
      "photo.bin": binary,
    });
    await h.engine.checkpoint();
    const rootHash = h.engine.snapshot().index.rootHash!;
    const read = await materialiseRootWithFileIds({
      rootHash,
      epoch: 1,
      crypto: h.options.crypto,
      blobs: h.repository.blobs,
    });
    expect(new TextDecoder().decode(read.snapshot["nested/note.md"])).toBe(
      "hello",
    );
    expect(read.snapshot["empty.md"]).toEqual(new Uint8Array());
    expect(read.snapshot["photo.bin"]).toEqual(binary);
    expect(read.fileIds["nested/note.md"]).toBe("file-0");
  });

  it("verifies ciphertext hashes before decryption", async () => {
    const h = await createEngineHarness({ "note.md": "hello" });
    await h.engine.checkpoint();
    const rootHash = h.engine.snapshot().index.rootHash!;
    h.repository.objects.get(rootHash)![30] ^= 1;
    await expect(
      inspectObjectGraph({
        rootHash,
        epoch: 1,
        crypto: h.options.crypto,
        blobs: h.repository.blobs,
      }),
    ).rejects.toThrow("Corrupt blob hash");
  });

  it("rejects invalid file sizes and chunk descriptions", () => {
    expect(() =>
      parseFileManifest({
        schemaVersion: 2,
        type: "file",
        fileId: "id",
        size: -1,
        content: { mode: "single", object: "a", epoch: 1 },
      }),
    ).toThrow(/size/i);
    expect(() =>
      parseFileManifest({
        schemaVersion: 2,
        type: "file",
        fileId: "id",
        size: 5,
        content: {
          mode: "chunks",
          algorithm: "other",
          minSize: 1,
          targetSize: 2,
          maxSize: 3,
          chunks: [{ object: "a", plainSize: 5, epoch: 1 }],
        },
      }),
    ).toThrow();
  });

  it("detects authenticated manifest/content size disagreement on streamed reads", async () => {
    const crypto = fixtureCrypto(),
      repository = new FixtureRepository();
    const content = await crypto.encryptObject({
      epoch: 1,
      type: "file-content",
      plaintext: new Uint8Array(2),
    });
    await repository.blobs.put(content.bytes);
    const file = await crypto.encryptObject({
      epoch: 1,
      type: "file-manifest",
      plaintext: new TextEncoder().encode(
        JSON.stringify({
          schemaVersion: 2,
          type: "file",
          fileId: "id",
          size: 1,
          content: { mode: "single", object: content.objectHash, epoch: 1 },
        }),
      ),
    });
    await repository.blobs.put(file.bytes);
    const tree = await crypto.encryptObject({
      epoch: 1,
      type: "tree-manifest",
      plaintext: new TextEncoder().encode(
        JSON.stringify({
          schemaVersion: 2,
          type: "tree",
          entries: [
            {
              name: "note.md",
              type: "file",
              fileId: "id",
              object: file.objectHash,
              epoch: 1,
            },
          ],
        }),
      ),
    });
    await repository.blobs.put(tree.bytes);
    const graph = await inspectObjectGraph({
      rootHash: tree.objectHash,
      epoch: 1,
      crypto,
      blobs: repository.blobs,
    });
    await expect(
      new Response(graph.files[0].openRead()).arrayBuffer(),
    ).rejects.toThrow(/size/i);
  });

  it("reuses unchanged object hashes and file identity after rename", async () => {
    const h = await createEngineHarness({ "note.md": "hello" });
    const first = await buildObjectGraphFromStreams({
      files: await h.options.vault.list(),
      previous: emptyIndex(),
      crypto: h.options.crypto,
      epoch: 1,
      blobs: h.repository.blobs,
    });
    const original = h.files.get("note.md")!;
    h.files.delete("note.md");
    h.files.set("renamed.md", original);
    const next = await buildObjectGraphFromStreams({
      files: await h.options.vault.list(),
      previous: first.index,
      crypto: h.options.crypto,
      epoch: 1,
      blobs: h.repository.blobs,
    });
    expect(next.index.paths["renamed.md"].fileManifestHash).toBe(
      first.index.paths["note.md"].fileManifestHash,
    );
    expect(next.index.paths["renamed.md"].fileId).toBe("file-0");
  });
});
