import type { App, PluginRegistrySourceState } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";

import {
  installCommunityRegistryPlugin,
  selectCommunityPluginRegistrySource,
} from "./community-registry";

const sourceState = (
  source: PluginRegistrySourceState["source"]
): PluginRegistrySourceState => ({
  source,
  phase: "ready",
  installReady: true,
});

describe("selectCommunityPluginRegistrySource", () => {
  it("prefers a configured Nostr source over the HTTP fallback", () => {
    const http = sourceState({
      id: "official-http",
      name: "Official",
      url: "https://registry.example/v1/index.json",
      trustTier: "official",
      enabled: true,
    });
    const nostr = sourceState({
      id: "nostr",
      name: "Nostr",
      kind: "nostr",
      url: "nostr://plugins",
      relays: ["wss://relay.example"],
      curatorPubkeys: ["a".repeat(64)],
      trustTier: "official",
      enabled: true,
    });

    expect(selectCommunityPluginRegistrySource([http, nostr])).toBe(nostr);
  });

  it("falls back to an enabled HTTP source", () => {
    const malformedNostr = sourceState({
      id: "nostr",
      name: "Nostr",
      kind: "nostr",
      url: "nostr://plugins",
      trustTier: "official",
      enabled: true,
    });
    const http = sourceState({
      id: "official-http",
      name: "Official",
      kind: "http",
      url: "https://registry.example/v1/index.json",
      trustTier: "official",
      enabled: true,
    });

    expect(selectCommunityPluginRegistrySource([malformedNostr, http])).toBe(
      http
    );
  });
});

describe("installCommunityRegistryPlugin", () => {
  it("delegates the selected release to the host distribution manager", async () => {
    const signal = new AbortController().signal;
    const removeProgressListener = vi.fn();
    const install = vi.fn(async () => ({ pluginId: "ai" }));
    const app = {
      notifications: {
        withProgress: async (
          _options: unknown,
          task: (
            handle: { report: (update: unknown) => void },
            token: { signal: AbortSignal }
          ) => Promise<unknown>
        ) => task({ report: vi.fn() }, { signal }),
      },
      pluginDistribution: {
        addProgressListener: vi.fn(() => removeProgressListener),
        install,
      },
    } as unknown as App;

    await installCommunityRegistryPlugin(app, {
      pluginId: "ai",
      version: "0.1.0",
      bundle: {
        url: "https://registry.example/plugins/ai/0.1.0.lapis-plugin",
        sha256: "a".repeat(64),
        size: 1_048_576,
      },
    });

    expect(install).toHaveBeenCalledWith("ai", {
      version: "0.1.0",
      signal,
    });
    expect(removeProgressListener).toHaveBeenCalledOnce();
  });
});
