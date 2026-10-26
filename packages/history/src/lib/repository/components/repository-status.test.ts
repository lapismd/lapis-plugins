import { expect, it, vi } from "vitest";
import { RepositoryStatus } from "./repository-status.js";
import { AUTOMATIC_BACKUP_SETTING } from "./repository-backup.js";
import type { RepositoryPlugin } from "./repository-plugin.js";
import type { RepositoryServices } from "../controllers/history-reader.js";

vi.mock("./backup/backup-settings.js", () => ({
  createBackupSettings: () => undefined,
}));

async function fixture() {
  let data = {
    automaticBackup: true,
    showWorkingCopyStatus: false,
    keep: "retained",
  };
  let source: any;
  let changed: (value: unknown) => void = () => {};
  const setEnabled = vi.fn(async (enabled: boolean) => {
    data = { ...data, automaticBackup: enabled };
  });
  const reconcile = vi.fn(async (_enabled: boolean) => {});
  const saveData = vi.fn();
  const plugin = {
    id: "repository-history",
    loadData: async () => structuredClone(data),
    saveData,
    backup: { setEnabled, reconcile },
    report: vi.fn(),
    registerSettingsSection(value: any) {
      source = value.source;
    },
    app: {
      configuration: {
        on(_name: string, listener: typeof changed) {
          changed = listener;
          return {};
        },
        offref() {},
      },
    },
  } as unknown as RepositoryPlugin;
  const status = new RepositoryStatus(plugin, {
    backup: { setEnabled },
  } as unknown as RepositoryServices);
  await status.start();
  return {
    status,
    source,
    setEnabled,
    reconcile,
    saveData,
    changed: (value: unknown) => changed(value),
  };
}

it("projects native startup and configuration events without replaying a selection", async () => {
  const f = await fixture();
  const listener = vi.fn();
  f.source.subscribe(listener);
  f.changed({
    pluginId: "repository-history",
    value: { automaticBackup: false, showWorkingCopyStatus: false },
  });
  await vi.waitFor(() => expect(f.reconcile).toHaveBeenLastCalledWith(false));
  expect(f.setEnabled).not.toHaveBeenCalled();
  expect(f.saveData).not.toHaveBeenCalled();
  expect(listener).toHaveBeenCalledOnce();
  await f.status.close();
});

it("routes an explicit native setting through its sole writer and reloads persisted presentation", async () => {
  const f = await fixture();
  await f.source.set(AUTOMATIC_BACKUP_SETTING, false);
  expect(f.setEnabled).toHaveBeenCalledExactlyOnceWith(false);
  expect(f.source.get(AUTOMATIC_BACKUP_SETTING)).toBe(false);
  expect(f.reconcile).toHaveBeenLastCalledWith(false);
  expect(f.saveData).not.toHaveBeenCalled();
  await f.status.close();
});

it("keeps the saved native selection visible after a lost acknowledgement", async () => {
  const f = await fixture();
  const apply = f.setEnabled.getMockImplementation()!;
  f.setEnabled.mockImplementation(async (enabled) => {
    await apply(enabled);
    throw new Error("lost acknowledgement");
  });
  await expect(f.source.set(AUTOMATIC_BACKUP_SETTING, false)).rejects.toThrow(
    "lost acknowledgement",
  );
  expect(f.source.get(AUTOMATIC_BACKUP_SETTING)).toBe(false);
  expect(f.setEnabled).toHaveBeenCalledTimes(1);
  expect(f.saveData).not.toHaveBeenCalled();
  await f.status.close();
});
