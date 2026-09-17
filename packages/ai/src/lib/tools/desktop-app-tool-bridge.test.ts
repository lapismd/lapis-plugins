import {
  AppToolRegistry,
  type AppTool,
  type AppToolOwner,
} from "@lapis-notes/api/agent-tools";
import type {
  ControllerClient,
  EndpointRegistration,
} from "@lapismd/ai-controller/client";
import { describe, expect, it, vi } from "vitest";
import { AppToolHost } from "./app-tool-host";
import { DesktopAppToolBridge } from "./desktop-app-tool-bridge";

const owner: AppToolOwner = {
  pluginId: "markdown",
  source: "core",
  provenance: "bundled",
};

function tool(
  name: string,
  options: Partial<AppTool<Record<string, unknown>>> = {},
): AppTool<Record<string, unknown>> {
  return {
    name,
    description: `Run ${name}`,
    inputSchema: { type: "object" },
    effect: "read",
    execute: async () => ({ content: [{ type: "text", text: "done" }] }),
    ...options,
  };
}

function fixture() {
  const registry = new AppToolRegistry();
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  let endpoint: EndpointRegistration;
  const unregister = vi.fn(async () => {});
  const registerEndpoint = vi.fn(async (value: EndpointRegistration) => {
    endpoint = value;
    return unregister;
  });
  const coordinator = new DesktopAppToolBridge(host, async () => ({
    workspace: "vault",
    client: { registerEndpoint } as unknown as ControllerClient,
  }));
  return {
    coordinator,
    host,
    registry,
    registerEndpoint,
    unregister,
    call: (id: string, name: string, signal = new AbortController().signal) =>
      endpoint.handle(
        {
          id,
          endpoint: endpoint.id,
          operation: "tool.execute",
          payload: {
            invocationId: id,
            name,
            arguments: { path: "Notes/a.md" },
          },
          deadline: Date.now() + 5000,
        },
        signal,
      ),
  };
}
const scope = {
  conversationId: "conversation-1",
  agentBindingId: "binding-1",
  scopeDir: "Notes",
  runtimeSupportsAppTools: true,
};

describe("controller app-tool endpoint", () => {
  it("executes approved writes and retains the grant only within the binding", async () => {
    const f = fixture();
    const execute = vi.fn(async () => ({
      content: [{ type: "text" as const, text: "patched" }],
    }));
    f.registry.register(
      owner,
      tool("notes_patch", {
        effect: "write",
        execute,
        describeApproval: async () => ({
          title: "Patch note",
          path: "Notes/a.md",
          diff: { before: "old", after: "new" },
        }),
      }),
    );
    const events: Array<{
      bindingId: string;
      event: { type: string; request?: { id: string; origin?: string } };
    }> = [];
    f.coordinator.subscribe((event) => events.push(event));
    try {
      const descriptor = await f.coordinator.prepare(scope);
      expect(descriptor).toMatchObject({
        bridgeId: "lapis.tools.binding-1",
        status: "available",
        tools: [{ name: "notes_patch" }],
      });
      const first = f.call("one", "notes_patch");
      await vi.waitFor(() =>
        expect(
          events.some((event) => event.event.type === "permission.request"),
        ).toBe(true),
      );
      expect(execute).not.toHaveBeenCalled();
      const approval = events.find(
        (event) => event.event.type === "permission.request",
      )!.event.request!;
      expect(approval.origin).toBe("app-tool");
      expect(
        f.coordinator.respondToApproval(approval.id, "allow-session"),
      ).toBe(true);
      await expect(first).resolves.toMatchObject({
        content: [{ text: "patched" }],
      });
      await f.call("two", "notes_patch");
      expect(execute).toHaveBeenCalledTimes(2);
      expect(
        events.filter((event) => event.event.type === "permission.request"),
      ).toHaveLength(1);
      await f.coordinator.closeBinding(scope.agentBindingId);
      expect(f.host.getSession(scope.agentBindingId)).toBeUndefined();
      expect(f.unregister).toHaveBeenCalledOnce();
      await expect(f.call("late", "notes_patch")).rejects.toThrow(
        "unavailable",
      );
    } finally {
      await f.coordinator.close();
      f.host.close();
    }
  });
  it("registers the portable manifest and keeps unsupported runtimes disconnected", async () => {
    const f = fixture();
    f.registry.register(owner, tool("notes_read"));
    try {
      await expect(
        f.coordinator.prepare({ ...scope, runtimeSupportsAppTools: false }),
      ).resolves.toMatchObject({ status: "runtime-unavailable", tools: [] });
      expect(f.registerEndpoint).not.toHaveBeenCalled();
      await f.coordinator.closeBinding(scope.agentBindingId);
      await f.coordinator.prepare(scope);
      expect(f.registerEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: [
            expect.objectContaining({
              name: "notes_read",
              effect: "read",
              inputSchema: { type: "object" },
            }),
          ],
        }),
      );
    } finally {
      await f.coordinator.close();
      f.host.close();
    }
  });
  it("propagates remote cancellation without exposing private exception text", async () => {
    const f = fixture();
    let running = false;
    f.registry.register(
      owner,
      tool("notes_read", {
        execute: async (_input, context) =>
          new Promise((_resolve, reject) => {
            running = true;
            context.signal.addEventListener(
              "abort",
              () => reject(new Error("private cancellation detail")),
              { once: true },
            );
          }),
      }),
    );
    try {
      await f.coordinator.prepare(scope);
      const abort = new AbortController();
      const result = f.call("one", "notes_read", abort.signal);
      await vi.waitFor(() => expect(running).toBe(true));
      abort.abort();
      const response = await result;
      expect(response).toMatchObject({ isError: true });
      expect(JSON.stringify(response)).not.toContain(
        "private cancellation detail",
      );
    } finally {
      await f.coordinator.close();
      f.host.close();
    }
  });
  it("cleans the app binding if service registration fails", async () => {
    const f = fixture();
    f.registry.register(owner, tool("notes_read"));
    f.registerEndpoint.mockRejectedValueOnce(new Error("Disconnected"));
    try {
      await expect(f.coordinator.prepare(scope)).rejects.toThrow(
        "Disconnected",
      );
      expect(f.host.getSession(scope.agentBindingId)).toBeUndefined();
    } finally {
      await f.coordinator.close();
      f.host.close();
    }
  });
});
