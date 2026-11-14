<script lang="ts">
  import type { ComponentProps } from "svelte";
  import RepositoryPanel from "../RepositoryPanel.svelte";
  import RepositoryRemoteActions from "./RepositoryRemoteActions.svelte";
  let {
    history,
    remote,
  }: {
    history: ComponentProps<typeof RepositoryPanel>;
    remote: ComponentProps<typeof RepositoryRemoteActions>;
  } = $props();
</script>

<div class="remotes-history">
  <div class="remote-toolbar"><RepositoryRemoteActions {...remote} /></div>
  <div class="history-body"><RepositoryPanel {...history} /></div>
</div>

<style>
  .remotes-history {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
  .remote-toolbar {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .history-body {
    flex: 1;
    min-height: 0;
  }
</style>
