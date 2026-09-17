import type { CommunityProjectsOptions } from "@lapismd/lapis-community/components";
import {
  createBrowserCommunityConfigurationStore,
  createBrowserCommunityEventRuntime,
  createBrowserCommunityStateStore,
  createCommunityController,
  createNip29CommunitySource,
  type CommunityController,
} from "@lapismd/lapis-community/community";
import { createWebSocketCommunityRelayFactory } from "@lapismd/lapis-community/nostr";
import { createNip34ProjectForgeDataSource } from "@lapismd/lapis-community/projects";

export const DEFAULT_COMMUNITY_RELAY_URL = "wss://community.lapis.md";

export function communityRelayHttpOrigin(
  relayUrl = DEFAULT_COMMUNITY_RELAY_URL
): string | undefined {
  try {
    const url = new URL(relayUrl);
    if (url.protocol === "wss:") url.protocol = "https:";
    else if (url.protocol === "ws:") url.protocol = "http:";
    else if (url.protocol !== "https:" && url.protocol !== "http:") {
      return undefined;
    }
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    url.username = "";
    url.password = "";
    return url.origin;
  } catch {
    return undefined;
  }
}

export function communityRelayAuthOrigin(
  relayUrl = DEFAULT_COMMUNITY_RELAY_URL
): string | undefined {
  try {
    const url = new URL(relayUrl);
    if (url.hostname === "local-community.lapis.md") {
      return "https://local-relay.lapis.md";
    }
  } catch {
    return undefined;
  }
  return communityRelayHttpOrigin(relayUrl);
}

export function createCommunityPluginProjectsOptions(
  relayUrl = DEFAULT_COMMUNITY_RELAY_URL
): CommunityProjectsOptions {
  const httpBaseUrl = communityRelayHttpOrigin(relayUrl);
  return {
    source: createNip34ProjectForgeDataSource({
      relayFactory: createWebSocketCommunityRelayFactory(),
    }),
    relayUrl,
    ...(httpBaseUrl === undefined ? {} : { httpBaseUrl }),
  };
}

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
