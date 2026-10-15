import {
  Plugin,
  FileView,
  type WorkspaceLeaf,
  DeclarativePluginSettingTab,
  type App,
  type PluginManifest,
  type PluginSettingsRegistration,
  type DiagnosticCollection,
  getNativeDesktopBridge,
} from "@lapis-notes/api";
import manifestSpec from "../manifest.json";
import { SyncSession } from "./presentation/session";
import {
  ServerConnectionRuntime,
  type ServerConnectionOptions,
} from "./presentation/server-connection";
import {
  readSyncSettings,
  DEFAULT_SYNC_SETTINGS,
} from "./presentation/settings";
import type { SyncRuntime, SyncSettings } from "./presentation/types";
import { SYNC_TOGGLE_STATUS_COMMAND_ID } from "./presentation/status";
import { SyncSettingsSource } from "./settings/source";
import { createSyncSettingsDefinition } from "./settings/definition";
import { SyncView } from "./sync-view";
import { SyncStatusBar } from "./status-bar";
import type { SyncAccountHost } from "./presentation/account";
import { NativeSyncAccount } from "./presentation/native-account";
import { SYNC_VIEW_TYPES, type SyncPaneKind } from "./view-state.svelte";

export const SYNC_PLUGIN_ID = "sync";
export type SyncPluginOptions = {
  account?: SyncAccountHost;
  connection?: ServerConnectionOptions;
  createRuntime?: (
    app: App,
    settings: Readonly<SyncSettings>
  ) => SyncRuntime | Promise<SyncRuntime>;
};

export class SyncPlugin extends Plugin {
  readonly options: SyncPluginOptions;
  #nativeAccount?: NativeSyncAccount;
  #settings = { ...DEFAULT_SYNC_SETTINGS };
  #saveTail: Promise<void> = Promise.resolve();
  session = new SyncSession(null, () => this.#settings);
  settingsSource: SyncSettingsSource | null = null;
  settingsRegistration: PluginSettingsRegistration | null = null;
  status: SyncStatusBar | null = null;
  #diagnostics: DiagnosticCollection | null = null;
  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
    options: SyncPluginOptions = {}
  ) {
    super(app, manifest);
    const bridge = options.account ? null : getNativeDesktopBridge();
    this.#nativeAccount = bridge
      ? new NativeSyncAccount(bridge, app.appDatabase.vaultId)
      : undefined;
    this.options = this.#nativeAccount
      ? {
          ...options,
          account: this.#nativeAccount,
          connection: {
            ...options.connection,
            request: this.#nativeAccount.request,
            allowLoopbackHttp: true,
          },
        }
      : options;
  }
  get settings(): Readonly<SyncSettings> {
    return { ...this.#settings };
  }
  async onload(): Promise<void> {
    const data = await this.loadData();
    this.#settings = readSyncSettings(
      data?.version === 1 ? data.settings : null
    );
    this.options.account?.configure(this.#settings.serverUrl);
    await this.session.dispose();
    this.session = new SyncSession(
      this.options.createRuntime
        ? await this.options.createRuntime(this.app, this.settings)
        : new ServerConnectionRuntime(this.options.connection),
      () => this.settings,
      this.options.connection
    );
    for (const kind of ["sync", "history", "file-history"] as const) {
      const command = {
        id: `open-${kind}`,
        name: `Open ${
          kind === "sync"
            ? "Sync"
            : kind === "history"
            ? "Sync history"
            : "Sync file history"
        }`,
        callback: () => void this.openPane(kind),
      } as const;
      if (kind === "history")
        this.registerView(
          SYNC_VIEW_TYPES[kind],
          (leaf) => new SyncView(leaf, this, kind),
          { kind: "command", command }
        );
      else
        this.registerSidebarView(
          SYNC_VIEW_TYPES[kind],
          (leaf) => new SyncView(leaf, this, kind),
          {
            side: "right",
            title: kind === "sync" ? "Sync" : "File History",
            icon: kind === "sync" ? "refresh-cw" : "file-clock",
          },
          { kind: "command", command }
        );
    }
    for (const kind of ["compare", "merge"] as const)
      this.registerView(
        SYNC_VIEW_TYPES[kind],
        (leaf) => new SyncView(leaf, this, kind),
        { kind: "internal" }
      );
    this.settingsSource = new SyncSettingsSource(this);
    const definition = createSyncSettingsDefinition(this.settingsSource);
    this.settingsRegistration = this.registerSettingsSection(definition);
    this.addSettingTab(
      new DeclarativePluginSettingTab(this.app, this, definition)
    );
    this.#diagnostics = this.createDiagnosticCollection("runtime", {
      label: "Lapis Sync",
    });
    const refreshDiagnostics = () => {
      const error = this.session.snapshot().lastError;
      if (error)
        this.#diagnostics?.set(null, [
          { message: error, severity: "warning", source: "Lapis Sync" },
        ]);
      else this.#diagnostics?.clear();
    };
    this.register(this.session.subscribe(refreshDiagnostics));
    refreshDiagnostics();
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.session.notify())
    );
    this.status = new SyncStatusBar(this.app, this.session, () =>
      this.openPane("sync")
    );
    this.status.start();
    this.addCommand({
      id: SYNC_TOGGLE_STATUS_COMMAND_ID.split(":")[1]!,
      name: "Show sync status",
      callback: () => this.status?.toggle(),
    });
    this.addCommand({
      id: "open-settings",
      name: "Open Sync settings",
      callback: () => this.settingsRegistration?.open(),
    });
  }
  async updateSettings(patch: Partial<SyncSettings>): Promise<void> {
    const save = this.#saveTail
      .catch(() => {})
      .then(async () => {
        const next = readSyncSettings({ ...this.#settings, ...patch });
        await this.saveData({ version: 1, settings: next });
        this.#settings = next;
        this.options.account?.configure(next.serverUrl);
        this.session.notify();
      });
    this.#saveTail = save;
    return save;
  }
  async openFile(path: string): Promise<void> {
    const file = this.app.vault.getFileByPath(path);
    if (!file) return;
    const workspace = this.app.workspace;
    let existing: WorkspaceLeaf | undefined;
    workspace.iterateAllLeaves((leaf) => {
      if (
        !existing &&
        leaf.view instanceof FileView &&
        leaf.view.file?.path === file.path
      )
        existing = leaf;
    });
    const leaf = existing ?? workspace.getLeaf("tab");
    if (!existing) await leaf.openFile(file);
    await workspace.revealLeaf(leaf);
    workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "sync-open-file",
    });
  }
  async openPane(
    kind: SyncPaneKind,
    state: Record<string, unknown> = {}
  ): Promise<void> {
    const type = SYNC_VIEW_TYPES[kind];
    const existing = this.app.workspace.getLeavesOfType(type)[0];
    const leaf =
      existing ??
      (kind === "sync" || kind === "file-history"
        ? this.app.workspace.getRightLeaf(false)
        : this.app.workspace.getLeaf("tab"));
    if (!leaf) throw new Error("No workspace leaf is available for Sync.");
    if (existing && Object.keys(state).length === 0)
      state = existing.view?.getState() ?? {};
    await leaf.setViewState({ type, state, active: true });
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: `open-${kind}`,
    });
    await this.app.workspace.revealLeaf(leaf);
  }
  async onunload(): Promise<void> {
    let nativeFailure: { error: unknown } | undefined;
    const nativeCleanup = this.#nativeAccount?.dispose().catch((error) => {
      nativeFailure = { error };
    });
    for (const type of Object.values(SYNC_VIEW_TYPES))
      for (const leaf of this.app.workspace.getLeavesOfType(type))
        await leaf.detach();
    await this.status?.dispose();
    this.status = null;
    this.settingsRegistration?.dispose();
    this.settingsRegistration = null;
    this.settingsSource?.dispose();
    this.settingsSource = null;
    await this.session.dispose();
    await this.#saveTail.catch(() => {});
    this.#diagnostics?.dispose();
    this.#diagnostics = null;
    await nativeCleanup;
    if (nativeFailure) throw nativeFailure.error;
  }
}
export default SyncPlugin;
