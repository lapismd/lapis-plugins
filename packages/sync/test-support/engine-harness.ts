import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";
import { finalizeEvent, getPublicKey } from "nostr-tools/pure";
import { LocalSyncEngine } from "../src/runtime/local-engine";
import type {
  LocalEndpointAuthority,
  LocalEngineOptions,
  LocalSyncRepository,
  SealedLocalState,
  SyncPublicationDestination,
} from "../src/runtime/contracts";
import type { SyncCryptoProvider } from "../src/protocol/crypto-provider";
import type { SyncCryptoObjectType } from "../src/protocol/crypto-types";
import { sha256Hex } from "../src/protocol/bytes";
import { verifySignedEvent } from "../src/protocol/event-signatures";
import type { SignedNostrEvent } from "../src/protocol/types";

const encoder = new TextEncoder();
const types: SyncCryptoObjectType[] = [
  "file-content",
  "file-manifest",
  "tree-manifest",
  "revision-payload",
  "revision-archive",
  "head-payload",
  "membership-payload",
  "local-state",
];

/** Test-only, wire-compatible key fixture. Never part of the published source tree. */
export function fixtureCrypto(deviceByte = 2): SyncCryptoProvider {
  const deviceSecret = new Uint8Array(32).fill(deviceByte);
  const syncSecret = new Uint8Array(32).fill(3);
  const vaultKey = new Uint8Array(32).fill(4);
  const key = (epoch: number, purpose: string) =>
    hkdf(
      sha256,
      vaultKey,
      undefined,
      encoder.encode(`lapis-sync-v1:${purpose}:epoch:${epoch}`),
      32,
    );
  const aad = (type: string) => encoder.encode(`lapis-sync-v1:${type}:1`);
  return {
    publicKey: getPublicKey(deviceSecret),
    syncPublicKey: getPublicKey(syncSecret),
    async encryptObject({ epoch, type, plaintext }) {
      const nonce = randomBytes(24);
      const encrypted = xchacha20poly1305(
        key(epoch, type),
        nonce,
        aad(type),
      ).encrypt(plaintext);
      const bytes = new Uint8Array(26 + encrypted.byteLength);
      bytes[0] = 1;
      bytes[1] = types.indexOf(type) + 1;
      bytes.set(nonce, 2);
      bytes.set(encrypted, 26);
      return { bytes, objectHash: sha256Hex(bytes) };
    },
    async decryptObject({ epoch, type, envelope }) {
      if (envelope[0] !== 1 || envelope[1] !== types.indexOf(type) + 1)
        throw new Error("Invalid encryption purpose");
      return xchacha20poly1305(
        key(epoch, type),
        envelope.slice(2, 26),
        aad(type),
      ).decrypt(envelope.slice(26));
    },
    async calculateContentId({ epoch, plaintext }) {
      return bytesToHex(hmac(sha256, key(epoch, "content-id"), plaintext));
    },
    async signEvent(event) {
      return finalizeEvent(event, deviceSecret);
    },
    async signDeviceEvent(event) {
      return finalizeEvent(event, deviceSecret);
    },
    async signTransportEvent(event) {
      return finalizeEvent(event, syncSecret);
    },
  };
}

export class FixtureRepository implements LocalSyncRepository {
  objects = new Map<string, Uint8Array>();
  record: SealedLocalState | null = null;
  failCommit = false;
  blobs = {
    has: async (hash: string) => this.objects.has(hash),
    put: async (bytes: Uint8Array) => {
      const hash = sha256Hex(bytes);
      this.objects.set(hash, bytes.slice());
      return { hash, size: bytes.byteLength };
    },
    get: async (hash: string) => {
      const bytes = this.objects.get(hash);
      if (!bytes) throw new Error("Missing object");
      return bytes.slice();
    },
  };
  async readState() {
    return structuredClone(this.record);
  }
  async compareAndSwap(expectedVersion: number, next: SealedLocalState) {
    if (this.failCommit) throw new Error("Disk unavailable");
    if ((this.record?.version ?? 0) !== expectedVersion) return false;
    this.record = structuredClone(next);
    return true;
  }
}

export class FixtureDestination implements SyncPublicationDestination {
  repository = new FixtureRepository();
  blobs = this.repository.blobs;
  events = new Map<string, SignedNostrEvent>();
  head: SignedNostrEvent | null = null;
  calls: Array<{ kind: string; id: string }> = [];
  staged = false;
  failAfterHead = false;
  offline = false;
  async publishRevision(event: SignedNostrEvent) {
    if (this.offline) throw new Error("Offline");
    verifySignedEvent(event);
    this.calls.push({ kind: "revision", id: event.id });
    this.events.set(event.id, structuredClone(event));
    return {
      eventId: event.id,
      state: this.staged ? ("staged" as const) : ("accepted" as const),
    };
  }
  async publishHead(
    event: SignedNostrEvent,
    { expectedHeadEventId }: { expectedHeadEventId: string | null },
  ) {
    verifySignedEvent(event);
    this.calls.push({ kind: "head", id: event.id });
    if (
      this.head?.id !== event.id &&
      (this.head?.id ?? null) !== expectedHeadEventId
    )
      throw new Error("HEAD precondition failed");
    this.head = structuredClone(event);
    this.events.set(event.id, structuredClone(event));
    if (this.failAfterHead) {
      this.failAfterHead = false;
      throw new Error("Lost HEAD response");
    }
    return { eventId: event.id, state: "accepted" as const };
  }
}

export async function createEngineHarness(
  seed: Record<string, string | Uint8Array> = {},
  deviceByte = 2,
) {
  const crypto = fixtureCrypto(deviceByte);
  const repository = new FixtureRepository();
  const files = new Map(
    Object.entries(seed).map(([path, content], index) => [
      path,
      {
        fileId: `file-${index}`,
        contentGeneration: 1,
        bytes: typeof content === "string" ? encoder.encode(content) : content,
      },
    ]),
  );
  const authority: LocalEndpointAuthority = {
    active: true,
    enrolled: true,
    unlocked: true,
    vaultId: "test-vault",
    devicePublicKey: crypto.publicKey,
    syncPublicKey: crypto.syncPublicKey,
    epoch: 1,
    membershipGeneration: 1,
  };
  const vault = {
    async flushOpenEditor() {},
    async list() {
      return [...files].map(([path, file]) => ({
        path,
        fileId: file.fileId,
        contentGeneration: file.contentGeneration,
        openRead: async () =>
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(file.bytes.slice());
              controller.close();
            },
          }),
      }));
    },
  };
  const options: LocalEngineOptions & { repository: FixtureRepository } = {
    vaultId: authority.vaultId,
    repository,
    vault,
    crypto,
    authority: async () => structuredClone(authority),
    now: () => 1_700_000_000_000,
  };
  const engine = await LocalSyncEngine.open(options);
  return {
    engine,
    options,
    files,
    authority,
    repository,
    persistedText: () =>
      [repository.record?.ciphertext, ...repository.objects.values()]
        .map((bytes) => new TextDecoder().decode(bytes))
        .join("\n"),
    edit(path: string, content: string) {
      const current = files.get(path);
      files.set(path, {
        fileId: current?.fileId ?? `file-${files.size}`,
        contentGeneration: (current?.contentGeneration ?? 0) + 1,
        bytes: encoder.encode(content),
      });
    },
  };
}
export function reopenEngine(
  harness: Awaited<ReturnType<typeof createEngineHarness>>,
) {
  return LocalSyncEngine.open(harness.options);
}
