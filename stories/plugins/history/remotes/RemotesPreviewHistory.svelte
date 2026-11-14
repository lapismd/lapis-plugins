<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import RepositoryPanel from "../../../../packages/history/src/lib/repository/components/RepositoryPanel.svelte";
  import type { RepositoryPlugin } from "@lapis-notes/history/repository";
  let { plugin }: { plugin: RepositoryPlugin } = $props();
  const controller = untrack(() => plugin.createController("original"));
  onDestroy(() => {
    void plugin.release(controller);
  });
</script>

<RepositoryPanel {controller} copyText={(value) => plugin.copyIdentifier(value)} />
