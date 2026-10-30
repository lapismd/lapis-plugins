import type { App } from "@lapis-notes/api";
import type { CommunityApplicationExtensions } from "@lapismd/lapis-community/community";

export const COMMUNITY_TERMINAL_COMMAND_ID = "terminal:open-terminal";

type CommunityExtensionCommandHost = {
  isCommandAvailable(id: string): boolean;
  executeCommand<T>(id: string): Promise<T>;
  on?(
    event: "register" | "unregister",
    listener: (command: { id: string }) => void
  ): unknown;
  offref?(ref: unknown): void;
};

export function createCommunityPluginExtensions(
  app: App
): CommunityApplicationExtensions {
  const commands = communityExtensionCommands(app);
  return {
    ...(commands?.isCommandAvailable(COMMUNITY_TERMINAL_COMMAND_ID)
      ? {
          terminal: () =>
            commands.executeCommand<void>(COMMUNITY_TERMINAL_COMMAND_ID),
        }
      : {}),
  };
}

export function watchCommunityPluginExtensionCommands(
  app: App,
  update: (extensions: CommunityApplicationExtensions) => void
): () => void {
  const commands = communityExtensionCommands(app);
  if (!commands?.on || !commands.offref) return () => undefined;
  const refresh = (command: { id: string }) => {
    if (command.id !== COMMUNITY_TERMINAL_COMMAND_ID) return;
    update(createCommunityPluginExtensions(app));
  };
  const registered = commands.on("register", refresh);
  const unregistered = commands.on("unregister", refresh);
  return () => {
    commands.offref?.(registered);
    commands.offref?.(unregistered);
  };
}

function communityExtensionCommands(
  app: App
): CommunityExtensionCommandHost | undefined {
  const commands = (app as { commands?: Partial<CommunityExtensionCommandHost> })
    .commands;
  if (
    commands === undefined ||
    typeof commands.isCommandAvailable !== "function" ||
    typeof commands.executeCommand !== "function"
  ) {
    return undefined;
  }
  return commands as CommunityExtensionCommandHost;
}
