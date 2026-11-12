<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  let {
    label,
    tooltip = label,
    ref = $bindable(null),
    children,
    onclick,
    disabled,
    ...rest
  }: ComponentProps<typeof Button> & {
    label: string;
    tooltip?: string;
  } = $props();
  const descriptionId = `canvas-tool-description-${crypto.randomUUID()}`;
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      {#if disabled}
        <span {...props} role="presentation" tabindex="-1">
          <Button variant="ghost" size="icon" {...rest} bind:ref {disabled} aria-label={label} aria-describedby={descriptionId} title={tooltip}>
            {@render children?.()}
          </Button>
          <span id={descriptionId} class="canvas-tool-description">{tooltip}</span>
        </span>
      {:else}
        <Button {...props} variant="ghost" size="icon" {...rest} bind:ref aria-label={label} onclick={(event) => {
          if (typeof props.onclick === "function") props.onclick(event);
          onclick?.(event);
        }}>
          {@render children?.()}
        </Button>
      {/if}
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content side="left" sideOffset={6}>{tooltip}</Tooltip.Content>
</Tooltip.Root>

<style>
.canvas-tool-description { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
