<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { RelayAuthClient } from "@lapismd/lapis-community/auth";
  import {
    CommunityApplication,
    COMMUNITY_LOGIN_METHODS,
    type CommunityApplicationLoginOptions,
    type CommunityLoginMethodModel,
    type CommunityProjectsOptions,
    type RegistryBrowserOptions,
  } from "@lapismd/lapis-community/components";
  import type {
    CommunityApplicationExtensions,
    CommunityController,
  } from "@lapismd/lapis-community/community";
  import type {
    RegistryInstallAction,
    RegistryInstallRequest,
  } from "@lapismd/lapis-community/registry";
  import { onMount, untrack } from "svelte";

  import {
    createCommunityPluginRegistrySource,
    installCommunityRegistryPlugin,
    selectCommunityPluginRelayUrl,
  } from "./community-registry";
  import {
    createCommunityPluginController,
    createCommunityPluginProjectsOptions,
    communityRelayHttpOrigin,
    DEFAULT_COMMUNITY_RELAY_URL,
  } from "./community-runtime";
  import {
    createCommunityPluginExtensions,
    watchCommunityPluginExtensionCommands,
  } from "./host-extensions";
  import { CommunityHostIdentityProvider } from "./host-identity";

  let {
    app,
    controller: suppliedController,
    loginOptions: suppliedLoginOptions,
    registryOptions: suppliedRegistryOptions,
    projectsOptions: suppliedProjectsOptions,
    extensions: suppliedExtensions,
  }: {
    app: App;
    controller?: CommunityController;
    loginOptions?: CommunityApplicationLoginOptions;
    registryOptions?: RegistryBrowserOptions;
    projectsOptions?: CommunityProjectsOptions;
    extensions?: CommunityApplicationExtensions;
  } = $props();

  const ownsController = untrack(() => suppliedController === undefined);
  const hostRelayUrl = untrack(() =>
    suppliedController === undefined
      ? selectCommunityPluginRelayUrl(app.pluginDistribution.listSources())
      : undefined,
  );
  const communityRelayUrl = untrack(
    () => hostRelayUrl ?? DEFAULT_COMMUNITY_RELAY_URL,
  );
  const controller = untrack(
    () =>
      suppliedController ?? createCommunityPluginController(communityRelayUrl),
  );
  const identityProvider = untrack(
    () => new CommunityHostIdentityProvider(app.nostr),
  );
  const authOrigin = untrack(() => communityRelayHttpOrigin(communityRelayUrl));
  const authClient = untrack(() =>
    authOrigin === undefined
      ? undefined
      : new RelayAuthClient({
          relayUrl: authOrigin,
          connectIdentity: (methodId, credentials, context) =>
            identityProvider.connect(methodId, credentials, context),
        }),
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
    suppliedLoginOptions ?? identityProvider.options(methods, authClient),
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
  const ownedProjectsOptions = untrack(() =>
    suppliedProjectsOptions === undefined
      ? createCommunityPluginProjectsOptions(communityRelayUrl)
      : undefined,
  );
  const projectsOptions = $derived(
    suppliedProjectsOptions ?? ownedProjectsOptions,
  );
  let hostExtensions = $state<CommunityApplicationExtensions>(
    untrack(() => createCommunityPluginExtensions(app)),
  );
  const extensions = $derived(suppliedExtensions ?? hostExtensions);

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
    const disposeExtensionWatcher =
      suppliedExtensions === undefined
        ? watchCommunityPluginExtensionCommands(app, (available) => {
            hostExtensions = available;
          })
        : undefined;
    controller.initialize();
    if (suppliedRegistryOptions === undefined) void refreshInstallActions();
    if (suppliedLoginOptions === undefined) {
      void identityProvider.methods().then((available) => {
        methods = available;
      });
    }
    return () => {
      disposeExtensionWatcher?.();
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
  <CommunityApplication
    {controller}
    {loginOptions}
    {registryOptions}
    {projectsOptions}
    {extensions}
  />
</div>
