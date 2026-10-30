<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import Camera from "@lucide/svelte/icons/camera";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";

  let {
    busy = false,
    canCheckpoint = false,
    canSync = false,
    onCheckpoint,
    onSync,
  }: {
    busy?: boolean;
    canCheckpoint?: boolean;
    canSync?: boolean;
    onCheckpoint: () => void;
    onSync: () => void;
  } = $props();
</script>

<Tooltip.Provider delayDuration={0}>
  <div
    class="sync-history-chrome__toolbar"
    data-ui-part="toolbar"
    data-testid="sync-sync-toolbar"
  >
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            class="sync-history-toolbar-action"
            data-testid="sync-checkpoint"
            aria-label="Create Checkpoint"
            disabled={busy || !canCheckpoint}
            onclick={onCheckpoint}
          >
            <Camera aria-hidden="true" />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Create Checkpoint</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            class="sync-history-toolbar-action"
            data-testid="sync-sync"
            aria-label="Sync Now"
            disabled={busy || !canSync}
            onclick={onSync}
          >
            <RefreshCw aria-hidden="true" />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Sync Now</Tooltip.Content>
    </Tooltip.Root>
  </div>
</Tooltip.Provider>
