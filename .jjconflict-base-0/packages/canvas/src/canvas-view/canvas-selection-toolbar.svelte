<script lang="ts">
  import { tick } from "svelte";
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
    createNodeStyle,
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

  let toolbarElement = $state<HTMLElement | null>(null);
  let nativeColorInput = $state<HTMLInputElement | null>(null);
  let nativeColorValue = $state("#8260ff");
  let isColorMenuOpen = $state(false);
  let pendingGroupLabelEdit = $state(false);

  let selectedNodes = $derived(store.selectedNodes);
  let selectedNodeIds = $derived(selectedNodes.map((node) => node.id));
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

    groupNode.style = createNodeStyle(
      Math.round(bounds.width + GROUP_PADDING_X * 2),
      Math.round(bounds.height + GROUP_PADDING_TOP + GROUP_PADDING_BOTTOM),
    );
    groupNode.selected = true;

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
      <button
        type="button"
        class="canvas-node-toolbar-button"
        onclick={createGroupFromSelection}
        aria-label="Create group"
        title="Create group"
      >
        <SquarePlus aria-hidden="true" />
      </button>
      <button
        type="button"
        class="canvas-node-toolbar-button"
        onclick={removeSelectedNodes}
        aria-label="Remove selected nodes"
        title="Remove selected nodes"
      >
        <Trash2 aria-hidden="true" />
      </button>
      <button
        type="button"
        class:active={isColorMenuOpen}
        class="canvas-node-toolbar-button"
        onclick={toggleColorMenu}
        aria-label="Set color"
        title="Set color"
        aria-haspopup="dialog"
        aria-expanded={isColorMenuOpen}
      >
        <Palette aria-hidden="true" />
      </button>
      <button
        type="button"
        class="canvas-node-toolbar-button"
        onclick={zoomToSelection}
        aria-label="Zoom to selection"
        title="Zoom to selection"
      >
        <Expand aria-hidden="true" />
      </button>
    </div>

    {#if isColorMenuOpen}
      <div class="canvas-node-color-popover nodrag nopan">
        <button
          type="button"
          class:selected={!sharedColor}
          class="canvas-node-color canvas-node-color-clear"
          onclick={() => applyColor(undefined)}
          aria-label="Clear node color"
          title="Clear node color"
        ></button>

        {#each colorOptions as [colorId, colorValue] (colorId)}
          <button
            type="button"
            class:selected={sharedColor === colorId}
            class="canvas-node-color"
            style:--canvas-node-swatch={colorValue}
            onclick={() => applyColor(colorId)}
            aria-label={`Set node color ${colorId}`}
            title={`Set node color ${colorId}`}
          ></button>
        {/each}

        <button
          type="button"
          class:selected={hasCustomColor}
          class="canvas-node-color canvas-node-color-custom"
          onclick={openNativeColorPicker}
          aria-label="Choose custom node color"
          title="Choose custom node color"
        ></button>
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
