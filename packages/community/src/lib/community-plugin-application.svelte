<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import {
    CommunityApplication,
    COMMUNITY_LOGIN_METHODS,
    type CommunityApplicationLoginOptions,
    type CommunityLoginMethodModel,
    type RegistryBrowserOptions,
  } from "@lapismd/lapis-community/components";
  import type { CommunityController } from "@lapismd/lapis-community/community";
  import type {
    RegistryInstallAction,
    RegistryInstallRequest,
  } from "@lapismd/lapis-community/registry";
  import { onMount, untrack } from "svelte";

  import {
    createCommunityPluginRegistrySource,
    installCommunityRegistryPlugin,
  } from "./community-registry";
  import { createCommunityPluginController } from "./community-runtime";
  import { CommunityHostIdentityProvider } from "./host-identity";

  let {
    app,
    controller: suppliedController,
    loginOptions: suppliedLoginOptions,
    registryOptions: suppliedRegistryOptions,
  }: {
    app: App;
    controller?: CommunityController;
    loginOptions?: CommunityApplicationLoginOptions;
    registryOptions?: RegistryBrowserOptions;
  } = $props();

  const ownsController = untrack(() => suppliedController === undefined);
  const controller = untrack(
    () => suppliedController ?? createCommunityPluginController(),
  );
  const identityProvider = untrack(
    () => new CommunityHostIdentityProvider(app.nostr),
  );
  const ownedRegistrySource = untrack(() =>
    suppliedRegistryOptions === undefined
      ? createCommunityPluginRegistrySource(app)
      : undefined,
  );
  let methods = $state<readonly CommunityLoginMethodModel[]>([
    COMMUNITY_LOGIN_METHODS.createAccount,
    COMMUNITY_LOGIN_METHODS.remoteSigner,
  ]);
  const loginOptions = $derived(
    suppliedLoginOptions ?? identityProvider.options(methods),
  );
  let installActions = $state<
    Readonly<Record<string, RegistryInstallAction>>
  >({});
  const registryOptions = $derived.by<RegistryBrowserOptions | undefined>(
    () => {
      if (suppliedRegistryOptions !== undefined) return suppliedRegistryOptions;
      if (ownedRegistrySource === undefined) return undefined;
      return {
        source: ownedRegistrySource,
        installActions,
        onInstall: installFromRegistry,
      };
    },
  );

  async function refreshInstallActions(): Promise<void> {
    try {
      await app.pluginDistribution.refreshCatalog();
      const installed = new Set(
        (await app.pluginDistribution.listInstalled()).map(
          (record) => record.pluginId,
        ),
      );
      installActions = Object.fromEntries(
        app.pluginDistribution
          .search()
          .map((plugin) => [
            plugin.id,
            installed.has(plugin.id)
              ? ({ state: "installed" } satisfies RegistryInstallAction)
              : ({ state: "available" } satisfies RegistryInstallAction),
          ]),
      );
    } catch {
      // The registry surface reports its own source error. Installation stays
      // unavailable until the host distribution manager can refresh.
    }
  }

  async function installFromRegistry(
    request: RegistryInstallRequest,
  ): Promise<void> {
    installActions = {
      ...installActions,
      [request.pluginId]: { state: "installing" },
    };
    try {
      await installCommunityRegistryPlugin(app, request);
      installActions = {
        ...installActions,
        [request.pluginId]: { state: "installed" },
      };
    } catch (cause) {
      installActions = {
        ...installActions,
        [request.pluginId]: {
          state: "rejected",
          reason:
            cause instanceof Error
              ? cause.message
              : "The plugin could not be installed",
        },
      };
      throw cause;
    }
  }

  onMount(() => {
    controller.initialize();
    if (suppliedRegistryOptions === undefined) void refreshInstallActions();
    if (suppliedLoginOptions === undefined) {
      void identityProvider.methods().then((available) => {
        methods = available;
      });
    }
    return () => {
      if (ownsController) controller.dispose();
      ownedRegistrySource?.dispose?.();
      void identityProvider.close();
    };
  });
</script>

<div
  class="community-plugin-application"
  data-ui-component="community-plugin-application"
  data-testid="community-plugin-application"
>
  <CommunityApplication {controller} {loginOptions} {registryOptions} />
</div>
