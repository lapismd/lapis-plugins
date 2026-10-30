import { afterEach, expect, it, vi } from "vitest";
import { FileEditingSessionRegistry, type App } from "@lapis-notes/api";
import { GraphPlugin } from "../graph-plugin";
import { DEFAULT_GRAPH_SETTINGS, patchGraphSettings } from "../graph-settings";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("admits coalesced Graph settings before debounce so a close drain cannot omit them", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("createDiv", () => ({}));
  const registry = new FileEditingSessionRegistry();
  const app = {
    vault: { supportsConditionalTextWrites: true },
    fileEditingSessions: registry,
  } as unknown as App;
  const plugin = new GraphPlugin(app);
  const save = vi.spyOn(plugin, "saveData").mockResolvedValue();
  await plugin.updateSettings(
    patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      display: { nodeSize: 9 },
    }),
  );
  await plugin.updateSettings(
    patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      display: { nodeSize: 11 },
    }),
  );
  let drained = false;
  const draining = registry.settleOperations().then(() => {
    drained = true;
  });
  await Promise.resolve();
  expect(drained).toBe(false);
  expect(save).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(180);
  await draining;
  expect(save).toHaveBeenCalledOnce();
  expect(save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      display: expect.objectContaining({ nodeSize: 11 }),
    }),
  );
  await plugin.onunload();
});
