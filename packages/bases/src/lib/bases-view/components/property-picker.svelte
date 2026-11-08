<script lang="ts">
  import { tick } from "svelte";
  import { Icon } from "@lapis-notes/api/icon";
  import type { BasesPropertyId } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import ArrowUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import X from "@lucide/svelte/icons/x";
  import Check from "@lucide/svelte/icons/check";
  import type { ColumnDefinition } from "../columns";

  let {
    id,
    label,
    columns,
    value,
    placeholder = "Property",
    onChange,
  }: {
    id?: string;
    label: string;
    columns: ColumnDefinition[];
    value?: BasesPropertyId | null;
    placeholder?: string;
    onChange: (value: BasesPropertyId | "") => void;
  } = $props();
  let open = $state(false);
  let trigger = $state<HTMLButtonElement>(null!);
  const selected = $derived(columns.find((column) => column.id === value));
  const listId = $props.id();
  async function choose(next: BasesPropertyId | "") {
    onChange(next);
    open = false;
    await tick();
    trigger?.focus();
  }
</script>

<div class="bases-property-setting">
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          bind:ref={trigger}
          {id}
          variant="outline"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          class="bases-property-setting__trigger"
        >
          <Icon name={selected?.icon ?? "lucide-file"} />
          <span>{selected?.displayName ?? placeholder}</span>
          <ArrowUpDown />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      class="bases-style-w-310px-8357f2 bases-style-p-0-8a539c"
      align="start"
    >
      <Command.Root label="Find property">
        <Command.Input
          aria-label="Find property"
          aria-controls={listId}
          placeholder="Find property"
        />
        <Command.List id={listId}>
          <Command.Empty>No properties found.</Command.Empty>
          <Command.Group>
            {#each columns as column (column.id)}
              <Command.Item
                class="bases-property-setting-option"
                value={`${column.displayName} ${column.id}`}
                onSelect={() => choose(column.id)}
              >
                <span
                  class="bases-property-setting__check"
                  class:is-selected={value === column.id}><Check /></span
                >
                <Icon name={column.icon ?? "lucide-info"} />
                <span>{column.displayName}</span>
                <span class="bases-property-setting__id">{column.id}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
  {#if value}
    <Button
      variant="ghost"
      size="icon-xs"
      class="bases-property-setting__clear"
      aria-label={`Clear ${label.toLowerCase()}`}
      onclick={() => choose("")}><X /></Button
    >
  {/if}
</div>

<style>
  .bases-property-setting {
    position: relative;
    min-width: 0;
    width: 100%;
  }
  .bases-property-setting :global(.bases-property-setting__trigger) {
    width: 100%;
    justify-content: space-between;
    padding-inline-end: 0.75rem;
  }
  .bases-property-setting :global(.bases-property-setting__trigger > span) {
    min-width: 0;
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-inline-end: 1.5rem;
  }
  .bases-property-setting :global(.bases-property-setting__clear) {
    position: absolute;
    inset-inline-end: 1.65rem;
    top: 50%;
    transform: translateY(-50%);
  }
  .bases-property-setting__check {
    visibility: hidden;
  }
  .bases-property-setting__check.is-selected {
    visibility: visible;
  }
  .bases-property-setting__id {
    margin-inline-start: auto;
    color: var(--ui-workspace-muted-foreground);
    font-size: 0.75rem;
  }
  /* The leading check reflects the saved mapping, independently of search focus. */
  :global(
      .bases-property-setting-option > [data-ui-part="command-check-icon"]
    ) {
    display: none;
  }
</style>
