import {
  type App,
  type Command,
  EventDispatcher,
  MemoryAppDatabase,
  SearchDocumentProviderRegistry,
  type TFile,
} from "@lapis-notes/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchManager } from "./search-manager";
import { SearchPlugin } from "./search-plugin";
import { DEFAULT_SEARCH_SETTINGS } from "./search-settings";

const disposals: Array<() => Promise<void>> = [];
beforeEach(() => {
  const createDiv = () => ({ createDiv, setText() {} });
  vi.stubGlobal("createDiv", createDiv);
});
afterEach(async () => {
  for (const dispose of disposals.splice(0).reverse()) await dispose();
  vi.unstubAllGlobals();
});

async function fixture(registerProvider = true) {
  const database = new MemoryAppDatabase("native-search-manager");
  await database.open();
  const providers = new SearchDocumentProviderRegistry();
  const extract = vi.fn(() => ({
    content: "Renderer callback must remain idle",
  }));
  if (registerProvider)
    providers.register({
      id: "search:markdown",
      version: "1",
      matches: () => true,
      extract,
    });
  const status = {
    passes: 4,
    indexed: 7,
    deleted: 0,
    pending: 0,
    error: null,
    active: true,
    processed: 7,
    total: 20,
    phase: "search",
  };
  const native = {
    detached: false,
    selectSearch: vi.fn(async () => ({
      projection_id: "search",
      placement: "native",
      message: null as string | null,
    })),
    refresh: vi.fn(async () => status),
    getStatus: vi.fn(async () => status),
    disableSearch: vi.fn(async () => undefined),
  };
  const note = {
    path: "Note.md",
    name: "Note.md",
    baseName: "Note",
    extension: "md",
    stat: { ctime: 1, mtime: 2, size: 3 },
  } as TFile;
  const metadata = new EventDispatcher();
  const vault = new EventDispatcher();
  const app = {
    session: { backgroundIndexing: { call: vi.fn() } },
    backgroundIndexing: native,
    appDatabase: database,
    searchDocumentProviders: providers,
    metadataCache: Object.assign(metadata, {
      processors: new Map(),
      getFileCacheAsync: vi.fn(async () => ({})),
      getReconciliationFingerprint: () => "browser-fingerprint",
    }),
    vault: Object.assign(vault, {
      getFiles: vi.fn(() => [note]),
      cachedRead: vi.fn(async () => "# Original\n"),
    }),
    notifications: {
      withProgress: async (
        _options: unknown,
        run: (progress: unknown) => unknown,
      ) => run({ report() {}, throwIfCancellationRequested() {} }),
    },
    logger: { warn: vi.fn() },
  } as unknown as App;
  const manager = new SearchManager(app);
  disposals.push(async () => {
    await manager.dispose();
    await database.close();
  });
  return { app, database, providers, extract, native, manager, note };
}

async function pluginFixture() {
  const f = await fixture(false);
  Object.assign(f.app, { plugins: { plugins: new Map() } });
  Object.assign(f.app.metadataCache, {
    initialized: false,
    load: async () => undefined,
    finishNativeContributions: async () => undefined,
    disableNativeContributions: async () => undefined,
  });
  const plugin = new SearchPlugin(f.app);
  plugin.configureRuntime({ source: "core" });
  vi.spyOn(plugin, "loadData").mockResolvedValue(null);
  vi.spyOn(plugin, "saveData").mockResolvedValue(undefined);
  vi.spyOn(plugin, "registerAgentTool").mockReturnValue({
    dispose() {},
  } as never);
  vi.spyOn(plugin, "registerAgentSlashCommand").mockReturnValue({
    dispose() {},
  } as never);
  vi.spyOn(plugin, "registerAgentResultView").mockReturnValue({
    dispose() {},
  } as never);
  vi.spyOn(plugin, "addSettingTab").mockImplementation(() => {});
  vi.spyOn(plugin, "registerSidebarView").mockImplementation(() => {});
  const commands = new Map<string, Command>();
  vi.spyOn(plugin, "addCommand").mockImplementation((command) => {
    commands.set(command.id, command);
    return command;
  });
  await plugin.enable();
  disposals.push(async () => {
    await plugin.disable();
  });
  return { ...f, plugin, commands };
}

describe("native Search ownership", () => {
  it("refreshes through the App observer without renderer extraction or writes", async () => {
    const f = await fixture();
    const write = vi.spyOn(f.database, "upsertSearchDocument");
    const checkpoint = vi.spyOn(f.database, "setMeta");
    await f.manager.refreshFromVault("manual-refresh");
    expect(f.native.selectSearch).toHaveBeenCalledWith({
      providers: [
        { provider_id: "search:markdown", version: "1", priority: 0 },
      ],
      chunking: DEFAULT_SEARCH_SETTINGS.chunking,
    });
    expect(f.native.refresh).toHaveBeenCalled();
    expect(f.extract).not.toHaveBeenCalled();
    expect(f.app.vault.cachedRead).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(checkpoint).not.toHaveBeenCalled();
  });

  it("reports the service-owned progress through the retained status API", async () => {
    const f = await fixture();
    await expect(f.manager.getStatus()).resolves.toMatchObject({
      isRefreshing: true,
      refreshProgress: { processed: 7, total: 20 },
    });
    expect(f.native.getStatus).toHaveBeenCalledOnce();
  });

  it("uses the native successful-pass timestamp instead of renderer startup time", async () => {
    const f = await fixture();
    const current = await f.native.getStatus();
    f.native.getStatus.mockResolvedValue({
      ...current,
      active: false,
      completed_at: 1792970000000,
    } as typeof current);
    await expect(f.manager.getStatus()).resolves.toMatchObject({
      refreshedAt: 1792970000000,
    });
  });

  it("keeps pending native convergence visible after a pass stops running", async () => {
    const f = await fixture();
    const current = await f.native.getStatus();
    f.native.getStatus.mockResolvedValue({
      ...current,
      active: false,
      pending: 2,
    });
    await expect(f.manager.getStatus()).resolves.toMatchObject({
      isRefreshing: true,
    });
  });

  it.each([
    { active: true, pending: 0, expected: true },
    { active: false, pending: 2, expected: true },
    { active: false, pending: 0, expected: false },
  ])(
    "reports cached native query telemetry for $active/$pending",
    async ({ active, pending, expected }) => {
      const f = await fixture();
      const current = await f.native.getStatus();
      f.native.getStatus.mockClear();
      f.native.getStatus.mockResolvedValue({ ...current, active, pending });
      const setAttribute = vi.fn();
      Object.assign(f.app, {
        telemetry: {
          measureAsync: async (
            _name: string,
            run: (span: unknown) => Promise<unknown>,
          ) => run({ setAttribute }),
        },
      });
      await f.manager.getStatus();
      await f.manager.query({ term: "note" });
      expect(setAttribute).toHaveBeenCalledWith(
        "search.reconcile.active",
        expected,
      );
      expect(f.native.getStatus).toHaveBeenCalledOnce();
    },
  );

  it("installs no client writer listeners and leaves native work running on dispose", async () => {
    const f = await fixture();
    const metadata = vi.spyOn(f.app.metadataCache, "on");
    const vault = vi.spyOn(f.app.vault, "on");
    const checkpoint = vi.spyOn(f.database, "setMeta");
    const detach = f.manager.trackChanges();
    expect(metadata).not.toHaveBeenCalled();
    expect(vault).not.toHaveBeenCalled();
    detach();
    await f.manager.dispose();
    expect(f.native.disableSearch).not.toHaveBeenCalled();
    expect(checkpoint).not.toHaveBeenCalled();
  });

  it("rejects an unsupported provider without running its callback fallback", async () => {
    const f = await fixture();
    f.native.selectSearch.mockResolvedValue({
      projection_id: "search",
      placement: "client_dependent",
      message: "Native Search cannot execute custom callbacks",
    });
    await expect(f.manager.refreshFromVault()).rejects.toThrow(
      /custom callbacks/,
    );
    expect(f.extract).not.toHaveBeenCalled();
    expect(f.native.refresh).not.toHaveBeenCalled();
  });

  it("sends semantic rebuilds to the native owner", async () => {
    const f = await fixture();
    const rebuild = vi.spyOn(f.database, "rebuildSearchIndex");
    await f.manager.refreshFromVault("manual-semantic-rebuild");
    expect(f.native.refresh).toHaveBeenCalledWith(true, {
      title: "Refreshing search index",
      source: "Search",
      readyMessage: "Search index ready",
    });
    expect(rebuild).not.toHaveBeenCalled();
  });

  it("never executes direct document mutation callbacks for a native App", async () => {
    const f = await fixture();
    const write = vi.spyOn(f.database, "upsertSearchDocument");
    const remove = vi.spyOn(f.database, "deleteSearchDocument");
    await f.manager.processChange(f.note, "Changed text", {});
    await f.manager.processDelete(f.note);
    expect(f.extract).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("preserves service failure without a client writer fallback", async () => {
    const f = await fixture();
    const write = vi.spyOn(f.database, "upsertSearchDocument");
    f.native.refresh.mockRejectedValueOnce(
      new Error("native refresh unavailable"),
    );
    await expect(f.manager.reconcileStartup()).rejects.toThrow(
      "native refresh unavailable",
    );
    expect(f.extract).not.toHaveBeenCalled();
    expect(f.app.vault.cachedRead).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("lets accepted work finish after disposal without reading a closed App", async () => {
    const f = await fixture();
    const current = await f.native.getStatus();
    let finish!: (status: typeof current) => void;
    f.native.refresh.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const stats = vi.spyOn(f.database, "getSearchIndexStats");
    const pending = f.manager.refreshFromVault();
    await vi.waitFor(() => expect(f.native.refresh).toHaveBeenCalledOnce());
    await f.manager.dispose();
    f.native.detached = true;
    finish(current);
    await expect(pending).resolves.toMatchObject({ documentCount: 0 });
    expect(stats).toHaveBeenCalledOnce();
    expect(f.native.disableSearch).not.toHaveBeenCalled();
  });

  it("fails closed if a native transport is selected without its App observer", async () => {
    const f = await fixture();
    delete (f.app as unknown as { backgroundIndexing?: unknown })
      .backgroundIndexing;
    await expect(f.manager.refreshFromVault()).rejects.toThrow(/observer/);
    expect(f.extract).not.toHaveBeenCalled();
    expect(f.app.vault.cachedRead).not.toHaveBeenCalled();
  });

  it("does not select or read a native service after manager disposal", async () => {
    const f = await fixture();
    const stats = vi.spyOn(f.database, "getSearchIndexStats");
    await f.manager.dispose();
    await f.manager.configureIndexing();
    await expect(f.manager.refreshFromVault()).rejects.toThrow(/disposed/);
    expect(f.native.selectSearch).not.toHaveBeenCalled();
    expect(f.native.getStatus).not.toHaveBeenCalled();
    expect(stats).not.toHaveBeenCalled();
  });

  it("does not select Search when disposal follows the initial status read", async () => {
    const f = await fixture();
    const current = await f.native.getStatus();
    let finish!: (status: typeof current) => void;
    f.native.getStatus.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = f.manager.refreshFromVault();
    await f.manager.dispose();
    finish(current);
    await expect(pending).resolves.toMatchObject({ documentCount: 0 });
    expect(f.native.selectSearch).not.toHaveBeenCalled();
    expect(f.native.refresh).not.toHaveBeenCalled();
  });

  it("does not refresh after disposal while a selected declaration settles", async () => {
    const f = await fixture();
    const selected = await f.native.selectSearch();
    f.native.selectSearch.mockClear();
    let finish!: (selection: typeof selected) => void;
    f.native.selectSearch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = f.manager.refreshFromVault();
    await vi.waitFor(() =>
      expect(f.native.selectSearch).toHaveBeenCalledOnce(),
    );
    await f.manager.dispose();
    finish(selected);
    await expect(pending).resolves.toMatchObject({ documentCount: 0 });
    expect(f.native.refresh).not.toHaveBeenCalled();
    expect(f.native.disableSearch).not.toHaveBeenCalled();
  });
});

describe("native Search plugin controls", () => {
  it("can explicitly enable Search again after its previous manager was disposed", async () => {
    const f = await pluginFixture();
    await f.plugin.disable();
    await f.plugin.enable();
    await expect(f.plugin.refreshIndex()).resolves.toMatchObject({
      documentCount: 0,
    });
    expect(f.native.selectSearch).toHaveBeenCalledOnce();
    expect(f.native.refresh).toHaveBeenCalledOnce();
  });

  it("fences late settings before the explicit native drain completes", async () => {
    const f = await pluginFixture();
    let finish!: () => void;
    const drain = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    Object.assign(f.app.metadataCache, { disableNativeContributions: drain });
    const disabling = f.plugin.disable();
    await vi.waitFor(() => expect(drain).toHaveBeenCalledOnce());
    await f.plugin.updateSettings({ chunking: { targetChars: 800 } });
    expect(f.native.selectSearch).not.toHaveBeenCalled();
    finish();
    await disabling;
    Object.assign(f.app.metadataCache, {
      disableNativeContributions: async () => undefined,
    });
  });

  it("declares persisted chunk changes while leaving query preferences observational", async () => {
    const f = await pluginFixture();
    await f.plugin.updateSettings({ query: { resultLimit: 25 } });
    expect(f.native.selectSearch).not.toHaveBeenCalled();
    await f.plugin.updateSettings({ chunking: { targetChars: 800 } });
    expect(f.plugin.saveData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chunking: expect.objectContaining({ targetChars: 800 }),
        query: expect.objectContaining({ resultLimit: 25 }),
      }),
    );
    expect(f.native.selectSearch).toHaveBeenCalledOnce();
    expect(f.native.selectSearch).toHaveBeenCalledWith({
      providers: [
        { provider_id: "search:markdown", version: "1", priority: 0 },
        { provider_id: "search:canvas", version: "1", priority: 0 },
      ],
      chunking: { ...DEFAULT_SEARCH_SETTINGS.chunking, targetChars: 800 },
    });
    expect(f.native.refresh).not.toHaveBeenCalled();
  });

  it("routes the retained rebuild command through the native owner", async () => {
    const f = await pluginFixture();
    const rebuild = vi.spyOn(f.database, "rebuildSearchIndex");
    await f.commands.get("rebuild-search-index")!.callback!();
    expect(rebuild).not.toHaveBeenCalled();
    expect(f.native.refresh).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("redeclares providers after native startup becomes ready without invoking callbacks", async () => {
    const f = await pluginFixture();
    Object.assign(f.app.metadataCache, { initialized: true });
    const matches = vi.fn(() => true);
    const extract = vi.fn(() => ({ content: "Custom content" }));
    const registration = f.providers.register({
      id: "custom:source",
      version: "3",
      priority: 7,
      matches,
      extract,
    });
    await vi.waitFor(() =>
      expect(f.native.selectSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          providers: expect.arrayContaining([
            { provider_id: "custom:source", version: "3", priority: 7 },
          ]),
        }),
      ),
    );
    registration.dispose();
    await vi.waitFor(() =>
      expect(f.native.selectSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          providers: expect.not.arrayContaining([
            expect.objectContaining({ provider_id: "custom:source" }),
          ]),
        }),
      ),
    );
    expect(matches).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });
});
