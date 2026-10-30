import { afterEach, expect, it, vi } from "vitest";
import { Events, type App } from "@lapis-notes/api";
import { GraphPlugin } from "../graph-plugin";
import {
  DEFAULT_GRAPH_SETTINGS,
  patchGraphSettings,
  serializeGraphSettings,
} from "../graph-settings";

vi.mock("../graph-data-coordinator", () => ({
  GraphDataCoordinator: class {
    subscribe() {
      return () => {};
    }
    start() {
      return Promise.resolve();
    }
    dispose() {}
  },
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("applies recovered Graph settings to its owner and mounted views without saving again", async () => {
  vi.stubGlobal("createDiv", () => ({}));
  const configuration = new Events();
  const plugin = new GraphPlugin({
    configuration,
    metadataCache: new Events(),
  } as unknown as App);
  vi.spyOn(plugin, "loadData").mockResolvedValue(
    serializeGraphSettings(DEFAULT_GRAPH_SETTINGS),
  );
  const save = vi.spyOn(plugin, "saveData").mockResolvedValue();
  vi.spyOn(plugin, "createDiagnosticCollection").mockReturnValue({} as never);
  vi.spyOn(plugin, "registerView").mockImplementation(vi.fn());
  vi.spyOn(plugin, "registerSidebarView").mockImplementation(vi.fn());
  vi.spyOn(plugin, "addRibbonIcon").mockImplementation(vi.fn());
  vi.spyOn(plugin, "addCommand").mockImplementation(vi.fn());
  await plugin.onload();
  const apply = vi.fn();
  const unregister = plugin.registerGraphView({
    focusActiveFile() {},
    applyGraphSettings: apply,
  });
  const recovered = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
    filters: { showTags: true },
  });
  configuration.trigger("plugin-data-updated", {
    pluginId: "another-plugin",
    value: recovered,
    origin: "external-reload",
  });
  expect(apply).not.toHaveBeenCalled();
  configuration.trigger("plugin-data-updated", {
    pluginId: plugin.manifest.id,
    value: serializeGraphSettings(recovered),
    origin: "external-reload",
  });
  expect(plugin.getSettings().filters.showTags).toBe(true);
  expect(apply).toHaveBeenCalledWith(recovered);
  expect(save).not.toHaveBeenCalled();
  unregister();
  await plugin.onunload();
});
