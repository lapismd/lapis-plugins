import type { App, Command } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";

import {
  COMMUNITY_TERMINAL_COMMAND_ID,
  createCommunityPluginExtensions,
  watchCommunityPluginExtensionCommands,
} from "./host-extensions";

function commandApp(available: () => boolean): App {
  return {
    commands: {
      isCommandAvailable: vi.fn(() => available()),
      executeCommand: vi.fn(async () => undefined),
      on: vi.fn(),
      offref: vi.fn(),
    },
  } as unknown as App;
}

describe("Community host extensions", () => {
  it("hides the terminal surface when the Terminal command is unavailable", () => {
    const extensions = createCommunityPluginExtensions(commandApp(() => false));

    expect(extensions.terminal).toBeUndefined();
  });

  it("fails closed when a deterministic host does not expose commands", () => {
    const app = {} as App;

    expect(createCommunityPluginExtensions(app).terminal).toBeUndefined();
    expect(watchCommunityPluginExtensionCommands(app, vi.fn())).toBeTypeOf(
      "function"
    );
  });

  it("routes the terminal surface through the Terminal plugin command", async () => {
    const app = commandApp(() => true);
    const extensions = createCommunityPluginExtensions(app);

    await extensions.terminal?.();

    expect(app.commands.executeCommand).toHaveBeenCalledWith(
      COMMUNITY_TERMINAL_COMMAND_ID
    );
  });

  it("refreshes extension availability when the Terminal command registers or unregisters", () => {
    let available = false;
    const refs: unknown[] = [];
    const listeners: Partial<
      Record<"register" | "unregister", (command: Command) => void>
    > = {};
    const app = {
      commands: {
        isCommandAvailable: vi.fn(() => available),
        executeCommand: vi.fn(async () => undefined),
        on: vi.fn((event: "register" | "unregister", listener) => {
          listeners[event] = listener as (command: Command) => void;
          const ref = { eventName: event, callback: listener };
          refs.push(ref);
          return ref;
        }),
        offref: vi.fn(),
      },
    } as unknown as App;
    const updates: ReturnType<typeof createCommunityPluginExtensions>[] = [];

    const dispose = watchCommunityPluginExtensionCommands(app, (next) => {
      updates.push(next);
    });
    available = true;
    listeners.register?.({ id: COMMUNITY_TERMINAL_COMMAND_ID } as Command);
    available = false;
    listeners.unregister?.({ id: COMMUNITY_TERMINAL_COMMAND_ID } as Command);
    listeners.register?.({ id: "ai:open-chat" } as Command);
    dispose();

    expect(updates.map((extension) => Boolean(extension.terminal))).toEqual([
      true,
      false,
    ]);
    expect(app.commands.offref).toHaveBeenCalledWith(refs[0]);
    expect(app.commands.offref).toHaveBeenCalledWith(refs[1]);
  });
});
