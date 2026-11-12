<script lang="ts">
  import { ControlButton, Controls, useSvelteFlow } from "@xyflow/svelte";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  let { readOnly = false }: { readOnly?: boolean } = $props();

  const { setZoom, zoomIn, zoomOut } = useSvelteFlow();
  const duration = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150;

  async function resetZoom(): Promise<void> {
    await setZoom(1, { duration: duration() });
  }
</script>

<Controls position="top-right" showZoom={false} showFitView={false} showLock={!readOnly}>
  {#snippet before()}
    <ControlButton
      class="svelte-flow__controls-zoomin"
      title="Zoom In"
      aria-label="Zoom In"
      onclick={() => void zoomIn({ duration: duration() })}
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
      onclick={() => void zoomOut({ duration: duration() })}
    >
      <Minus />
    </ControlButton>
  {/snippet}
</Controls>
