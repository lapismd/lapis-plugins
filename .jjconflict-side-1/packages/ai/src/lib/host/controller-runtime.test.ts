// @vitest-environment node
import { expect, it, vi } from "vitest";
import {
  Controller,
  ControllerStore,
  serveController,
  type ExecutionContext,
} from "@lapismd/ai-controller";
import type { NativeDesktopBridge } from "@lapis-notes/api/desktop-native";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import type { AgentEvent } from "../core/types";
import { ControllerConnectionPool } from "./controller-connection";
import { ControllerAgentRuntime } from "./controller-runtime";
import { AppToolHost } from "../tools/app-tool-host";
import { DesktopAppToolBridge } from "../tools/desktop-app-tool-bridge";
vi.mock("@lapis-notes/api/desktop-native", () => ({
  getNativeDesktopBridge: () => null,
}));

it("runs the Lapis adapter and app tools over the shared authenticated SDK", async () => {
  const store = new ControllerStore(":memory:");
  const seen: ExecutionContext[] = [];
  const engine = new Controller(
    store,
    new Map([
      [
        "codex",
        {
          capabilities: {
            driver: "acp",
            content: ["text" as const],
            configuration: true,
            resume: "context" as const,
            approvals: true,
            input: false,
            tools: true,
            externalMcp: true,
          },
          close: async () => {},
          execute: async (context) => {
            seen.push(context);
            const result = await context.callTool(
              "notes_read",
              { path: "Notes/a.md" },
              "read-call",
            );
            expect(result.content).toEqual([
              { type: "text", text: "App-owned note" },
            ]);
            await context.emit({
              type: "activity",
              data: { type: "thinking", text: "Checking the note" },
            });
            await context.emit({ type: "text", text: "Reply" });
            await context.emit({ type: "completed" });
          },
        },
      ],
    ]),
  );
  const token = "lapis-fixture-service-token-at-least-32";
  const server = await serveController(engine, {
    credentials: [
      {
        token,
        principal: { id: "lapis", providers: ["codex"], workspaces: ["vault"] },
      },
    ],
  });
  const invoke = vi.fn(async () => ({
    url: server.url,
    token,
    workspace: "vault",
  }));
  const bridge = {
    runtime: "deno-desktop",
    invoke,
    toFileUrl: (path: string) => path,
  } as NativeDesktopBridge;
  const pool = new ControllerConnectionPool(() => bridge);
  const runtime = new ControllerAgentRuntime("acp", pool);
  const registry = new AppToolRegistry();
  const execute = vi.fn(async () => ({
    content: [{ type: "text" as const, text: "App-owned note" }],
  }));
  registry.register(
    { pluginId: "markdown", source: "core", provenance: "bundled" },
    {
      name: "notes_read",
      description: "Read note",
      inputSchema: { type: "object" },
      effect: "read",
      execute,
    },
  );
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  const tools = new DesktopAppToolBridge(host, () =>
    pool.get("/fixture/vault"),
  );
  let session: Awaited<ReturnType<typeof runtime.start>> | undefined;
  let pump: Promise<void> | undefined;
  try {
    expect(
      await runtime.supports({
        prompt: "",
        workspace: "/fixture/vault",
        agent: "codex",
      }),
    ).toBe(true);
    const descriptor = await tools.prepare({
      conversationId: "conversation",
      agentBindingId: "binding",
      scopeDir: "Notes",
      runtimeSupportsAppTools: true,
    });
    session = await runtime.start({
      prompt: "",
      workspace: "/fixture/vault",
      agent: "codex",
      metadata: { sessionBootstrap: "App instructions" },
      appToolSession: descriptor,
    });
    const events: AgentEvent[] = [];
    const owned = session;
    pump = (async () => {
      for await (const event of owned.events()) events.push(event);
    })();
    await session.send("Authored message", {
      prepareContext: async () => [
        {
          kind: "memory-recall",
          id: "memory",
          content: "Remembered fact",
          metadata: { memoryId: "memory", revision: 1, scope: "workspace" },
        },
      ],
    });
    await expect
      .poll(() => events.some((event) => event.type === "completed"))
      .toBe(true);
    expect(execute).toHaveBeenCalledOnce();
    expect(seen[0]?.preparation.text).toBe("Authored message");
    expect(seen[0]?.preparation.blocks.map((block) => block.content)).toEqual([
      "App instructions",
      "Remembered fact",
    ]);
    expect(
      events
        .filter((event) =>
          ["thinking", "text", "completed"].includes(event.type),
        )
        .map((event) => event.type),
    ).toEqual(["thinking", "text", "completed"]);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith("desktop_ai_controller_connection", {
      workspace: "/fixture/vault",
    });
  } finally {
    await session?.close();
    await pump;
    await tools.close();
    host.close();
    pool.close();
    await server.close();
    await engine.close();
    store.close();
  }
});
