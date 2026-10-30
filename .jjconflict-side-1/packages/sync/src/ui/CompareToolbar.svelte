<script lang="ts">
  import type { FileDiffViewMode } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ArchiveRestore from "@lucide/svelte/icons/archive-restore";
  import Columns2 from "@lucide/svelte/icons/columns-2";
  import Rows2 from "@lucide/svelte/icons/rows-2";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  import "./history-chrome.css";
  let {
    viewMode = $bindable("unified"),
    wrap = $bindable(false),
    onRestore,
  }: {
    viewMode?: FileDiffViewMode;
    wrap?: boolean;
    onRestore?: () => void;
  } = $props();
  const viewModeLabel = $derived(
    viewMode === "split" ? "Split diff" : "Unified diff",
  );
  const canRestore = $derived(Boolean(onRestore));
</script>

<Tooltip.Provider delayDuration={0}>
  <div
    class="sync-compare__toolbar"
    data-ui-part="toolbar"
    data-testid="sync-compare-toolbar"
    role="group"
    aria-label="Diff actions"
  >
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            class="sync-history-toolbar-action"
            data-testid="sync-compare-view-mode"
            data-view-mode={viewMode}
            aria-label={viewModeLabel}
            onclick={() =>
              (viewMode = viewMode === "split" ? "unified" : "split")}
          >
            {#if viewMode === "split"}
              <Columns2 aria-hidden="true" />
            {:else}
              <Rows2 aria-hidden="true" />
            {/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">{viewModeLabel}</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            class="sync-history-toolbar-action"
            data-testid="sync-compare-wrap"
            aria-label="Wrap text"
            aria-pressed={wrap}
            onclick={() => (wrap = !wrap)}
          >
            <WrapText aria-hidden="true" />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Wrap text</Tooltip.Content>
    </Tooltip.Root>
    {#if canRestore}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-sm"
              class="sync-history-toolbar-action"
              data-testid="sync-restore-file"
              aria-label="Restore this version"
              onclick={onRestore}
            >
              <ArchiveRestore aria-hidden="true" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">Restore this version</Tooltip.Content>
      </Tooltip.Root>
    {/if}
  </div>
</Tooltip.Provider>
