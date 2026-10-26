<script lang="ts">
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Eraser from "@lucide/svelte/icons/eraser";
  import Palette from "@lucide/svelte/icons/palette";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  import type { SheetCommandId } from "./sheet-layout";

  let { command }: { command: SheetCommandId | "wrap" | "colours" } = $props();
</script>

<span class="sheet-glyph" aria-hidden="true">
  {#if command === "move-left"}
    <ArrowLeft />
  {:else if command === "move-right"}
    <ArrowRight />
  {:else if command === "move-up"}
    <ArrowUp />
  {:else if command === "move-down"}
    <ArrowDown />
  {:else if command === "clear"}
    <Eraser />
  {:else if command === "delete"}
    <Trash2 />
  {:else if command === "colours"}
    <Palette />
  {:else}
    <WrapText />
  {/if}
</span>

<style>
  .sheet-glyph {
    display: inline-flex;
    flex: none;
    width: 1rem;
    height: 1rem;
  }

  .sheet-glyph :global(svg) {
    width: 1rem;
    height: 1rem;
  }
</style>
