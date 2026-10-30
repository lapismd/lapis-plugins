<script lang="ts">
  import { ControlButton, Controls, useSvelteFlow } from "@xyflow/svelte";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  const { setZoom, zoomIn, zoomOut } = useSvelteFlow();

  async function resetZoom(): Promise<void> {
    await setZoom(1, { duration: 150 });
  }
</script>

<Controls position="top-right" showZoom={false}>
  {#snippet before()}
    <ControlButton
      class="svelte-flow__controls-zoomin"
      title="Zoom In"
      aria-label="Zoom In"
      onclick={() => void zoomIn({ duration: 150 })}
    >
      <Plus />
    </ControlButton>
    <ControlButton
      class="svelte-flow__controls-resetzoom"
      title="Reset zoom"
      aria-label="Reset zoom"
      onclick={() => void resetZoom()}
    >
      <RotateCcw />
    </ControlButton>
    <ControlButton
      class="svelte-flow__controls-zoomout"
      title="Zoom Out"
      aria-label="Zoom Out"
      onclick={() => void zoomOut({ duration: 150 })}
    >
      <Minus />
    </ControlButton>
  {/snippet}
</Controls>
