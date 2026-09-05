import {
  createBrowserCommunityConfigurationStore,
  createBrowserCommunityEventRuntime,
  createBrowserCommunityStateStore,
  createCommunityController,
  createNip29CommunitySource,
  type CommunityController,
} from "@lapismd/lapis-community/community";
import { createWebSocketCommunityRelayFactory } from "@lapismd/lapis-community/nostr";

export const DEFAULT_COMMUNITY_RELAY_URL = "wss://community.lapis.md";

export function createCommunityPluginController(
  relayUrl = DEFAULT_COMMUNITY_RELAY_URL
): CommunityController {
  const relayFactory = createWebSocketCommunityRelayFactory();
  return createCommunityController({
    scopes: [
      {
        id: "lapis-community",
        name: "Lapis Community",
        relayUrl,
        discoverPublicRooms: true,
      },
    ],
    source: createNip29CommunitySource({ relayFactory }),
    stateStore: createBrowserCommunityStateStore({
      prefix: "lapis-notes.community.state.v1",
    }),
    configurationStore: createBrowserCommunityConfigurationStore({
      prefix: "lapis-notes.community.configuration.v1",
    }),
    runtime: createBrowserCommunityEventRuntime(),
    clientId: "lapis-notes-community-plugin",
  });
}
