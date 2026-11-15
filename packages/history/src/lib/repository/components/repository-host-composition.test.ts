import { expect, it, vi } from "vitest";
import { RepositoryBackup } from "./repository-backup.js";
import { createBackupSettings } from "./backup/backup-settings.js";
import type { RepositoryPlugin } from "./repository-plugin.js";
import type { RepositoryServices } from "../controllers/history-reader.js";

const { storage, adoption, rendererSync } = vi.hoisted(() => ({
  storage: { controller: {}, close: vi.fn(async () => {}) },
  adoption: { controller: {}, close: vi.fn(async () => {}) },
  rendererSync: vi.fn(),
}));
vi.mock("./backup/storage-settings.js", () => ({
  storageSettings: (_plugin: unknown, service: unknown) =>
    service ? storage : undefined,
}));
vi.mock("./backup/adoption-settings.js", () => ({
  adoptionSettings: (_plugin: unknown, service: unknown) =>
    service ? adoption : undefined,
}));
vi.mock("./repository-sync.js", () => ({
  RepositorySync: class {
    constructor() {
      rendererSync();
    }
  },
}));
function plugin() {
  return {
    id: "repository-history",
    feedback: () => ({ report: vi.fn(), recovered: vi.fn() }),
    addCommand: vi.fn(),
    app: { notifications: {} },
  } as unknown as RepositoryPlugin;
}
it("keeps independent storage and adoption settings available without forge accounts", async () => {
  const p = plugin();
  const settings = createBackupSettings(p, {
    storage: {},
    adoption: {},
  } as unknown as RepositoryServices);
  expect(settings).toBeDefined();
  const panel = settings!.openPanel();
  expect(panel.props.controller).toBeUndefined();
  expect(panel.props.storage).toBe(storage.controller);
  expect(panel.props.adoption).toBe(adoption.controller);
  await panel.close();
  await settings!.close();
  expect(storage.close).toHaveBeenCalledOnce();
  expect(adoption.close).toHaveBeenCalledOnce();
});
it("leaves synchronization to native remotes when a host supplies both service generations", () => {
  rendererSync.mockClear();
  const backup = new RepositoryBackup(plugin(), {
    backup: {},
    remote: {},
    sync: {},
    remotes: {},
  } as unknown as RepositoryServices);
  expect(backup.sync).toBeUndefined();
  expect(rendererSync).not.toHaveBeenCalled();
});
it("retains the legacy synchronization adapter for hosts without native remotes", () => {
  rendererSync.mockClear();
  const backup = new RepositoryBackup(plugin(), {
    backup: {},
    remote: {},
    sync: {},
  } as unknown as RepositoryServices);
  expect(backup.sync).toBeDefined();
  expect(rendererSync).toHaveBeenCalledOnce();
});
