import { describe, expect, it, vi } from "vitest";
import type { SyncPlugin } from "../sync-plugin";
import { SyncSession } from "../presentation/session";
import { DEFAULT_SYNC_SETTINGS } from "../presentation/settings";
import {
  createDisconnectedSnapshot,
  type ManagedVault,
  type SyncRuntime,
} from "../presentation/types";
import { SyncSettingsSource } from "./source";
import type { ManagedVaultSettingsValue } from "./field-values";

const vault: ManagedVault = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Research",
  role: "editor",
};
function setup(load: NonNullable<SyncRuntime["listManagedVaults"]>) {
  let settings = {
    ...DEFAULT_SYNC_SETTINGS,
    serverUrl: "https://sync.example.test",
  };
  const runtime: SyncRuntime = {
    actions: [],
    listManagedVaults: load,
    snapshot: createDisconnectedSnapshot,
    subscribe: () => () => {},
    execute: async () => {},
    dispose: () => {},
  };
  const session = new SyncSession(runtime, () => settings);
  const plugin = {
    get settings() {
      return { ...settings };
    },
    session,
    updateSettings: async (patch: Partial<typeof settings>) => {
      settings = { ...settings, ...patch };
      session.notify();
    },
  } as unknown as SyncPlugin;
  const source = new SyncSettingsSource(plugin);
  const state = () =>
    source.get("sync.managedVaultId") as ManagedVaultSettingsValue;
  return { source, session, plugin, state };
}

describe("managed vault settings", () => {
  it("persists only a chosen editable ID and refuses unlisted or viewer-only selections", async () => {
    const f = setup(async () => [
      vault,
      { ...vault, id: "viewer", role: "viewer" },
    ]);
    await f.source.refreshManagedVaults();
    expect(f.plugin.settings.managedVaultId).toBe("");
    for (const selectedId of ["viewer", "unlisted"])
      await expect(
        f.source.set("sync.managedVaultId", { selectedId }),
      ).rejects.toThrow(/Choose an available vault/);
    await f.source.set("sync.managedVaultId", { selectedId: vault.id });
    expect(f.plugin.settings.managedVaultId).toBe(vault.id);
    expect(f.plugin.settings).not.toHaveProperty("vaults");
    expect(f.session.authorized()).toBe(false);
    f.source.dispose();
    await f.session.dispose();
  });
  it("discards a late response after switching servers or disposing Settings", async () => {
    for (const dispose of ["server", "dispose", "close"]) {
      let finish!: (value: ManagedVault[]) => void;
      let signal!: AbortSignal;
      const f = setup(async (_settings, received) => {
        signal = received;
        return new Promise((resolve) => {
          finish = resolve;
        });
      });
      const pending = f.source.refreshManagedVaults();
      expect(f.state().loading).toBe(true);
      if (dispose === "dispose") f.source.dispose();
      else if (dispose === "close") f.source.cancelManagedVaultDiscovery();
      else
        await f.source.set("sync.serverUrl", "https://different.example.test");
      expect(signal.aborted).toBe(true);
      finish([vault]);
      await pending;
      expect(f.state().vaults).toEqual([]);
      f.source.dispose();
      await f.session.dispose();
    }
  });
  it("exposes an authentication failure and recovers to an honest empty list", async () => {
    const load = vi
      .fn<NonNullable<SyncRuntime["listManagedVaults"]>>()
      .mockRejectedValueOnce(new Error("Sign in to the server"))
      .mockResolvedValueOnce([]);
    const f = setup(load);
    await f.source.refreshManagedVaults();
    expect(f.state()).toMatchObject({
      error: "Sign in to the server",
      loading: false,
      loaded: false,
    });
    await f.source.refreshManagedVaults();
    expect(f.state()).toMatchObject({
      error: null,
      loading: false,
      loaded: true,
      vaults: [],
    });
    f.source.dispose();
    await f.session.dispose();
  });
});
