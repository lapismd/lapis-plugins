import { afterEach, expect, it, vi } from "vitest";
import type { ControllerClient } from "@lapismd/ai-controller/client";
import { AcpModelProvider } from "./acp-model-provider";
const host = vi.hoisted(() => ({ available: true }));
vi.mock("@lapis-notes/api/desktop-native", () => ({ hasNativeDesktopCapability: () => host.available }));
afterEach(() => { host.available = true; });
it("uses the shared model catalog and preserves labels, badges and defaults", async () => {
  const request = vi.fn(async () => ({ agent: "codex", currentModel: "fixture", models: ["fixture", "fixture"], entries: [{ id: "fixture", label: "Fixture", badges: ["recommended"] }] }));
  const provider = new AcpModelProvider("codex", { connection: async () => ({ workspace: "vault", client: { request } as unknown as ControllerClient }) });
  expect(await provider.listModels()).toEqual([{ provider: "codex", model: "fixture", displayName: "Fixture", badges: ["recommended"], isDefault: true }]);
  expect(request).toHaveBeenCalledWith("providers.models", { provider: "codex", workspace: "vault" });
  expect(await provider.authStatus()).toMatchObject({ authenticated: true });
});
it("keeps unconfigured hosts unavailable and reports provider discovery failures", async () => {
  const connection = vi.fn(async () => { throw new Error("Provider discovery failed"); });
  const provider = new AcpModelProvider("cursor", { connection });
  host.available = false;
  expect(await provider.listModels()).toEqual([]);
  expect(connection).not.toHaveBeenCalled();
  host.available = true;
  expect(await provider.authStatus()).toEqual({ authenticated: false, label: "cursor", detail: "Provider discovery failed" });
});

it("uses OpenCode Native models when the ACP instance is absent", async () => {
  const request = vi.fn(async (_method: string, input: { provider: string }) => {
    if (input.provider === "opencode") throw new Error("Provider is not configured");
    return { agent: "opencode-native", models: ["anthropic/claude-sonnet-4-5"], entries: [{ id: "anthropic/claude-sonnet-4-5", label: "Sonnet" }] };
  });
  const provider = new AcpModelProvider("opencode", {
    connection: async () => ({ workspace: "vault", client: { request } as unknown as ControllerClient }),
    providerIds: ["opencode", "opencode-native"],
  });
  expect(await provider.listModels()).toMatchObject([{ provider: "opencode", model: "anthropic/claude-sonnet-4-5", displayName: "Sonnet" }]);
  expect(request).toHaveBeenCalledTimes(2);
});
