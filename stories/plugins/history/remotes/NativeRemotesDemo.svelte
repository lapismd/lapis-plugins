<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { openNativeRemotesStory, attachNativeRemotesStory } from "./native-runtime.svelte";
  let { host = "server", footer = true, operations = false, narrow = false }: { host?: "desktop" | "server"; footer?: boolean; operations?: boolean; narrow?: boolean } = $props();
  let app = $state.raw<App>();
  let element: HTMLDivElement;
  let failure = $state("");
  onMount(() => {
    let disposed = false;
    const opening = openNativeRemotesStory(host, footer, operations);
    void opening.then(runtime => {
      if (disposed) return;
      app = runtime.app; attachNativeRemotesStory(element, runtime);
    }).catch(error => { if (!disposed) failure = String(error); });
    return () => { disposed = true; void opening.then(runtime => runtime.dispose()); };
  });
</script>

<div class="native-remotes-story" style:max-width={narrow ? "390px" : undefined} bind:this={element} data-native-remotes-story>
  {#if failure}<p role="alert">{failure}</p>{:else if app}<WorkspaceShell {app} displayMode="desktop" />{/if}
</div>
<style>
  .native-remotes-story { height: 100vh; min-height: 0; overflow: hidden; }
</style>
