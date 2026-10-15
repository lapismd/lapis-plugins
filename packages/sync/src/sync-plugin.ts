import {
  Plugin,
  DeclarativePluginSettingTab,
  type App,
  type PluginManifest,
  type PluginSettingsRegistration,
  type DiagnosticCollection,
} from "@lapis-notes/api";
import manifestSpec from "../manifest.json";
import { SyncSession } from "./presentation/session";
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
import { SYNC_VIEW_TYPES, type SyncPaneKind } from "./view-state.svelte";

export const SYNC_PLUGIN_ID = "sync";
export type SyncPluginOptions = {
  createRuntime?: (
    app: App,
    settings: Readonly<SyncSettings>,
  ) => SyncRuntime | Promise<SyncRuntime>;
};

export class SyncPlugin extends Plugin {
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
    readonly options: SyncPluginOptions = {},
  ) {
    super(app, manifest);
  }
  get settings(): Readonly<SyncSettings> {
    return { ...this.#settings };
  }
  async onload(): Promise<void> {
    const data = await this.loadData();
    this.#settings = readSyncSettings(
      data?.version === 1 ? data.settings : null,
    );
    await this.session.dispose();
    this.session = new SyncSession(
      (await this.options.createRuntime?.(this.app, this.settings)) ?? null,
      () => this.settings,
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
          { kind: "command", command },
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
          { kind: "command", command },
        );
    }
    for (const kind of ["compare", "merge"] as const)
      this.registerView(
        SYNC_VIEW_TYPES[kind],
        (leaf) => new SyncView(leaf, this, kind),
        { kind: "internal" },
      );
    this.settingsSource = new SyncSettingsSource(this);
    const definition = createSyncSettingsDefinition(this.settingsSource);
    this.settingsRegistration = this.registerSettingsSection(definition);
    this.addSettingTab(
      new DeclarativePluginSettingTab(this.app, this, definition),
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
      this.app.workspace.on("file-open", () => this.session.notify()),
    );
    this.status = new SyncStatusBar(this.app, this.session, () =>
      this.openPane("sync"),
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
        this.session.notify();
      });
    this.#saveTail = save;
    return save;
  }
  async openPane(
    kind: SyncPaneKind,
    state: Record<string, unknown> = {},
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
  }
}
export default SyncPlugin;
