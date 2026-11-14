<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { getContext, tick } from "svelte";
  import { arrangeCanvas, canvasLayoutRoots, CANVAS_LAYOUT_ACTIONS, type CanvasLayoutAction } from "../lib/canvas-layout";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import {
    NodeToolbar,
    Position,
    useStore,
    useSvelteFlow,
    type Edge,
  } from "@xyflow/svelte";
  import Expand from "@lucide/svelte/icons/expand";
  import Palette from "@lucide/svelte/icons/palette";
  import SquarePlus from "@lucide/svelte/icons/square-plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import {
    PRESET_COLORS,
    createFlowNode,
    type FlowCanvasNode,
  } from "../lib/json-canvas";

  const GROUP_PADDING_X = 24;
  const GROUP_PADDING_TOP = 40;
  const GROUP_PADDING_BOTTOM = 24;
  const presetColorIds = new Set(Object.keys(PRESET_COLORS));
  const colorOptions = Object.entries(PRESET_COLORS);

  const store = useStore<FlowCanvasNode, Edge>();
  const { deleteElements, fitBounds, getNodesBounds, updateNodeData } =
    useSvelteFlow<FlowCanvasNode, Edge>();

  const board = getContext<CanvasBoardController | undefined>("lapis-canvas-board");
  let layoutMenu = $state<HTMLDetailsElement | null>(null);
  let arranging = $state(false);
  let arrangementError = $state<string | null>(null);
  async function arrange(action: CanvasLayoutAction): Promise<void> {
    if (!board || arranging) return;
    const ids = new Set(selectedNodeIds);
    arranging = true;
    arrangementError = null;
    try {
      await board.flush();
      board.beginGesture();
      board.apply(arrangeCanvas(board.read(), ids, action), ids);
      await tick();
      if (layoutMenu) layoutMenu.open = false;
    } catch (error) {
      arrangementError = error instanceof Error ? error.message : String(error);
    } finally { arranging = false; }
  }

  $effect(() => {
    if (!layoutMenu) return;
    const target = layoutMenu;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !target.open) return;
      event.preventDefault(); event.stopPropagation(); target.open = false;
      target.querySelector("summary")?.focus();
    };
    target.addEventListener("keydown", keydown);
    return () => target.removeEventListener("keydown", keydown);
  });

  let toolbarElement = $state<HTMLElement | null>(null);
  let nativeColorInput = $state<HTMLInputElement | null>(null);
  let nativeColorValue = $state("#8260ff");
  let isColorMenuOpen = $state(false);
  let pendingGroupLabelEdit = $state(false);

  let selectedNodes = $derived(store.selectedNodes);
  let selectedNodeIds = $derived(selectedNodes.map((node) => node.id));
  const layoutRoots = $derived(board ? canvasLayoutRoots(board.read(), new Set(selectedNodeIds)).length : 0);
  let selectedNodesCount = $derived(selectedNodes.length);
  let sharedColor = $derived.by(() => {
    const uniqueColors = new Set(
      selectedNodes.map((node) => node.data.color ?? ""),
    );

    if (uniqueColors.size !== 1) {
      return undefined;
    }

    const [color] = uniqueColors;
    return color || undefined;
  });
  let hasCustomColor = $derived(
    Boolean(sharedColor && !presetColorIds.has(sharedColor)),
  );

  function applyColor(color: string | undefined): void {
    for (const nodeId of selectedNodeIds) {
      updateNodeData(nodeId, { color });
    }

    isColorMenuOpen = false;
  }

  async function focusGroupLabelInput(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 0);
    });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await tick();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const input = document.querySelector<HTMLInputElement>(
        ".svelte-flow__node.selected .canvas-node-input-editable",
      );

      if (!input) {
        continue;
      }

      input.focus();
      input.select();
      pendingGroupLabelEdit = false;
      return;
    }
  }

  async function createGroupFromSelection(): Promise<void> {
    isColorMenuOpen = false;

    if (selectedNodesCount <= 1) {
      return;
    }

    const bounds = getNodesBounds(selectedNodes);
    const groupNode = createFlowNode("group", {
      x: Math.round(bounds.x - GROUP_PADDING_X),
      y: Math.round(bounds.y - GROUP_PADDING_TOP),
    });

    groupNode.width = Math.round(bounds.width + GROUP_PADDING_X * 2);
    groupNode.height = Math.round(bounds.height + GROUP_PADDING_TOP + GROUP_PADDING_BOTTOM);
    groupNode.selected = true;
    groupNode.zIndex = Math.min(0, ...store.nodes.map((node) => node.zIndex ?? 0)) - 1;

    store.nodes = [
      ...store.nodes.map((node) => ({
        ...node,
        selected: false,
      })),
      groupNode,
    ];
    pendingGroupLabelEdit = true;
  }

  async function removeSelectedNodes(): Promise<void> {
    isColorMenuOpen = false;

    if (selectedNodeIds.length === 0) {
      return;
    }

    await deleteElements({
      nodes: selectedNodeIds.map((nodeId) => ({ id: nodeId })),
    });
  }

  async function zoomToSelection(): Promise<void> {
    isColorMenuOpen = false;

    if (selectedNodeIds.length === 0) {
      return;
    }

    const bounds = getNodesBounds(selectedNodeIds);

    await fitBounds(bounds, {
      padding: 0.18,
      duration: 180,
    });
  }

  async function toggleColorMenu(): Promise<void> {
    isColorMenuOpen = !isColorMenuOpen;
    await tick();
  }

  function openNativeColorPicker(): void {
    if (!nativeColorInput) {
      return;
    }

    const input = nativeColorInput as HTMLInputElement & {
      showPicker?: () => void;
    };

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  }

  function handleCustomColorInput(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    nativeColorValue = value;
    applyColor(value);
  }

  $effect(() => {
    if (selectedNodesCount > 1) {
      return;
    }

    isColorMenuOpen = false;
    if (layoutMenu) layoutMenu.open = false;
  });

  $effect(() => {
    if (!pendingGroupLabelEdit) {
      return;
    }

    if (selectedNodesCount !== 1 || selectedNodes[0]?.data.kind !== "group") {
      return;
    }

    void focusGroupLabelInput();
  });

  $effect(() => {
    if (
      !sharedColor ||
      presetColorIds.has(sharedColor) ||
      !/^#[\da-f]{6}$/i.test(sharedColor)
    ) {
      return;
    }

    nativeColorValue = sharedColor;
  });

  $effect(() => {
    if (!isColorMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !(event.target instanceof Node) ||
        toolbarElement?.contains(event.target)
      ) {
        return;
      }

      isColorMenuOpen = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        isColorMenuOpen = false;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

<NodeToolbar
  nodeId={selectedNodeIds}
  isVisible={selectedNodesCount > 1}
  position={Position.Top}
  offset={14}
  class="canvas-selection-toolbar nodrag nopan"
>
  <div bind:this={toolbarElement} class="canvas-node-toolbar-content">
    <div class="canvas-node-toolbar-actions">
      <details class="canvas-selection-layout" bind:this={layoutMenu}>
        <summary>Arrange</summary>
        <div
          class="canvas-selection-layout-menu"
          role="group"
          aria-label="Arrange selected cards"
        >
          {#each CANVAS_LAYOUT_ACTIONS as [action, label]}
            <Tooltip.Root
              ><Tooltip.Trigger
                >{#snippet child({ props: tooltipProps })}<button
                    {...tooltipProps}
                    type="button"
                    disabled={arranging ||
                      layoutRoots < (action.startsWith("distribute") ? 3 : 2)}
                    onclick={() => void arrange(action)}>{label}</button
                  >{/snippet}</Tooltip.Trigger
              ><Tooltip.Content sideOffset={6}>{label}</Tooltip.Content
              ></Tooltip.Root
            >
          {/each}
        </div>
      </details>
      <Tooltip.Root
        ><Tooltip.Trigger
          >{#snippet child({ props: tooltipProps })}<button
              {...tooltipProps}
              type="button"
              class="canvas-node-toolbar-button"
              onclick={createGroupFromSelection}
              aria-label="Create group"
            >
              <SquarePlus aria-hidden="true" />
            </button>{/snippet}</Tooltip.Trigger
        ><Tooltip.Content sideOffset={6}>Create group</Tooltip.Content
        ></Tooltip.Root
      >
      <Tooltip.Root
        ><Tooltip.Trigger
          >{#snippet child({ props: tooltipProps })}<button
              {...tooltipProps}
              type="button"
              class="canvas-node-toolbar-button"
              onclick={removeSelectedNodes}
              aria-label="Remove selected nodes"
            >
              <Trash2 aria-hidden="true" />
            </button>{/snippet}</Tooltip.Trigger
        ><Tooltip.Content sideOffset={6}>Remove selected nodes</Tooltip.Content
        ></Tooltip.Root
      >
      <Tooltip.Root
        ><Tooltip.Trigger
          >{#snippet child({ props: tooltipProps })}<button
              {...tooltipProps}
              type="button"
              class:active={isColorMenuOpen}
              class="canvas-node-toolbar-button"
              onclick={toggleColorMenu}
              aria-label="Set color"
              aria-haspopup="dialog"
              aria-expanded={isColorMenuOpen}
            >
              <Palette aria-hidden="true" />
            </button>{/snippet}</Tooltip.Trigger
        ><Tooltip.Content sideOffset={6}>Set color</Tooltip.Content
        ></Tooltip.Root
      >
      <Tooltip.Root
        ><Tooltip.Trigger
          >{#snippet child({ props: tooltipProps })}<button
              {...tooltipProps}
              type="button"
              class="canvas-node-toolbar-button"
              onclick={zoomToSelection}
              aria-label="Zoom to selection"
            >
              <Expand aria-hidden="true" />
            </button>{/snippet}</Tooltip.Trigger
        ><Tooltip.Content sideOffset={6}>Zoom to selection</Tooltip.Content
        ></Tooltip.Root
      >
    </div>

    {#if arrangementError}<p role="alert">{arrangementError}</p>{/if}
    {#if isColorMenuOpen}
      <div class="canvas-node-color-popover nodrag nopan">
        <Tooltip.Root
          ><Tooltip.Trigger
            >{#snippet child({ props: tooltipProps })}<button
                {...tooltipProps}
                type="button"
                class:selected={!sharedColor}
                class="canvas-node-color canvas-node-color-clear"
                onclick={() => applyColor(undefined)}
                aria-label="Clear node color"
              ></button>{/snippet}</Tooltip.Trigger
          ><Tooltip.Content sideOffset={6}>Clear node color</Tooltip.Content
          ></Tooltip.Root
        >

        {#each colorOptions as [colorId, colorValue] (colorId)}
          <Tooltip.Root
            ><Tooltip.Trigger
              >{#snippet child({ props: tooltipProps })}<button
                  {...tooltipProps}
                  type="button"
                  class:selected={sharedColor === colorId}
                  class="canvas-node-color"
                  style:--canvas-node-swatch={colorValue}
                  onclick={() => applyColor(colorId)}
                  aria-label={`Set node color ${colorId}`}
                ></button>{/snippet}</Tooltip.Trigger
            ><Tooltip.Content sideOffset={6}
              >{`Set node color ${colorId}`}</Tooltip.Content
            ></Tooltip.Root
          >
        {/each}

        <Tooltip.Root
          ><Tooltip.Trigger
            >{#snippet child({ props: tooltipProps })}<button
                {...tooltipProps}
                type="button"
                class:selected={hasCustomColor}
                class="canvas-node-color canvas-node-color-custom"
                onclick={openNativeColorPicker}
                aria-label="Choose custom node color"
              ></button>{/snippet}</Tooltip.Trigger
          ><Tooltip.Content sideOffset={6}
            >Choose custom node color</Tooltip.Content
          ></Tooltip.Root
        >
        <input
          bind:this={nativeColorInput}
          class="canvas-node-native-color-input"
          type="color"
          value={nativeColorValue}
          oninput={handleCustomColorInput}
          tabindex="-1"
          aria-hidden="true"
        />
      </div>
    {/if}
  </div>
</NodeToolbar>

<style>
  .canvas-selection-layout {
    position: relative;
    color: var(--canvas-readable-text, var(--text-normal));
  }
  summary {
    padding: 8px;
    cursor: pointer;
    font-size: 12px;
    border-radius: 5px;
  }
  summary:focus-visible {
    outline: 2px solid
      var(--canvas-readable-indicator, var(--interactive-accent));
  }
  .canvas-selection-layout-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    display: grid;
    gap: 3px;
    width: 230px;
    max-height: 320px;
    overflow: auto;
    padding: 6px;
    border: 1px solid
      var(--canvas-readable-indicator, var(--background-modifier-border));
    border-radius: 8px;
    background: var(--canvas-readable-surface, var(--background-secondary));
    box-shadow: 0 8px 20px var(--background-modifier-box-shadow);
  }
  .canvas-selection-layout-menu button {
    min-height: 36px;
    padding: 6px 8px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .canvas-selection-layout-menu button:hover,
  .canvas-selection-layout-menu button:focus-visible {
    outline: 2px solid
      var(--canvas-readable-indicator, var(--interactive-accent));
    outline-offset: -2px;
  }
  .canvas-selection-layout-menu button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
