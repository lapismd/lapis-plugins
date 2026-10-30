<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { createRepositoryStory } from "./runtime.svelte";
  import type { Placement } from "./layout";
  let { placement = "middle", operations = false, scenario = "ready", narrow = false }: {
    placement?: Placement; operations?: boolean; scenario?: string; narrow?: boolean;
  } = $props();
  let app = $state.raw<App>();
  let failure = $state("");
  onMount(() => {
    let disposed = false;
    const opening = createRepositoryStory(placement, operations, scenario);
    void opening.then((runtime) => { if (!disposed) app = runtime.app; }).catch((error) => { if (!disposed) failure = String(error); });
    return () => { disposed = true; void opening.then((runtime) => runtime.dispose()); };
  });
</script>

<div class="repository-story" data-ui-theme="lapis" data-repository-story style:max-width={narrow ? "400px" : undefined}>
  {#if failure}<p role="alert">{failure}</p>{:else if app}<WorkspaceShell {app} />{/if}
</div>

<style>
  .repository-story { width: 100%; height: 100vh; min-height: 0; overflow: hidden; }
</style>
