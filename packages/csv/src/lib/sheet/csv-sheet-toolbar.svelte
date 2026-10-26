<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Toggle } from "@lapismd/design-core/shadcn/toggle";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import SheetGlyph from "./sheet-glyph.svelte";
  import type { SheetCommand, SheetCommandId } from "./sheet-layout";

  let {
    reference,
    commands,
    wrap,
    onCommand,
    onWrap,
  }: {
    reference: string;
    commands: readonly SheetCommand[];
    wrap: boolean;
    onCommand: (id: SheetCommandId) => void;
    onWrap: (wrap: boolean) => void;
  } = $props();
</script>

<div class="csv-sheet-toolbar" role="toolbar" aria-label="Sheet" data-sheet-toolbar>
  <span class="csv-sheet-toolbar__name" data-sheet-reference>{reference}</span>
  <Tooltip.Provider delayDuration={300}>
    {#each commands as command (command.id)}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label={command.label}
              disabled={command.disabled}
              onclick={() => onCommand(command.id)}
            >
              <SheetGlyph command={command.id} />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">{command.label}</Tooltip.Content>
      </Tooltip.Root>
    {/each}
    <span class="csv-sheet-toolbar__rule" aria-hidden="true"></span>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Toggle
            {...props}
            pressed={wrap}
            size="sm"
            variant="outline"
            aria-label="Wrap text"
            aria-pressed={wrap}
            data-sheet-wrap
            onPressedChange={(pressed) => onWrap(pressed === true)}
          >
            <SheetGlyph command="wrap" />
          </Toggle>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Wrap text</Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
</div>

<style>
  .csv-sheet-toolbar {
    display: flex;
    flex: none;
    align-items: center;
    gap: 0.25rem;
    min-height: 2.25rem;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--csv-surface-border, var(--border));
    background: var(--csv-header-background, var(--background));
    color: var(--csv-text-color, var(--foreground));
    font-family: var(--font-interface, var(--font-sans, ui-sans-serif, system-ui, sans-serif));
    font-size: 13px;
  }

  .csv-sheet-toolbar__name {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3.25rem;
    height: 1.75rem;
    margin-right: 0.25rem;
    padding: 0 0.5rem;
    border: 1px solid var(--csv-surface-border, var(--border));
    border-radius: 0.25rem;
    background: var(--csv-shell-background, var(--background));
    font-variant-numeric: tabular-nums;
  }

  .csv-sheet-toolbar__rule {
    width: 1px;
    height: 1.25rem;
    margin: 0 0.25rem;
    background: var(--csv-surface-border, var(--border));
  }
</style>
