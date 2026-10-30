<script lang="ts">
  import { onMount } from "svelte";
  import { FileEmbed } from "@lapis-notes/markdown/embed";
  import FixtureControls from "../../../catalog/FixtureControls.svelte";
  import { createNativePreviewFixture, type NativePreviewFixture } from "./native-preview-fixture";

  let fixture = $state<NativePreviewFixture>();
  let root = $state<HTMLDivElement>();
  let admitted = $state(false);

  $effect(() => {
    if (!root || !fixture) return;
    const owned = root as HTMLDivElement & { fixture?: NativePreviewFixture };
    owned.fixture = fixture;
    return () => { delete owned.fixture; };
  });
  onMount(() => {
    let canceled = false;
    const pending = createNativePreviewFixture();
    void pending.then((created) => { if (!canceled) fixture = created; });
    return () => {
      canceled = true;
      void pending.then((created) => created.dispose());
    };
  });
</script>

<div bind:this={root} class="native-preview" data-testid="native-preview" data-ready={fixture ? "true" : "false"}>
  <FixtureControls placement="inline">
    <button disabled={!fixture || admitted} onclick={() => { fixture?.admit(); admitted = true; }}>Release native admission</button>
  </FixtureControls>
  {#if fixture}
    <FileEmbed app={fixture.app} file={fixture.file} editable editing returnToPreviewOnBlur={false} />
  {/if}
</div>

<style>
  .native-preview { display: flex; flex-direction: column; min-height: 30rem; height: 100%; }
  .native-preview > :global([data-ui-component="file-embed"]) { flex: 1 1 0; min-height: 0; }
</style>
