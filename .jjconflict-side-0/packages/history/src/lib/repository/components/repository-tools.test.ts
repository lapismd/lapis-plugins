import { afterEach, expect, it, vi } from "vitest";
import type { RepositoryPlugin } from "./repository-plugin.js";
import type { RepositoryServices } from "../controllers/history-reader.js";
import { registerRepositoryTools } from "./repository-tools.js";

const { register, dispose } = vi.hoisted(() => ({
  register: vi.fn(),
  dispose: vi.fn(async () => {}),
}));
vi.mock("./search/search-provider.js", () => ({
  registerHistoryResultProvider: register.mockImplementation(() => dispose),
}));
afterEach(() => vi.clearAllMocks());

it("prefers the selected App-owned port over legacy service injection", async () => {
  const status = { generation: 1, indexed: 3, omitted: 0, complete: true };
  const call = vi.fn(async () => status);
  const plugin = {
    app: { nativeHistoryIndex: { call } },
  } as unknown as RepositoryPlugin;
  const legacy = { status: vi.fn() };
  const services = {
    search: { indexed: legacy },
  } as unknown as RepositoryServices;
  const close = registerRepositoryTools(plugin, services);
  expect(register).toHaveBeenCalledTimes(1);
  const selected = register.mock.calls[0]![1];
  expect(await selected.status()).toEqual(status);
  expect(call).toHaveBeenCalledWith({ kind: "status" });
  expect(legacy.status).not.toHaveBeenCalled();
  await close();
  expect(dispose).toHaveBeenCalledTimes(1);
});

it("retains explicit injected services when no native App port is selected", () => {
  const plugin = { app: {} } as RepositoryPlugin;
  const indexed = { start: vi.fn() };
  registerRepositoryTools(plugin, {
    search: { indexed },
  } as unknown as RepositoryServices);
  expect(register).toHaveBeenCalledWith(plugin, indexed);
});

it("does not register a provider or acquire authority without either service", async () => {
  const plugin = { app: {} } as RepositoryPlugin;
  await registerRepositoryTools(plugin, {} as RepositoryServices)();
  expect(register).not.toHaveBeenCalled();
});
