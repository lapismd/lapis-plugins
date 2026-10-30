import { expect, it, vi } from "vitest";
import { SyncSettingsSource } from "./source";
import { DEFAULT_SYNC_SETTINGS } from "../presentation/settings";
import { SyncSession } from "../presentation/session";
import { createDisconnectedSnapshot } from "../presentation/types";
import type { SyncPlugin } from "../sync-plugin";
import type {
  SyncAccountState,
  SyncAccountHost,
} from "../presentation/account";

it("presents host account state and invalidates discovery on sign-out without persisting credentials", async () => {
  let state: SyncAccountState = {
    status: "signed-out",
    serverUrl: "https://sync.example.test",
    username: null,
    verificationUrl: null,
    message: "Sign in to Lapis Server.",
  };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<SyncAccountState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const account: SyncAccountHost = {
    snapshot: () => ({ ...state }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    configure: vi.fn(),
    openSignIn: vi.fn(),
    signIn: vi.fn(async () => set({ status: "signed-in", username: "owner" })),
    cancel: vi.fn(async () => set({ status: "signed-out", username: null })),
    signOut: vi.fn(async () => set({ status: "signed-out", username: null })),
  };
  const settings = { ...DEFAULT_SYNC_SETTINGS, serverUrl: state.serverUrl };
  const runtime = {
    actions: [] as const,
    snapshot: createDisconnectedSnapshot,
    subscribe: () => () => {},
    execute: async () => {},
    dispose: () => {},
    invalidateConnection: vi.fn(),
    listManagedVaults: vi.fn(async () => [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Research",
        role: "owner" as const,
      },
    ]),
  };
  const session = new SyncSession(runtime, () => settings);
  const plugin = {
    options: { account },
    settings,
    session,
    updateSettings: vi.fn(),
  } as unknown as SyncPlugin;
  const source = new SyncSettingsSource(plugin);
  expect(source.get("sync.account")).toEqual(state);
  await source.accountAction("signIn");
  await vi.waitFor(() =>
    expect(source.get("sync.managedVaultId")).toMatchObject({ loaded: true })
  );
  expect(source.get("sync.account")).toMatchObject({
    status: "signed-in",
    username: "owner",
  });
  await source.accountAction("signOut");
  expect(source.get("sync.managedVaultId")).toMatchObject({
    vaults: [],
    loaded: false,
  });
  expect(runtime.invalidateConnection).toHaveBeenCalled();
  expect(plugin.updateSettings).not.toHaveBeenCalled();
  expect(session.can("sync")).toBe(false);
  source.dispose();
  expect(listeners.size).toBe(0);
  await session.dispose();
});
