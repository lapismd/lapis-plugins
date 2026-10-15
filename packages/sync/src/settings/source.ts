import type {
  WorkspaceSettingsSource,
  WorkspaceActionResult,
} from "@lapis-notes/api";
import type { SyncPlugin } from "../sync-plugin";
import type { SyncAction, ManagedVault } from "../presentation/types";
import type { SyncAccountState } from "../presentation/account";
import type {
  PairingSettingsValue,
  RecoverySettingsValue,
} from "./field-values";

export class SyncSettingsSource implements WorkspaceSettingsSource {
  #listeners = new Set<(fieldId?: string) => void>();
  #unsubscribe: () => void;
  #unsubscribeAccount?: () => void;
  #accountError: string | null = null;
  #disposed = false;
  #invitation = "";
  #alias = "This device";
  #camera = false;
  #cameraError: string | null = null;
  #file: File | null = null;
  #lastOperation: string | null = null;
  #vaults: ManagedVault[] = [];
  #vaultLoading = false;
  #vaultLoaded = false;
  #vaultError: string | null = null;
  #vaultRequest: AbortController | null = null;
  #vaultServerUrl: string;
  #choices: RecoverySettingsValue["choices"] = {};
  constructor(readonly plugin: SyncPlugin) {
    this.#vaultServerUrl = plugin.settings.serverUrl;
    this.#unsubscribe = plugin.session.subscribe(() => {
      if (this.#vaultServerUrl !== plugin.settings.serverUrl) {
        this.#vaultRequest?.abort();
        this.#vaultRequest = null;
        this.#vaultServerUrl = plugin.settings.serverUrl;
        this.#vaults = [];
        this.#vaultLoading = false;
        this.#vaultLoaded = false;
        this.#vaultError = null;
      }
      this.notify();
    });
    this.#unsubscribeAccount = plugin.options?.account?.subscribe(() => {
      this.#vaultRequest?.abort();
      this.#vaultRequest = null;
      this.#vaults = [];
      this.#vaultLoading = this.#vaultLoaded = false;
      this.#vaultError = this.#accountError = null;
      plugin.session.runtime?.invalidateConnection?.();
      this.notify();
      if (this.account.status === "signed-in") void this.refreshManagedVaults();
    });
  }
  get account(): SyncAccountState {
    const host = this.plugin.options?.account?.snapshot();
    if (!host || host.serverUrl !== this.plugin.settings.serverUrl) return {
      status: "unavailable", serverUrl: this.plugin.settings.serverUrl,
      username: null, verificationUrl: null,
      message: "Remote sign-in is not available in this host yet.",
    };
    return {
      status: this.#accountError ? "error" : host.status,
      serverUrl: host.serverUrl, username: host.username,
      verificationUrl: host.verificationUrl,
      message: this.#accountError ?? host.message,
    };
  }
  async accountAction(action: "signIn" | "cancel" | "signOut"): Promise<void> {
    this.#accountError = null;
    try { await this.plugin.options?.account?.[action](); }
    catch { this.#accountError = "Unable to complete this account action. Please retry."; }
    this.notify();
  }
  openAccountSignIn(): void {
    this.plugin.options?.account?.openSignIn();
  }
  get(fieldId: string): unknown {
    const snapshot = this.plugin.session.snapshot(),
      settings = this.plugin.settings;
    switch (fieldId.replace(/^sync\./, "")) {
      case "account": return this.account;
      case "provider":
        return settings.provider;
      case "serverUrl":
        return settings.serverUrl;
      case "managedVaultId":
        return {
          selectedId: settings.managedVaultId,
          serverUrl: settings.serverUrl,
          vaults: this.#vaults.map((v) => ({ ...v })),
          loading: this.#vaultLoading,
          loaded: this.#vaultLoaded,
          error: this.#vaultError,
          requiresSignIn: Boolean(this.plugin.options?.account) && this.account.status !== "signed-in",
        };
      case "enabled":
        return settings.enabled;
      case "indexFileTags":
        return settings.indexFileTags;
      case "encryption":
        return "End-to-end encryption is required. Only enrolled endpoints can read vault content.";
      case "syncIdentity":
        return snapshot.security.syncIdentity;
      case "connection":
        return snapshot.destination.message;
      case "deviceAlias":
        return snapshot.security.deviceAlias || "Not enrolled";
      case "devicePublicKey":
        return snapshot.security.devicePublicKey;
      case "role":
        return snapshot.security.role ?? "Not enrolled";
      case "epoch":
        return snapshot.security.epoch ?? "Unavailable";
      case "devices":
        return snapshot.devices.map((device) => ({ ...device }));
      case "pairingAlias":
        return this.#alias;
      case "pairing":
        return {
          ...snapshot.pairing,
          invitationInput: this.#invitation,
          cameraActive: this.#camera,
          error: this.#cameraError ?? snapshot.pairing.error,
        } satisfies PairingSettingsValue;
      case "recovery":
        return {
          selectedFile: this.#file,
          status: null,
          preview: snapshot.recoveryPreview,
          choices: { ...this.#choices },
          error: null,
        } satisfies RecoverySettingsValue;
      case "operationResult":
        return (
          snapshot.lastError ?? this.#lastOperation ?? "No operations yet."
        );
      default:
        return undefined;
    }
  }
  async set(id: string, value: unknown): Promise<unknown> {
    if (this.#disposed) return;
    const key = id.replace(/^sync\./, "");
    if (key === "managedVaultId" && value && typeof value === "object") {
      const id = (value as { selectedId?: unknown }).selectedId;
      if (
        typeof id !== "string" ||
        !this.#vaults.some((v) => v.id === id && v.role !== "viewer")
      )
        throw new Error(
          "Choose an available vault with editor or owner access.",
        );
      value = id;
    }
    if (key === "serverUrl" || key === "managedVaultId")
      await this.plugin.updateSettings({
        [key]: String(value ?? "").trim(),
        ...(key === "serverUrl" &&
        String(value ?? "").trim() !== this.plugin.settings.serverUrl
          ? { managedVaultId: "" }
          : {}),
        enabled: false,
      });
    else if (key === "enabled") {
      if (value === true && !this.plugin.session.authorized())
        throw new Error(
          "Test an authorized Lapis Server connection and enroll this device before enabling sync.",
        );
      await this.plugin.updateSettings({ enabled: value === true });
    } else if (key === "indexFileTags")
      await this.plugin.updateSettings({ indexFileTags: value === true });
    else if (key === "pairingAlias")
      this.#alias = String(value ?? "").slice(0, 64);
    else if (key === "pairing") {
      const next = value as Partial<PairingSettingsValue>;
      this.#invitation = String(next.invitationInput ?? "");
      this.#camera = next.cameraActive === true;
      this.#cameraError = typeof next.error === "string" ? next.error : null;
    } else if (key === "recovery") {
      const next = value as RecoverySettingsValue;
      this.#file = next.selectedFile ?? null;
      this.#choices = { ...next.choices };
    } else throw new Error("This Sync value is read-only.");
    this.notify();
    return this.get(id);
  }
  subscribe(listener: (fieldId?: string) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  notify(): void {
    if (!this.#disposed) for (const listener of this.#listeners) listener();
  }
  async action(action: SyncAction): Promise<WorkspaceActionResult> {
    const success = await this.plugin.session.run(action);
    const completed: Record<SyncAction["type"], string> = {
      "test-connection": "Connection test completed.",
      "begin-pairing": "Pairing invitation created.",
      "cancel-pairing": "Pairing canceled.",
      "accept-pairing":
        "Pairing invitation accepted. Confirm the security code on both devices.",
      "confirm-pairing": "Security code confirmed.",
      "export-recovery": "Encrypted recovery bundle exported.",
      "preview-recovery": "Recovery preview ready for review.",
      "apply-recovery": "Recovery applied.",
      "revoke-device": "Device revoked.",
      checkpoint: "Checkpoint saved.",
      sync: "Sync completed.",
      "restore-file": "File restored.",
      "resolve-merge": "Merge choice recorded.",
      "publish-merge": "Merge published.",
    };
    const message = success
      ? completed[action.type]
      : this.plugin.session.snapshot().lastError ?? "Sync action unavailable.";
    this.#lastOperation = message;
    if (success && action.type === "cancel-pairing") {
      this.#invitation = "";
      this.#camera = false;
      this.#cameraError = null;
    }
    this.notify();
    return { tone: success ? "success" : "error", message };
  }
  cancelManagedVaultDiscovery(): void {
    this.#vaultRequest?.abort();
    this.#vaultRequest = null;
    this.#vaultLoading = false;
    this.notify();
  }
  async refreshManagedVaults(): Promise<void> {
    if (this.#disposed) return;
    this.#vaultRequest?.abort();
    const request = new AbortController();
    this.#vaultRequest = request;
    const settings = this.plugin.settings;
    this.#vaults = [];
    this.#vaultLoading = true;
    this.#vaultLoaded = false;
    this.#vaultError = null;
    this.notify();
    try {
      const runtime = this.plugin.session.runtime;
      if (!runtime?.listManagedVaults)
        throw new Error(
          "Managed vault discovery is unavailable in this runtime.",
        );
      const vaults = await runtime.listManagedVaults(settings, request.signal);
      if (
        this.#disposed ||
        request.signal.aborted ||
        settings.serverUrl !== this.plugin.settings.serverUrl
      )
        return;
      this.#vaults = vaults;
      this.#vaultLoaded = true;
    } catch (error) {
      if (this.#disposed || request.signal.aborted) return;
      this.#vaultError =
        error instanceof Error
          ? error.message
          : "Unable to load managed vaults.";
    } finally {
      if (this.#vaultRequest === request && !this.#disposed) {
        this.#vaultLoading = false;
        this.notify();
      }
    }
  }
  acceptPairing(): Promise<WorkspaceActionResult> {
    return this.action({
      type: "accept-pairing",
      invitation: this.#invitation,
      alias: this.#alias,
    });
  }
  confirmPairing(): Promise<WorkspaceActionResult> {
    const session = this.plugin.session.snapshot().pairing.session;
    if (!session)
      return Promise.resolve({
        tone: "error",
        message: "No pairing session is waiting for confirmation.",
      });
    return this.action({
      type: "confirm-pairing",
      sessionId: session.sessionId,
      sas: session.sas,
    });
  }
  canCancel(): boolean {
    return (
      this.plugin.session.can("cancel-pairing") &&
      (this.#camera ||
        !["idle", "complete", "expired"].includes(
          this.plugin.session.snapshot().pairing.stage,
        ))
    );
  }
  canAccept(): boolean {
    return (
      this.plugin.session.can("accept-pairing") &&
      this.#alias.trim().length > 0 &&
      this.#invitation.startsWith("lapis://sync-pair")
    );
  }
  canPreview(): boolean {
    return this.#file !== null && this.plugin.session.can("preview-recovery");
  }
  previewRecovery(): Promise<WorkspaceActionResult> {
    return this.#file
      ? this.action({ type: "preview-recovery", file: this.#file })
      : Promise.resolve({
          tone: "error",
          message: "Choose a recovery bundle.",
        });
  }
  canApplyRecovery(): boolean {
    return (
      this.plugin.session.can("apply-recovery") &&
      this.plugin.session
        .snapshot()
        .recoveryPreview!.conflicts.every((c) => this.#choices[c.id])
    );
  }
  applyRecovery(): Promise<WorkspaceActionResult> {
    return this.action({
      type: "apply-recovery",
      choices: { ...this.#choices },
    });
  }
  dispose(): void {
    this.#disposed = true;
    this.#vaultRequest?.abort();
    this.#vaultRequest = null;
    this.#vaults = [];
    this.#unsubscribe();
    this.#unsubscribeAccount?.();
    this.#listeners.clear();
    this.#file = null;
    this.#choices = {};
    this.#invitation = "";
  }
}
