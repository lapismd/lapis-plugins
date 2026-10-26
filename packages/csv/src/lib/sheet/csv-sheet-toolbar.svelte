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
    colours,
    onAddress,
    onCommand,
    onWrap,
    onColours,
  }: {
    reference: string;
    commands: readonly SheetCommand[];
    wrap: boolean;
    colours: boolean;
    onAddress: (address: string) => void;
    onCommand: (id: SheetCommandId) => void;
    onWrap: (wrap: boolean) => void;
    onColours: (colours: boolean) => void;
  } = $props();

  let draft = $state<string | null>(null);

  function commitAddress() {
    if (draft == null) return;
    const value = draft;
    draft = null;
    onAddress(value);
  }
</script>

<div class="csv-sheet-toolbar" role="toolbar" aria-label="Sheet" data-sheet-toolbar>
  <input
    class="csv-sheet-toolbar__name"
    data-sheet-reference
    aria-label="Cell address"
    value={draft ?? reference}
    spellcheck="false"
    onfocus={(event) => event.currentTarget.select()}
    oninput={(event) => {
      draft = event.currentTarget.value;
    }}
    onkeydown={(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitAddress();
        event.currentTarget.blur();
      } else if (event.key === "Escape") {
        draft = null;
        event.currentTarget.blur();
      }
    }}
    onblur={commitAddress}
  />
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
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Toggle
            {...props}
            pressed={colours}
            size="sm"
            variant="outline"
            aria-label="Column colours"
            aria-pressed={colours}
            data-sheet-colours
            onPressedChange={(pressed) => onColours(pressed === true)}
          >
            <SheetGlyph command="colours" />
          </Toggle>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Column colours</Tooltip.Content>
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
    width: 4.5rem;
    height: 1.75rem;
    margin-right: 0.25rem;
    padding: 0 0.5rem;
    border: 1px solid var(--csv-surface-border, var(--border));
    border-radius: 0.25rem;
    background: var(--csv-shell-background, var(--background));
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .csv-sheet-toolbar__name:focus {
    outline: 2px solid var(--table-selection-border-color, var(--interactive-accent, var(--accent)));
    outline-offset: 1px;
  }

  .csv-sheet-toolbar :global(button:hover:not(:disabled)) {
    background: color-mix(in srgb, var(--foreground) 10%, transparent);
  }

  .csv-sheet-toolbar :global(button[aria-pressed="true"]),
  .csv-sheet-toolbar :global(button[aria-pressed="true"]:hover) {
    background: var(--table-selection-border-color, var(--interactive-accent, var(--accent)));
    color: var(--csv-shell-background, #fff);
    border-color: transparent;
  }

  .csv-sheet-toolbar__rule {
    width: 1px;
    height: 1.25rem;
    margin: 0 0.25rem;
    background: var(--csv-surface-border, var(--border));
  }
</style>
