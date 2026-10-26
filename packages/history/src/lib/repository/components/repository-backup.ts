import { BackupController } from "../controllers/backup.js";
import type { RepositoryServices } from "../controllers/history-reader.js";
import { RepositorySync } from "./repository-sync.js";
import { BackgroundWork } from "../controllers/background-work.js";
import type { RepositoryPlugin } from "./repository-plugin.js";

export const AUTOMATIC_BACKUP_SETTING = "repository-history.automaticBackup";
export const automaticBackup = (value: Record<string, unknown>) =>
  typeof value.automaticBackup === "boolean" ? value.automaticBackup : true;

/** Capture lifetime is independent of whether its status control is visible. */
export class RepositoryBackup {
  readonly controller: BackupController;
  #progress?: () => void;
  readonly sync?: RepositorySync;
  #enabled = false;
  get enabled() {
    return this.#enabled;
  }
  constructor(
    readonly plugin: RepositoryPlugin,
    services: RepositoryServices,
  ) {
    this.controller = new BackupController(
      services.backup!,
      plugin.feedback("Vault backup"),
    );
    if (services.sync && services.remote)
      this.sync = new RepositorySync(plugin, services);
  }
  async start() {
    this.#progress = new BackgroundWork(
      this.plugin.app.notifications,
      this.plugin.id,
    ).follow("Saving vault history", {
      subscribe: (listener) =>
        this.controller.subscribe((state) =>
          listener({
            busy: state.phase === "saving",
            phase: state.phase,
          }),
        ),
    });
    const enabled = automaticBackup((await this.plugin.loadData()) ?? {});
    this.#enabled = enabled;
    // Admit the worker now; its first scan must not hold plugin/shell startup.
    if (enabled)
      void this.controller.start().catch((error) => this.plugin.report(error));
    else await this.controller.pause();
    await this.sync?.start();
  }
  async setEnabled(enabled: boolean) {
    const service = this.controller.service;
    if (service.setEnabled) {
      try {
        await service.setEnabled(enabled);
      } finally {
        // A lost acknowledgement may follow a committed native selection.
        // Project the reconciled setting without replaying the mutation.
        await this.reconcile(
          automaticBackup((await this.plugin.loadData()) ?? {}),
        );
      }
      return;
    }
    await this.reconcile(enabled);
  }
  /** Saved-state projection never changes native persisted selection. */
  async reconcile(enabled: boolean) {
    this.#enabled = enabled;
    if (enabled) await this.controller.start();
    else await this.controller.pause();
    await this.sync?.start();
  }
  async prepareLeave() {
    await this.controller.pause();
  }
  async resumeLeave() {
    if (this.#enabled) await this.controller.resume();
  }
  async close() {
    this.sync?.close();
    await this.controller.close();
    this.#progress?.();
    this.#progress = undefined;
  }
}
