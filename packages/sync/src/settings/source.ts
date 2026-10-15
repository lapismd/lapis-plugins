import type {
  WorkspaceSettingsSource,
  WorkspaceActionResult,
} from "@lapis-notes/api";
import type { SyncPlugin } from "../sync-plugin";
import type { SyncAction } from "../presentation/types";
import type {
  PairingSettingsValue,
  RecoverySettingsValue,
} from "./field-values";

export class SyncSettingsSource implements WorkspaceSettingsSource {
  #listeners = new Set<(fieldId?: string) => void>();
  #unsubscribe: () => void;
  #disposed = false;
  #invitation = "";
  #alias = "This device";
  #camera = false;
  #cameraError: string | null = null;
  #file: File | null = null;
  #lastOperation: string | null = null;
  #choices: RecoverySettingsValue["choices"] = {};
  constructor(readonly plugin: SyncPlugin) {
    this.#unsubscribe = plugin.session.subscribe(() => this.notify());
  }
  get(fieldId: string): unknown {
    const snapshot = this.plugin.session.snapshot(),
      settings = this.plugin.settings;
    switch (fieldId.replace(/^sync\./, "")) {
      case "provider":
        return settings.provider;
      case "serverUrl":
        return settings.serverUrl;
      case "managedVaultId":
        return settings.managedVaultId;
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
    if (key === "serverUrl" || key === "managedVaultId")
      await this.plugin.updateSettings({
        [key]: String(value ?? "").trim(),
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
      : (this.plugin.session.snapshot().lastError ??
        "Sync action unavailable.");
    this.#lastOperation = message;
    if (success && action.type === "cancel-pairing") {
      this.#invitation = "";
      this.#camera = false;
      this.#cameraError = null;
    }
    this.notify();
    return { tone: success ? "success" : "error", message };
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
    this.#unsubscribe();
    this.#listeners.clear();
    this.#file = null;
    this.#choices = {};
    this.#invitation = "";
  }
}
