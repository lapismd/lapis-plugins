<script lang="ts">
  import { CommunityPluginApplication } from "@lapis-notes/community";
  import type { ComponentProps } from "svelte";

  let {
    app,
    controller,
    loginOptions,
    registryOptions,
  }: ComponentProps<typeof CommunityPluginApplication> = $props();
</script>

<div class="community-native-view-harness" data-ui-part="leaf-content">
  <header
    class="community-native-view-harness__header"
    data-ui-component="workspace-view-header"
    data-testid="community-native-view-header"
  >
    Host back and forward navigation
  </header>
  <div class="community-native-view-harness__content">
    <CommunityPluginApplication
      {app}
      {controller}
      {loginOptions}
      {registryOptions}
    />
  </div>
</div>

<style>
  .community-native-view-harness,
  .community-native-view-harness__content {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .community-native-view-harness {
    display: flex;
    flex-direction: column;
  }

  .community-native-view-harness__header {
    flex: 0 0 2.5rem;
  }

  .community-native-view-harness__content {
    flex: 1 1 auto;
  }
</style>
