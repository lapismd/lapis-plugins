import { canonicalize } from "../protocol/canonical-json.js";
import {
  PROTOCOL_VERSION,
  REVISION_SCHEMA_VERSION,
} from "../protocol/constants.js";
import { sha256Hex } from "../protocol/bytes.js";
import {
  signHeadEvent,
  signRevisionEvent,
  type RevisionPayload,
} from "../protocol/revision.js";
import {
  buildObjectGraphFromStreams,
  collectReachableObjectHashes,
  isIgnoredPath,
} from "../objects/object-graph.js";
import {
  diffFileIdentities,
  type CheckpointOptions,
  type LocalEngineOptions,
  type LocalEngineState,
  type LocalEndpointAuthority,
  type SyncPublicationDestination,
} from "./contracts.js";
import {
  emptyLocalState,
  readLocalState,
  requireAuthority,
  writeLocalState,
} from "./local-state.js";
import type { BlobStore, SignedNostrEvent } from "../protocol/types.js";
import type {
  ReconciliationPlan,
  SyncIncomingAuthority,
} from "./incoming-contracts.js";
import { ingestIncomingHeads } from "./incoming-reader.js";
import { reconciliationPlan } from "./reconciliation.js";
import { createApplyIntent, resumeGuardedApply } from "./guarded-apply.js";
import { compareReplaceableEvents } from "../protocol/replaceable.js";

/** Network-independent history. Mutable/decrypted state never crosses repository APIs. */
export class LocalSyncEngine {
  #tail: Promise<unknown> = Promise.resolve();
  #listeners = new Set<() => void>();
  #disposed = false;
  #drainFlight: Promise<{ pending: number }> | null = null;
  #incoming = new Set<Promise<void>>();
  private constructor(
    private readonly options: LocalEngineOptions,
    private state: LocalEngineState,
    private version: number,
  ) {}

  static async open(options: LocalEngineOptions): Promise<LocalSyncEngine> {
    const { state, version } = await readLocalState(options);
    return new LocalSyncEngine(options, state, version);
  }

  snapshot(): LocalEngineState {
    return structuredClone(this.state);
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  checkpoint(input: CheckpointOptions = {}) {
    return this.serial(async () => {
      if (this.state.applyIntent)
        throw new Error(
          "Resume or review the pending apply before checkpointing",
        );
      const authority = await requireAuthority(this.options);
      await this.options.vault.flushOpenEditor();
      const files = (await this.options.vault.list()).filter(
        (file) => !isIgnoredPath(file.path),
      );
      const built = await buildObjectGraphFromStreams({
        files,
        previous: this.state.index,
        crypto: this.options.crypto,
        epoch: authority.epoch,
        blobs: this.options.repository.blobs,
      });
      const signature = (entries: typeof files) =>
        canonicalize(
          entries
            .map(({ path, fileId, contentGeneration }) => ({
              path,
              fileId,
              contentGeneration,
            }))
            .sort((a, b) => a.path.localeCompare(b.path)),
        );
      const latest = (await this.options.vault.list()).filter(
        (file) => !isIgnoredPath(file.path),
      );
      if (signature(files) !== signature(latest))
        throw new Error(
          "Vault changed while creating the snapshot; retry checkpoint",
        );
      const changes = diffFileIdentities(this.state.index, built.index);
      if (this.state.localRevisionId && changes.length === 0 && !input.parents)
        return null;
      const parent = this.state.localRevisionId
        ? this.state.revisions[this.state.localRevisionId]
        : null;
      const payload: RevisionPayload = {
        schemaVersion: REVISION_SCHEMA_VERSION,
        vaultId: this.options.vaultId,
        keyEpoch: authority.epoch,
        currentEpoch: authority.epoch,
        membershipGeneration: authority.membershipGeneration,
        parents:
          input.parents ??
          (parent
            ? [{ eventId: parent.event.id, archiveHash: parent.archiveHash }]
            : []),
        root: built.rootHash,
        changes,
        message: input.message ?? "Checkpoint",
        reason: input.reason ?? "checkpoint",
        client: { protocolVersion: PROTOCOL_VERSION },
      };
      for (const reference of payload.parents) {
        if (
          this.state.revisions[reference.eventId]?.archiveHash !==
          reference.archiveHash
        )
          throw new Error(
            "Checkpoint parent is not a locally validated revision",
          );
      }
      const createdAt = Math.max(
        Math.floor((this.options.now?.() ?? Date.now()) / 1000),
        this.state.lastCreatedAt + 1,
      );
      const event = await signRevisionEvent({
        crypto: this.options.crypto,
        vaultId: this.options.vaultId,
        payload,
        createdAt,
      });
      const archive = await this.options.crypto.encryptObject({
        epoch: authority.epoch,
        type: "revision-archive",
        plaintext: new TextEncoder().encode(canonicalize(event)),
      });
      const stored = await this.options.repository.blobs.put(archive.bytes);
      if (
        stored.hash !== archive.objectHash ||
        sha256Hex(archive.bytes) !== stored.hash
      )
        throw new Error("Local archive hash mismatch");
      const head = await signHeadEvent({
        crypto: this.options.crypto,
        vaultId: this.options.vaultId,
        createdAt,
        payload: {
          schemaVersion: REVISION_SCHEMA_VERSION,
          vaultId: this.options.vaultId,
          revisionEventId: event.id,
          revisionArchiveHash: stored.hash,
          root: payload.root,
          keyEpoch: authority.epoch,
          currentEpoch: authority.epoch,
          membershipGeneration: authority.membershipGeneration,
        },
      });
      const hashes = await collectReachableObjectHashes({
        rootHash: payload.root,
        epoch: authority.epoch,
        blobs: this.options.repository.blobs,
        crypto: this.options.crypto,
      });
      hashes.add(stored.hash);
      const next = this.snapshot();
      next.revisions[event.id] = { event, archiveHash: stored.hash, payload };
      next.outbox.push({
        revisionEventId: event.id,
        head,
        objectHashes: [...hashes],
        expectedHeadEventId:
          next.outbox.at(-1)?.head.id ?? next.publishedHeadEventId,
      });
      next.index = { ...built.index, revisionEventId: event.id };
      next.localRevisionId = event.id;
      next.appliedRevisionId = event.id;
      next.lastCreatedAt = createdAt;
      const current = await requireAuthority(this.options);
      if (
        current.epoch !== authority.epoch ||
        current.membershipGeneration !== authority.membershipGeneration
      )
        throw new Error("Endpoint authority changed during checkpoint");
      await this.commit(next, authority);
      return structuredClone(event);
    });
  }

  ingestHeads(
    heads: SignedNostrEvent[],
    source: BlobStore,
    policy: SyncIncomingAuthority,
  ): Promise<void> {
    if (this.#disposed)
      return Promise.reject(new Error("Sync runtime is disposed"));
    const flight = (async () => {
      const authority = await requireAuthority(this.options);
      const incoming = await ingestIncomingHeads(
        this.options,
        this.snapshot(),
        structuredClone(heads),
        source,
        policy,
      );
      await this.serial(async () => {
        const next = this.snapshot();
        for (const [id, revision] of Object.entries(incoming.revisions)) {
          if (next.revisions[id]) {
            if (
              canonicalize(next.revisions[id].event) !==
              canonicalize(revision.event)
            )
              throw new Error("Conflicting archive record");
            continue;
          }
          next.revisions[id] = revision;
        }
        for (const [address, head] of Object.entries(incoming.heads))
          if (
            !next.heads[address] ||
            compareReplaceableEvents(head.event, next.heads[address].event) < 0
          )
            next.heads[address] = head;
        await this.commit(next, authority);
      });
    })();
    this.#incoming.add(flight);
    void flight.then(
      () => this.#incoming.delete(flight),
      () => this.#incoming.delete(flight),
    );
    return flight;
  }

  async reconciliation(
    policy: SyncIncomingAuthority,
  ): Promise<ReconciliationPlan> {
    if (this.#disposed) throw new Error("Sync runtime is disposed");
    await requireAuthority(this.options);
    if (this.state.applyIntent)
      throw new Error(
        "Resume or review the pending apply before reconciliation",
      );
    return reconciliationPlan(
      this.snapshot(),
      await this.options.vault.list(),
      policy,
    );
  }

  applyRevision(
    revisionId: string,
    policy: SyncIncomingAuthority,
  ): Promise<void> {
    return this.serial(async () => {
      const authority = await requireAuthority(this.options);
      if (this.state.applyIntent)
        throw new Error("Resume the existing apply before planning another");
      const plan = await reconciliationPlan(
        this.snapshot(),
        await this.options.vault.list(),
        policy,
      );
      if (plan.kind !== "fast-forward" || plan.targetRevisionId !== revisionId)
        throw new Error("Apply requires a clean ancestry-based fast-forward");
      const next = this.snapshot();
      next.applyIntent = await createApplyIntent(
        this.options,
        next,
        revisionId,
      );
      await this.commit(next, authority);
      await resumeGuardedApply(
        this.options,
        this.snapshot(),
        (state, expected) => this.commit(state, expected),
        policy,
      );
    });
  }

  resumeApply(policy: SyncIncomingAuthority): Promise<void> {
    return this.serial(async () => {
      await requireAuthority(this.options);
      await this.options.vault.flushOpenEditor();
      await resumeGuardedApply(
        this.options,
        this.snapshot(),
        (state, expected) => this.commit(state, expected),
        policy,
      );
    });
  }

  drain(destination: SyncPublicationDestination): Promise<{ pending: number }> {
    if (this.#disposed)
      return Promise.reject(new Error("Sync runtime is disposed"));
    if (this.#drainFlight) return this.#drainFlight;
    this.#drainFlight = this.publishQueued(destination).finally(() => {
      this.#drainFlight = null;
    });
    return this.#drainFlight;
  }

  private async publishQueued(
    destination: SyncPublicationDestination,
  ): Promise<{ pending: number }> {
    await this.requirePublicationAuthority();
    while (this.state.outbox.length > 0) {
      // Network work uses immutable records without holding the local commit queue.
      const entry = structuredClone(this.state.outbox[0]);
      const event = structuredClone(
        this.state.revisions[entry.revisionEventId].event,
      );
      for (const hash of entry.objectHashes) {
        await this.requirePublicationAuthority();
        if (await destination.blobs.has(hash)) continue;
        const bytes = await this.options.repository.blobs.get(hash);
        if (sha256Hex(bytes) !== hash)
          throw new Error("Corrupt local outbox object");
        await this.requirePublicationAuthority();
        const stored = await destination.blobs.put(bytes);
        if (stored.hash !== hash || stored.size !== bytes.byteLength)
          throw new Error("Destination object integrity mismatch");
      }
      await this.requirePublicationAuthority();
      const receipt = await destination.publishRevision(event);
      requireReceipt(receipt);
      if (receipt.eventId !== entry.revisionEventId)
        throw new Error("Destination acknowledged a different revision");
      if (receipt.state === "staged") break;
      await this.requirePublicationAuthority();
      const headReceipt = await destination.publishHead(entry.head, {
        expectedHeadEventId: entry.expectedHeadEventId,
      });
      requireReceipt(headReceipt);
      if (headReceipt.eventId !== entry.head.id)
        throw new Error("Destination acknowledged a different HEAD");
      if (headReceipt.state === "staged") break;
      await this.serial(async () => {
        // A checkpoint may have appended work while the network request was pending.
        if (this.state.outbox[0]?.head.id !== entry.head.id)
          throw new Error(
            "Publication queue changed; reconcile before retrying",
          );
        const next = this.snapshot();
        next.publishedHeadEventId = entry.head.id;
        next.outbox.shift();
        await this.commit(next);
      });
    }
    return { pending: this.state.outbox.length };
  }

  private async requirePublicationAuthority(): Promise<void> {
    if (this.#disposed) throw new Error("Sync runtime is disposed");
    await requireAuthority(this.options);
  }

  async dispose(): Promise<void> {
    this.#disposed = true;
    this.#listeners.clear();
    await this.#tail.catch(() => undefined);
    await this.#drainFlight?.catch(() => undefined);
    await Promise.allSettled([...this.#incoming]);
    this.state = emptyLocalState(this.options);
  }

  private async commit(
    next: LocalEngineState,
    expected?: LocalEndpointAuthority,
  ): Promise<void> {
    this.version = await writeLocalState(
      this.options,
      this.version,
      next,
      expected,
    );
    this.state = next;
    for (const listener of this.#listeners) {
      try {
        listener();
      } catch {
        /* A UI listener cannot undo durable history. */
      }
    }
  }

  private serial<T>(operation: () => Promise<T>): Promise<T> {
    if (this.#disposed)
      return Promise.reject(new Error("Sync runtime is disposed"));
    const result = this.#tail.then(() => {
      if (this.#disposed) throw new Error("Sync runtime is disposed");
      return operation();
    });
    this.#tail = result.catch(() => undefined);
    return result;
  }
}

function requireReceipt(receipt: unknown): void {
  if (
    !receipt ||
    typeof receipt !== "object" ||
    !("state" in receipt) ||
    !["staged", "accepted", "applied"].includes(String(receipt.state))
  )
    throw new Error("Unsupported destination publication receipt");
}
