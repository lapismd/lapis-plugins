<script lang="ts">
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import BetweenVerticalStart from "@lucide/svelte/icons/between-vertical-start";
  import Eraser from "@lucide/svelte/icons/eraser";
  import Palette from "@lucide/svelte/icons/palette";
  import Redo2 from "@lucide/svelte/icons/redo-2";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  import type { SheetCommandId } from "./sheet-layout";

  let { command }: { command: SheetCommandId | "wrap" | "colours" | "header" | "undo" | "redo" } =
    $props();
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
  {:else if command === "header"}
    <BetweenVerticalStart />
  {:else if command === "undo"}
    <Undo2 />
  {:else if command === "redo"}
    <Redo2 />
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
