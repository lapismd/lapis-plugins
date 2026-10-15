import { isBusySyncStatus } from "./status";
import { validateSyncDestination } from "./settings";
import {
  createDisconnectedSnapshot,
  type SyncAction,
  type SyncRuntime,
  type SyncSettings,
  type SyncSnapshot,
} from "./types";

const CONTENT_ACTIONS = new Set([
  "checkpoint",
  "sync",
  "restore-file",
  "resolve-merge",
  "publish-merge",
  "begin-pairing",
  "revoke-device",
  "export-recovery",
  "apply-recovery",
]);
const OWNER_ACTIONS = new Set([
  "begin-pairing",
  "revoke-device",
  "export-recovery",
]);

/** One controlled presentation source. No keys or transport implementation live here. */
export class SyncSession {
  #listeners = new Set<() => void>();
  #unsubscribe: (() => void) | null = null;
  #busy = false;
  #error: string | null = null;
  #disposed = false;
  #abort = new AbortController();
  constructor(
    readonly runtime: SyncRuntime | null,
    readonly settings: () => Readonly<SyncSettings>,
  ) {
    this.#unsubscribe = runtime?.subscribe(() => this.notify()) ?? null;
  }
  snapshot(): SyncSnapshot {
    const next = structuredClone(
      this.runtime?.snapshot() ?? createDisconnectedSnapshot(),
    );
    if (
      next.security.state !== "unlocked" ||
      !next.security.encrypted ||
      !next.security.enrolled
    ) {
      next.revisions = [];
      next.changeSets = [];
      next.pendingFiles = [];
      next.mergeDraft = null;
      next.recoveryPreview = null;
      next.pendingChanges = 0;
      next.localRoot = null;
    }
    if (
      !this.settings().enabled &&
      (next.status === "idle-clean" || next.status === "idle-dirty")
    )
      next.status = "disabled";
    if (this.#error) {
      next.status = "error-recoverable";
      next.lastError = this.#error;
    }
    return next;
  }
  get busy(): boolean {
    return this.#busy || isBusySyncStatus(this.snapshot().status);
  }
  can(type: SyncAction["type"]): boolean {
    if (this.#disposed || this.busy || !this.runtime?.actions.includes(type))
      return false;
    const state = this.snapshot();
    if (
      CONTENT_ACTIONS.has(type) &&
      (!state.security.encrypted ||
        !state.security.enrolled ||
        state.security.state !== "unlocked")
    )
      return false;
    if (OWNER_ACTIONS.has(type) && state.security.role !== "owner")
      return false;
    if (type === "sync" || type === "publish-merge")
      return this.authorized() && this.settings().enabled;
    if (type === "test-connection")
      return validateSyncDestination(this.settings()) === null;
    if (type === "confirm-pairing")
      return state.pairing.stage === "sas" && state.pairing.session !== null;
    if (type === "apply-recovery") return state.recoveryPreview !== null;
    return true;
  }
  authorized(): boolean {
    const state = this.snapshot(),
      settings = this.settings();
    return (
      validateSyncDestination(settings) === null &&
      state.security.encrypted &&
      state.security.enrolled &&
      state.security.state === "unlocked" &&
      state.destination.authenticated &&
      state.destination.authorized &&
      state.destination.url === settings.serverUrl &&
      state.destination.managedVaultId === settings.managedVaultId
    );
  }
  async run(action: SyncAction): Promise<boolean> {
    if (!this.can(action.type)) {
      this.#error =
        "This action requires an available, authorized encrypted sync runtime.";
      this.notify();
      return false;
    }
    const draft = this.snapshot().mergeDraft;
    if (
      (action.type === "resolve-merge" || action.type === "publish-merge") &&
      (!draft || draft.id !== action.draftId)
    ) {
      this.#error =
        "This merge draft has changed. Review the current device histories.";
      this.notify();
      return false;
    }
    if (
      action.type === "resolve-merge" &&
      !draft?.conflicts.some((c) => c.id === action.conflictId)
    ) {
      this.#error = "This conflict is no longer in the merge draft.";
      this.notify();
      return false;
    }
    if (action.type === "confirm-pairing") {
      const current = this.snapshot().pairing.session;
      if (
        current?.sessionId !== action.sessionId ||
        current.sas !== action.sas
      ) {
        this.#error =
          "This pairing session changed. Review the current security code.";
        this.notify();
        return false;
      }
    }
    if (
      action.type === "revoke-device" &&
      (action.publicKey === this.snapshot().security.devicePublicKey ||
        !this.snapshot().devices.some(
          (d) => d.publicKey === action.publicKey && !d.revoked,
        ))
    ) {
      this.#error = "Choose another active device to revoke.";
      this.notify();
      return false;
    }
    if (
      action.type === "publish-merge" &&
      draft?.conflicts.some((c) => !draft.resolutions[c.id])
    ) {
      this.#error = "Resolve every conflict before publishing the merge.";
      this.notify();
      return false;
    }
    this.#busy = true;
    this.#error = null;
    this.notify();
    try {
      await this.runtime!.execute(
        action,
        { ...this.settings() },
        this.#abort.signal,
      );
      return !this.#disposed;
    } catch (error) {
      if (!this.#disposed)
        this.#error =
          error instanceof Error
            ? error.message
            : "Unable to complete the sync action.";
      return false;
    } finally {
      this.#busy = false;
      if (!this.#disposed) this.notify();
    }
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  notify(): void {
    if (!this.#disposed) for (const listener of this.#listeners) listener();
  }
  async dispose(): Promise<void> {
    this.#disposed = true;
    this.#abort.abort();
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#listeners.clear();
    await this.runtime?.dispose();
  }
}
