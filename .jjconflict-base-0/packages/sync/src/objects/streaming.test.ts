// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import type {
  SyncCryptoObjectType,
  UnsignedSyncEvent,
} from "../protocol/crypto-types.js";
import { describe, expect, it } from "vitest";
import { MAX_BUFFERED_SYNC_BYTES } from "../protocol/constants.js";
import { sha256Hex } from "../protocol/bytes.js";
import type { SyncCryptoProvider } from "../protocol/crypto-provider.js";
import type {
  BlobRef,
  BlobStore,
  SignedNostrEvent,
} from "../protocol/types.js";
import { buildObjectGraphFromStreams } from "./object-graph";
import { chunkPlaintextStream } from "./manifests";

describe("streamed object graphs", () => {
  it("processes a synthetic 3 GiB source without retaining or exceeding the 64 MiB bound", async () => {
    const sourceChunkBytes = 1024 * 1024;
    const sourceChunks = 3 * 1024;
    let emitted = 0;
    const crypto = new CountingCrypto();
    const blobs = new NonRetainingBlobStore();
    const graph = await buildObjectGraphFromStreams({
      files: [
        {
          path: "large.bin",
          fileId: "large-file",
          contentGeneration: 1,
          openRead: async () =>
            new ReadableStream<Uint8Array>({
              pull(controller) {
                if (emitted >= sourceChunks) {
                  controller.close();
                  return;
                }
                const chunk = new Uint8Array(sourceChunkBytes);
                chunk[0] = emitted & 0xff;
                emitted += 1;
                controller.enqueue(chunk);
              },
            }),
        },
      ],
      crypto,
      epoch: 1,
      blobs,
    });
    expect(emitted * sourceChunkBytes).toBe(3 * 1024 * 1024 * 1024);
    expect(graph.rootHash).toBeTruthy();
    expect(
      crypto.maxPlaintextBytes + blobs.maxCiphertextBytes,
    ).toBeLessThanOrEqual(MAX_BUFFERED_SYNC_BYTES);
    expect(blobs.retainedBytes).toBe(0);
  }, 120_000);

  it("rejects an oversized host stream chunk before it can exceed the memory envelope", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(32 * 1024 * 1024 + 1));
        controller.close();
      },
    });
    await expect(async () => {
      for await (const _chunk of chunkPlaintextStream(stream)) {
        // The source contract is rejected before a content chunk can be emitted.
      }
    }).rejects.toThrow("streaming safety limit");
  });
});

class CountingCrypto implements SyncCryptoProvider {
  readonly publicKey = "00".repeat(32);
  readonly syncPublicKey = "00".repeat(32);
  maxPlaintextBytes = 0;

  async encryptObject(input: {
    epoch: number;
    type: SyncCryptoObjectType;
    plaintext: Uint8Array;
  }) {
    this.maxPlaintextBytes = Math.max(
      this.maxPlaintextBytes,
      input.plaintext.byteLength,
    );
    const bytes = new Uint8Array(64);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, input.plaintext.byteLength);
    bytes[4] = objectTypeTag(input.type);
    return { bytes, objectHash: sha256Hex(bytes) };
  }

  async decryptObject(): Promise<Uint8Array> {
    throw new Error("unused");
  }

  async calculateContentId(input: {
    epoch: number;
    plaintext: Uint8Array;
  }): Promise<string> {
    this.maxPlaintextBytes = Math.max(
      this.maxPlaintextBytes,
      input.plaintext.byteLength,
    );
    return `content-${input.plaintext.byteLength}`;
  }

  signDeviceEvent(event: UnsignedSyncEvent) {
    return this.signEvent(event);
  }
  signTransportEvent(event: UnsignedSyncEvent) {
    return this.signEvent(event);
  }

  async signEvent(_event: UnsignedSyncEvent): Promise<SignedNostrEvent> {
    throw new Error("unused");
  }
}

class NonRetainingBlobStore implements BlobStore {
  maxCiphertextBytes = 0;
  retainedBytes = 0;

  async has(): Promise<boolean> {
    return false;
  }

  async put(bytes: Uint8Array): Promise<BlobRef> {
    this.maxCiphertextBytes = Math.max(
      this.maxCiphertextBytes,
      bytes.byteLength,
    );
    return { hash: sha256Hex(bytes), size: bytes.byteLength };
  }

  async get(): Promise<Uint8Array> {
    throw new Error("non-retaining store");
  }
}

function objectTypeTag(type: SyncCryptoObjectType): number {
  return [
    "file-content",
    "file-manifest",
    "tree-manifest",
    "revision-payload",
    "revision-archive",
    "head-payload",
    "membership-payload",
    "local-state",
  ].indexOf(type);
}
