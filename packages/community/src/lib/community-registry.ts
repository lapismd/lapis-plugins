import {
  type App,
  type PluginRegistrySourceState,
  withPluginInstallProgress,
} from "@lapis-notes/api";
import { createWebSocketCommunityRelayFactory } from "@lapismd/lapis-community/nostr";
import {
  createHttpRegistryCatalogDataSource,
  type RegistryCatalogDataSource,
  type RegistryInstallRequest,
} from "@lapismd/lapis-community/registry";
import { createNip29RegistryCatalogDataSource } from "@lapismd/lapis-community/registry/nip29";

export function selectCommunityPluginRegistrySource(
  sources: readonly PluginRegistrySourceState[]
): PluginRegistrySourceState | undefined {
  return (
    sources.find(
      ({ source }) =>
        source.enabled &&
        source.kind === "nostr" &&
        (source.relays?.length ?? 0) > 0 &&
        (source.curatorPubkeys?.length ?? 0) > 0
    ) ??
    sources.find(
      ({ source }) => source.enabled && (source.kind ?? "http") === "http"
    )
  );
}

export function createCommunityPluginRegistrySource(
  app: App
): RegistryCatalogDataSource | undefined {
  const selected = selectCommunityPluginRegistrySource(
    app.pluginDistribution.listSources()
  );
  if (selected === undefined) return undefined;
  const { source } = selected;
  if (source.kind === "nostr") {
    const relays = source.relays ?? [];
    const curatorPubkeys = source.curatorPubkeys ?? [];
    return createNip29RegistryCatalogDataSource({
      relays,
      authorities: {
        curatorPubkeys: new Set(curatorPubkeys),
        publisherPubkeysByPlugin: new Map(),
      },
      relayFactory: createWebSocketCommunityRelayFactory(),
      ...(source.installQuorum === undefined
        ? {}
        : { installQuorum: source.installQuorum }),
    });
  }
  return createHttpRegistryCatalogDataSource({
    baseUrl: new URL(".", source.url),
  });
}

export async function installCommunityRegistryPlugin(
  app: App,
  request: RegistryInstallRequest
): Promise<void> {
  await withPluginInstallProgress(
    app,
    {
      pluginId: request.pluginId,
      title: `Install ${request.pluginId}`,
      source: "Community registry",
    },
    async (signal) => {
      await app.pluginDistribution.install(request.pluginId, {
        version: request.version,
        signal,
      });
    }
  );
}
