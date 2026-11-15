<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  let {
    heads,
    onSelect,
    disabled = false,
  }: { heads: readonly string[]; onSelect(operation: string): void; disabled?: boolean } = $props();
</script>

<div class="operation-heads" role="group" aria-label="Operation heads">
  {#each heads as operation}<Button
      {disabled}
      variant="outline"
      size="sm"
      aria-label={`Inspect operation ${operation}`}
      title={operation}
      onclick={() => onSelect(operation)}><code>{operation.slice(0, 12)}…</code></Button
    >{/each}
</div>

<style>
  .operation-heads {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0 1rem 1rem;
  }
</style>
