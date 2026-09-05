<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import {
    CommunityApplication,
    COMMUNITY_LOGIN_METHODS,
    type CommunityApplicationLoginOptions,
    type CommunityLoginMethodModel,
  } from "@lapismd/lapis-community/components";
  import type { CommunityController } from "@lapismd/lapis-community/community";
  import { onMount, untrack } from "svelte";

  import { createCommunityPluginController } from "./community-runtime";
  import { CommunityHostIdentityProvider } from "./host-identity";

  let {
    app,
    controller: suppliedController,
    loginOptions: suppliedLoginOptions,
  }: {
    app: App;
    controller?: CommunityController;
    loginOptions?: CommunityApplicationLoginOptions;
  } = $props();

  const ownsController = untrack(() => suppliedController === undefined);
  const controller = untrack(
    () => suppliedController ?? createCommunityPluginController(),
  );
  const identityProvider = untrack(
    () => new CommunityHostIdentityProvider(app.nostr),
  );
  let methods = $state<readonly CommunityLoginMethodModel[]>([
    COMMUNITY_LOGIN_METHODS.createAccount,
    COMMUNITY_LOGIN_METHODS.remoteSigner,
  ]);
  const loginOptions = $derived(
    suppliedLoginOptions ?? identityProvider.options(methods),
  );

  onMount(() => {
    controller.initialize();
    if (suppliedLoginOptions === undefined) {
      void identityProvider.methods().then((available) => {
        methods = available;
      });
    }
    return () => {
      if (ownsController) controller.dispose();
      void identityProvider.close();
    };
  });
</script>

<div class="community-plugin-application" data-testid="community-plugin-application">
  <CommunityApplication {controller} {loginOptions} />
</div>
