import { validateSyncDestination, validateSyncServerUrl } from "./settings";
import {
  createDisconnectedSnapshot,
  type SyncAction,
  type ManagedVault,
  type SyncRuntime,
  type SyncSettings,
  type SyncSnapshot,
} from "./types";

export type ServerConnectionOptions = {
  /** Host-owned account transport. Credentials remain outside plugin settings. */
  request?: typeof fetch;
  /** Explicit private development policy; HTTPS remains the default. */
  allowLoopbackHttp?: boolean;
  timeoutMs?: number;
};

class ConnectionError extends Error {
  constructor(
    message: string,
    readonly status: "error" | "offline" = "error",
    readonly authenticated = false,
  ) {
    super(message);
  }
}

/** Only checks access. Enrollment and every content operation remain unavailable. */
export class ServerConnectionRuntime implements SyncRuntime {
  readonly actions = ["test-connection"] as const;
  #state = createDisconnectedSnapshot();
  #listeners = new Set<() => void>();
  #abort = new AbortController();
  #disposed = false;
  constructor(readonly options: ServerConnectionOptions = {}) {}
  invalidateConnection(): void {
    this.#abort.abort();
    this.#abort = new AbortController();
    this.#state.destination = createDisconnectedSnapshot().destination;
    this.#notify();
  }
  snapshot(): SyncSnapshot {
    return structuredClone(this.#state);
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #notify(): void {
    if (!this.#disposed) for (const listener of this.#listeners) listener();
  }
  async #query<T = Record<string, unknown>>(
    base: URL,
    procedure: string,
    signal: AbortSignal,
    input?: unknown,
  ): Promise<T> {
    const url = new URL(
      `${base.pathname.replace(/\/$/, "")}/api/trpc/${procedure}`,
      base,
    );
    if (input !== undefined)
      url.searchParams.set("input", JSON.stringify(input));
    const response = await (this.options.request ?? globalThis.fetch)(
      url.href,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        redirect: "error",
        signal,
        headers: { Accept: "application/json" },
      },
    );
    signal.throwIfAborted();
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401)
        throw new ConnectionError(
          "Sign in to the configured Lapis Server, then test the connection again.",
        );
      if (response.status === 403)
        throw new ConnectionError(
          "This account does not have access to the managed vault.",
          "error",
          true,
        );
      if (response.status >= 500)
        throw new ConnectionError(
          `Lapis Server is unavailable (HTTP ${response.status}). Check whether the server is running, then retry.`,
          "offline",
        );
      throw new ConnectionError(
        `Lapis Server rejected the connection check (HTTP ${response.status}).`,
      );
    }
    const reader = response.body?.getReader();
    if (!reader)
      throw new ConnectionError(
        "Lapis Server returned an invalid connection response.",
      );
    const decoder = new TextDecoder();
    let text = "",
      bytes = 0;
    try {
      for (;;) {
        const next = await reader.read();
        signal.throwIfAborted();
        if (next.done) break;
        bytes += next.value.byteLength;
        if (bytes > 32_768) {
          await reader.cancel();
          throw new ConnectionError(
            "Lapis Server connection response is too large.",
          );
        }
        text += decoder.decode(next.value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    let envelope: { result?: { data?: unknown } };
    try {
      envelope = JSON.parse(text);
    } catch {
      throw new ConnectionError(
        "Lapis Server returned an invalid connection response.",
      );
    }
    const data = envelope?.result?.data;
    if (!data || typeof data !== "object")
      throw new ConnectionError(
        "Lapis Server returned an invalid connection response.",
      );
    return data as T;
  }
  async listManagedVaults(
    settings: Readonly<SyncSettings>,
    signal: AbortSignal,
  ): Promise<ManagedVault[]> {
    if (this.#disposed) throw new Error("The connection runtime is disposed.");
    const invalid = validateSyncServerUrl(settings.serverUrl, this.options);
    if (invalid) throw new Error(invalid);
    const deadline = AbortSignal.timeout(this.options.timeoutMs ?? 10_000);
    const combined = AbortSignal.any([signal, this.#abort.signal, deadline]);
    try {
      const base = new URL(settings.serverUrl);
      const info = await this.#query(base, "system.info", combined);
      if (info.protocolMajor !== 1)
        throw new ConnectionError(
          "This Lapis Server uses an unsupported protocol version.",
        );
      const rows = await this.#query<unknown[]>(base, "vault.list", combined, {
        includeArchived: false,
      });
      if (!Array.isArray(rows))
        throw new ConnectionError(
          "Lapis Server returned an invalid managed vault list.",
        );
      const vaults: ManagedVault[] = [];
      const seen = new Set<string>();
      for (const entry of rows) {
        const row = entry as
          | (Partial<ManagedVault> & { archivedAt?: unknown })
          | null;
        if (
          !row ||
          typeof row.id !== "string" ||
          !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(row.id) ||
          typeof row.name !== "string" ||
          !row.name.trim() ||
          row.name.length > 256 ||
          !["owner", "editor", "viewer"].includes(row.role ?? "") ||
          seen.has(row.id)
        )
          throw new ConnectionError(
            "Lapis Server returned an invalid managed vault list.",
          );
        seen.add(row.id);
        if (row.archivedAt == null)
          vaults.push({ id: row.id, name: row.name, role: row.role! });
      }
      combined.throwIfAborted();
      return vaults;
    } catch (cause) {
      if (cause instanceof ConnectionError || combined.aborted) throw cause;
      throw new ConnectionError(
        "Unable to load managed vaults. Check the server address and connection.",
        "offline",
      );
    }
  }
  async execute(
    action: SyncAction,
    settings: Readonly<SyncSettings>,
    signal: AbortSignal,
  ): Promise<void> {
    if (this.#disposed) throw new Error("The connection runtime is disposed.");
    if (action.type !== "test-connection")
      throw new Error("Only connection checks are available in this runtime.");
    const invalid = validateSyncDestination(settings, this.options);
    if (invalid) throw new Error(invalid);
    const deadline = AbortSignal.timeout(this.options.timeoutMs ?? 10_000);
    const requestSignal = AbortSignal.any([
      signal,
      this.#abort.signal,
      deadline,
    ]);
    this.#state.destination = {
      ...createDisconnectedSnapshot().destination,
      url: settings.serverUrl,
      managedVaultId: settings.managedVaultId,
      message: "Checking Lapis Server account access…",
    };
    this.#notify();
    try {
      const base = new URL(settings.serverUrl);
      const info = await this.#query(base, "system.info", requestSignal);
      if (info.protocolMajor !== 1)
        throw new ConnectionError(
          "This Lapis Server uses an unsupported protocol version.",
        );
      const vault = await this.#query(base, "vault.open", requestSignal, {
        vaultId: settings.managedVaultId,
      });
      if (vault.vaultId !== settings.managedVaultId)
        throw new ConnectionError(
          "Lapis Server returned a different managed vault.",
        );
      if (vault.role !== "owner" && vault.role !== "editor")
        throw new ConnectionError(
          "This account needs editor or owner access to the managed vault.",
          "error",
          true,
        );
      requestSignal.throwIfAborted();
      this.#state.destination = {
        ...this.#state.destination,
        authenticated: true,
        authorized: true,
        status: "healthy",
        lastSuccessAt: Date.now(),
        message: `Connected to Lapis Server. Account access confirmed for ${settings.managedVaultId}. Endpoint enrollment is still required; no content is synchronized.`,
      };
      this.#notify();
    } catch (cause) {
      if (this.#disposed || signal.aborted || (requestSignal.aborted && !deadline.aborted)) throw cause;
      const error =
        cause instanceof ConnectionError
          ? cause
          : new ConnectionError(
              deadline.aborted
                ? "The Lapis Server connection check timed out."
                : "Unable to connect to Lapis Server. Check the address and whether the server is running.",
              "offline",
            );
      this.#state.destination = {
        ...this.#state.destination,
        authenticated: error.authenticated,
        authorized: false,
        status: error.status,
        lastSuccessAt: null,
        message: error.message,
      };
      this.#notify();
      throw error;
    }
  }
  dispose(): void {
    this.#disposed = true;
    this.#abort.abort();
    this.#listeners.clear();
  }
}
