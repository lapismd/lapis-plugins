import { afterEach, expect, it, vi } from "vitest";
import { installApplicationCompatibility, type App } from "@lapis-notes/api";
import { SearchPlugin } from "./search-plugin";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps a background Search failure with its owning App while another compatibility host is active", async () => {
  const element = { createDiv: () => element, setText: vi.fn() };
  vi.stubGlobal("createDiv", () => element);
  const owner = {
    metadataCache: { load: vi.fn(async () => {}) },
    notifications: { notify: vi.fn(() => ({ id: "owner-notice" })) },
  } as unknown as App;
  const other = {
    notifications: { notify: vi.fn(() => ({ id: "other-notice" })) },
  } as unknown as App;
  const release = installApplicationCompatibility(other);
  try {
    const plugin = new SearchPlugin(owner);
    vi.spyOn(plugin.searchManager, "reconcileStartup").mockRejectedValue(
      new Error("index unavailable"),
    );
    await (plugin as unknown as { startupRefresh(): Promise<void> }).startupRefresh();
    expect(owner.notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Search index refresh failed: index unavailable",
      }),
    );
    expect(other.notifications.notify).not.toHaveBeenCalled();
  } finally {
    release();
  }
});
