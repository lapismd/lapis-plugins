<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    Position,
    useSvelteFlow,
    useViewport,
    type EdgeProps,
  } from "@xyflow/svelte";
  import { tick } from "svelte";
  import ArrowLeftRight from "@lucide/svelte/icons/arrow-left-right";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Expand from "@lucide/svelte/icons/expand";
  import Minus from "@lucide/svelte/icons/minus";
  import Palette from "@lucide/svelte/icons/palette";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import X from "@lucide/svelte/icons/x";
  import {
    PRESET_COLORS,
    createFlowEdgePresentation,
    type EdgeEnd,
    type FlowCanvasEdge,
  } from "../lib/json-canvas";

  type DirectionMode = "none" | "unidirectional" | "bidirectional";
  type Vector = { x: number; y: number };

  const EDGE_ARROW_INSET = 10;
  const EDGE_ARROW_LENGTH = 18;
  const EDGE_ARROW_HALF_WIDTH = EDGE_ARROW_LENGTH / Math.sqrt(3);
  // Minimum bezier control offset (px) — ensures visible curvature even when nodes overlap.
  const MIN_CONTROL_OFFSET = 100;
  const EDGE_CURVATURE = 0.5;

  let {
    id,
    data,
    selected,
    interactionWidth,
    label,
    labelStyle,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  }: EdgeProps<FlowCanvasEdge> = $props();

  const { deleteElements, setCenter, updateEdge } = useSvelteFlow();
  const viewport = useViewport();
  const presetColorIds = new Set(Object.keys(PRESET_COLORS));

  let isColorMenuOpen = $state(false);
  let isDirectionMenuOpen = $state(false);
  let isEditingLabel = $state(false);
  let isHovered = $state(false);
  let nativeColorInput = $state<HTMLInputElement | null>(null);
  let labelInputElement = $state<HTMLDivElement | null>(null);
  let nativeColorValue = $state("#8260ff");
  let labelDraft = $state("");
  let toolbarAnchorElement = $state<HTMLDivElement | null>(null);
  let toolbarElement = $state<HTMLDivElement | null>(null);
  let toolbarMaxWidth = $state("calc(100vw - 1.5rem)");
  let toolbarOffsetX = $state("0px");
  let toolbarVertical = $state<"top" | "bottom">("top");
  let wasSelectedOnPointerDown = $state(false);

  // Returns a bezier control offset that is at least MIN_CONTROL_OFFSET, so
  // edges always have visible curvature even when nodes are on top of each other.
  function computeControlOffset(distance: number): number {
    const natural =
      distance >= 0
        ? 0.5 * distance
        : EDGE_CURVATURE * 25 * Math.sqrt(-distance);
    return Math.max(natural, MIN_CONTROL_OFFSET);
  }

  // Builds a cubic bezier path with guaranteed minimum curvature. Returns
  // [pathD, centerX, centerY] matching the getBezierPath signature.
  function computeBezierPath(
    sx: number,
    sy: number,
    sp: Position | undefined,
    tx: number,
    ty: number,
    tp: Position | undefined,
  ): [string, number, number] {
    let scx = sx,
      scy = sy;
    switch (sp) {
      case Position.Left:
        scx = sx - computeControlOffset(sx - tx);
        break;
      case Position.Right:
        scx = sx + computeControlOffset(tx - sx);
        break;
      case Position.Top:
        scy = sy - computeControlOffset(sy - ty);
        break;
      default:
        scy = sy + computeControlOffset(ty - sy); // Bottom
    }
    let tcx = tx,
      tcy = ty;
    switch (tp) {
      case Position.Left:
        tcx = tx - computeControlOffset(tx - sx);
        break;
      case Position.Right:
        tcx = tx + computeControlOffset(sx - tx);
        break;
      case Position.Top:
        tcy = ty - computeControlOffset(ty - sy);
        break;
      default:
        tcy = ty + computeControlOffset(sy - ty); // Bottom
    }
    const path = `M${sx},${sy} C${scx},${scy} ${tcx},${tcy} ${tx},${ty}`;
    // Midpoint at t=0.5: (P0 + 3P1 + 3P2 + P3) / 8
    const cx = (sx + 3 * scx + 3 * tcx + tx) / 8;
    const cy = (sy + 3 * scy + 3 * tcy + ty) / 8;
    return [path, cx, cy];
  }

  function getArrowTipDirection(position: Position | undefined): Vector {
    switch (position) {
      case Position.Left:
        return { x: 1, y: 0 };
      case Position.Right:
        return { x: -1, y: 0 };
      case Position.Top:
        return { x: 0, y: 1 };
      case Position.Bottom:
      default:
        return { x: 0, y: -1 };
    }
  }

  function createArrowPath(
    tipX: number,
    tipY: number,
    direction: Vector,
  ): string {
    const baseX = tipX - direction.x * EDGE_ARROW_LENGTH;
    const baseY = tipY - direction.y * EDGE_ARROW_LENGTH;
    const normalX = -direction.y;
    const normalY = direction.x;
    const leftX = baseX + normalX * EDGE_ARROW_HALF_WIDTH;
    const leftY = baseY + normalY * EDGE_ARROW_HALF_WIDTH;
    const rightX = baseX - normalX * EDGE_ARROW_HALF_WIDTH;
    const rightY = baseY - normalY * EDGE_ARROW_HALF_WIDTH;

    return `M ${leftX},${leftY} L ${tipX},${tipY} L ${rightX},${rightY} Z`;
  }

  let edgeGeometry = $derived.by(() => {
    const sourceArrowDirection =
      data?.fromEnd === "arrow"
        ? getArrowTipDirection(sourcePosition)
        : undefined;
    const targetArrowDirection =
      data?.toEnd === "arrow"
        ? getArrowTipDirection(targetPosition)
        : undefined;
    const adjustedSourceX = sourceArrowDirection
      ? sourceX - sourceArrowDirection.x * EDGE_ARROW_INSET
      : sourceX;
    const adjustedSourceY = sourceArrowDirection
      ? sourceY - sourceArrowDirection.y * EDGE_ARROW_INSET
      : sourceY;
    const adjustedTargetX = targetArrowDirection
      ? targetX - targetArrowDirection.x * EDGE_ARROW_INSET
      : targetX;
    const adjustedTargetY = targetArrowDirection
      ? targetY - targetArrowDirection.y * EDGE_ARROW_INSET
      : targetY;
    const [path, centerX, centerY] = computeBezierPath(
      adjustedSourceX,
      adjustedSourceY,
      sourcePosition,
      adjustedTargetX,
      adjustedTargetY,
      targetPosition,
    );

    return {
      path,
      centerX,
      centerY,
      sourceArrowPath: sourceArrowDirection
        ? createArrowPath(sourceX, sourceY, sourceArrowDirection)
        : undefined,
      targetArrowPath: targetArrowDirection
        ? createArrowPath(targetX, targetY, targetArrowDirection)
        : undefined,
    };
  });
  let edgeColor = $derived(data?.resolvedColor ?? "var(--text-muted)");
  let toolbarScale = $derived(1 / Math.max(viewport.current.zoom, 0.0001));
  let labelScale = $derived(Math.max(viewport.current.zoom, 0.0001));
  let editableLabelScale = $derived(Math.max(viewport.current.zoom, 1));
  let edgeGlowColor = $derived(
    data?.resolvedColor
      ? `color-mix(in srgb, ${edgeColor} 44%, white 56%)`
      : "color-mix(in srgb, var(--text-muted) 46%, white 54%)",
  );
  let displayLabel = $derived.by(() => {
    if (typeof label !== "string") {
      return undefined;
    }

    const normalizedLabel = label.trim();
    return normalizedLabel.length > 0 ? normalizedLabel : undefined;
  });
  let hasCustomColor = $derived(
    Boolean(data?.color && !presetColorIds.has(data.color)),
  );
  let directionMode = $derived(getDirectionMode(data?.fromEnd, data?.toEnd));

  function getDirectionMode(
    fromEnd: EdgeEnd | undefined,
    toEnd: EdgeEnd | undefined,
  ): DirectionMode {
    if (fromEnd === "arrow" && toEnd === "arrow") {
      return "bidirectional";
    }

    if (toEnd === "arrow") {
      return "unidirectional";
    }

    return "none";
  }

  function endsForDirection(direction: DirectionMode): {
    fromEnd: EdgeEnd;
    toEnd: EdgeEnd;
  } {
    switch (direction) {
      case "bidirectional":
        return { fromEnd: "arrow", toEnd: "arrow" };
      case "unidirectional":
        return { fromEnd: "none", toEnd: "arrow" };
      case "none":
      default:
        return { fromEnd: "none", toEnd: "none" };
    }
  }

  function updateEdgeAppearance(
    color: string | undefined,
    direction: DirectionMode,
  ): void {
    const ends = endsForDirection(direction);

    updateEdge(
      id,
      createFlowEdgePresentation({
        fromEnd: ends.fromEnd,
        toEnd: ends.toEnd,
        color,
      }),
    );
  }

  function updateEdgeLabel(nextLabel: string): void {
    updateEdge(id, { label: nextLabel.trim() || undefined });
  }

  function normalizeEditableLabelText(value: string): string {
    return value.replace(/\u00a0/g, " ").replace(/\r?\n+/g, " ");
  }

  function moveCaretToEnd(element: HTMLElement): void {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function removeEdge(): Promise<void> {
    isColorMenuOpen = false;
    isDirectionMenuOpen = false;
    await deleteElements({ edges: [{ id }] });
  }

  async function zoomToEdge(): Promise<void> {
    isColorMenuOpen = false;
    isDirectionMenuOpen = false;

    await setCenter(edgeGeometry.centerX, edgeGeometry.centerY, {
      zoom: 1.35,
      duration: 180,
    });
  }

  function rememberSelectionState(): void {
    wasSelectedOnPointerDown = Boolean(selected);
  }

  async function enterLabelEditMode(): Promise<void> {
    isColorMenuOpen = false;
    isDirectionMenuOpen = false;
    labelDraft = typeof label === "string" ? label : "";
    isEditingLabel = true;
    await tick();
    if (!labelInputElement) {
      return;
    }

    labelInputElement.textContent = labelDraft;
    labelInputElement.focus();
    moveCaretToEnd(labelInputElement);
  }

  function handleEdgeClick(): void {
    if (!selected || !wasSelectedOnPointerDown || isEditingLabel) {
      return;
    }

    void enterLabelEditMode();
  }

  function editLabel(): void {
    void enterLabelEditMode();
  }

  function removeLabel(): void {
    isColorMenuOpen = false;
    isDirectionMenuOpen = false;
    isEditingLabel = false;
    updateEdgeLabel("");
  }

  function handleEdgeKeyDown(event: KeyboardEvent): void {
    if (
      (event.key !== "Enter" && event.key !== " ") ||
      !selected ||
      isEditingLabel
    ) {
      return;
    }

    event.preventDefault();
    void enterLabelEditMode();
  }

  function handleLabelInput(event: Event): void {
    labelDraft = normalizeEditableLabelText(
      (event.currentTarget as HTMLDivElement).textContent ?? "",
    );
  }

  function finishLabelEditing(commitLabel = true): void {
    if (commitLabel) {
      updateEdgeLabel(labelDraft);
    } else {
      labelDraft = typeof label === "string" ? label : "";
    }

    isEditingLabel = false;
  }

  function handleLabelInputBlur(): void {
    finishLabelEditing();
  }

  function handleLabelInputKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      finishLabelEditing();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finishLabelEditing(false);
    }
  }

  function handleLabelInputPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const plainText = normalizeEditableLabelText(
      event.clipboardData?.getData("text/plain") ?? "",
    );
    const selection = window.getSelection();

    if (!selection?.rangeCount) {
      return;
    }

    selection.deleteFromDocument();
    const textNode = document.createTextNode(plainText);
    const range = selection.getRangeAt(0);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    if (labelInputElement) {
      labelDraft = normalizeEditableLabelText(
        labelInputElement.textContent ?? "",
      );
    }
  }

  function chooseColor(color: string | undefined): void {
    updateEdgeAppearance(color, directionMode);
    isColorMenuOpen = false;
  }

  async function toggleColorMenu(): Promise<void> {
    isColorMenuOpen = !isColorMenuOpen;
    isDirectionMenuOpen = false;
    await tick();
    updateToolbarPlacement();
  }

  function chooseDirection(direction: DirectionMode): void {
    updateEdgeAppearance(data?.color, direction);
    isDirectionMenuOpen = false;
  }

  async function toggleDirectionMenu(): Promise<void> {
    isDirectionMenuOpen = !isDirectionMenuOpen;
    isColorMenuOpen = false;
    await tick();
    updateToolbarPlacement();
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
    chooseColor(value);
  }

  function updateToolbarPlacement(): void {
    if (!toolbarAnchorElement || !toolbarElement) {
      return;
    }

    const container =
      toolbarAnchorElement.closest(".canvas-view-surface") ??
      toolbarAnchorElement.closest(".workspace-leaf-content") ??
      document.documentElement;
    const anchorRect = toolbarAnchorElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const padding = 12;
    toolbarMaxWidth = `${Math.max(180, Math.floor(containerRect.width - padding * 2))}px`;
    const toolbarRect = toolbarElement.getBoundingClientRect();
    const toolbarWidth = toolbarRect.width || 260;
    const toolbarHeight = toolbarRect.height || 52;
    const gap = 14;
    const desiredLeft = anchorRect.left - toolbarWidth / 2;
    const minLeft = containerRect.left + padding;
    const maxLeft = Math.max(
      minLeft,
      containerRect.right - padding - toolbarWidth,
    );
    const clampedLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
    const spaceAbove = anchorRect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - anchorRect.bottom;
    const requiredHeight = toolbarHeight + gap;

    toolbarOffsetX = `${Math.round(clampedLeft - desiredLeft)}px`;
    toolbarVertical =
      spaceAbove >= requiredHeight || spaceAbove >= spaceBelow
        ? "top"
        : "bottom";
  }

  $effect(() => {
    if (!selected) {
      isColorMenuOpen = false;
      isDirectionMenuOpen = false;
      isEditingLabel = false;
    }
  });

  $effect(() => {
    if (isEditingLabel) {
      return;
    }

    labelDraft = typeof label === "string" ? label : "";
  });

  $effect(() => {
    if (!isEditingLabel || !labelInputElement) {
      return;
    }

    const currentValue = normalizeEditableLabelText(
      labelInputElement.textContent ?? "",
    );
    if (currentValue !== labelDraft) {
      labelInputElement.textContent = labelDraft;
    }
  });

  $effect(() => {
    if (
      !data?.color ||
      presetColorIds.has(data.color) ||
      !/^#[\da-f]{6}$/i.test(data.color)
    ) {
      return;
    }

    nativeColorValue = data.color;
  });

  $effect(() => {
    if (!selected || (!isColorMenuOpen && !isDirectionMenuOpen)) {
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
      isDirectionMenuOpen = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        isColorMenuOpen = false;
        isDirectionMenuOpen = false;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  $effect(() => {
    if (!selected || !toolbarAnchorElement || !toolbarElement) {
      return;
    }

    let frameId = 0;

    const update = () => {
      updateToolbarPlacement();
      frameId = requestAnimationFrame(update);
    };

    updateToolbarPlacement();
    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
    };
  });
</script>

{#if selected || isHovered}
  <path
    class="canvas-flow-edge-glow"
    d={edgeGeometry.path}
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    style={`stroke: ${edgeGlowColor}; stroke-width: 14px; opacity: 0.88; filter: blur(8px);`}
  ></path>
{/if}

<BaseEdge
  {id}
  path={edgeGeometry.path}
  interactionWidth={selected
    ? Math.max(interactionWidth ?? 20, 28)
    : interactionWidth}
  class="canvas-flow-edge-path"
  style={`stroke: ${edgeColor}; stroke-width: ${selected || isHovered ? 6 : 4}px;`}
  onpointerenter={() => {
    isHovered = true;
  }}
  onpointerleave={() => {
    isHovered = false;
  }}
/>

{#if displayLabel && !isEditingLabel && !selected}
  <EdgeLabel x={edgeGeometry.centerX} y={edgeGeometry.centerY} transparent>
    <div
      class="canvas-edge-passive-label nodrag nopan"
      style:--canvas-edge-label-scale={labelScale}
    >
      {displayLabel}
    </div>
  </EdgeLabel>
{/if}

{#if edgeGeometry.sourceArrowPath}
  <path
    class="canvas-flow-edge-arrow"
    d={edgeGeometry.sourceArrowPath}
    fill={edgeColor}
  ></path>
{/if}

{#if edgeGeometry.targetArrowPath}
  <path
    class="canvas-flow-edge-arrow"
    d={edgeGeometry.targetArrowPath}
    fill={edgeColor}
  ></path>
{/if}

{#if selected}
  <path
    class="canvas-flow-edge-hit-area"
    d={edgeGeometry.path}
    fill="none"
    stroke="transparent"
    stroke-width={Math.max(interactionWidth ?? 20, 28)}
    stroke-linecap="round"
    stroke-linejoin="round"
    pointer-events="stroke"
    role="button"
    tabindex="0"
    aria-label="Edit connector label"
    onpointerdown={rememberSelectionState}
    onclick={handleEdgeClick}
    onkeydown={handleEdgeKeyDown}
  ></path>
{/if}

{#if selected}
  <EdgeLabel x={edgeGeometry.centerX} y={edgeGeometry.centerY} transparent>
    {#if !isEditingLabel}
      <button
        type="button"
        class="canvas-edge-label-hit-target nodrag nopan"
        style:--canvas-edge-label-interaction-scale={editableLabelScale}
        aria-label="Edit connector label"
        title="Edit connector label"
        onclick={editLabel}
      >
        {#if displayLabel}
          <span class="canvas-edge-label-hit-target-text">{displayLabel}</span>
        {/if}
        <span class="canvas-edge-label-hit-target-measure" aria-hidden="true">
          {displayLabel ?? "Connector label"}
        </span>
      </button>
    {/if}
    <div
      bind:this={toolbarAnchorElement}
      class="canvas-edge-toolbar-anchor nodrag nopan"
    >
      <div
        bind:this={toolbarElement}
        class:canvas-edge-toolbar-bottom={toolbarVertical === "bottom"}
        class="canvas-edge-toolbar"
        style:--canvas-edge-toolbar-offset-x={toolbarOffsetX}
        style:--canvas-edge-toolbar-max-width={toolbarMaxWidth}
        style:--canvas-edge-toolbar-scale={toolbarScale}
      >
        <div class="canvas-edge-toolbar-content">
          <div class="canvas-node-toolbar-actions">
            <button
              type="button"
              class="canvas-node-toolbar-button"
              onclick={removeEdge}
              aria-label="Remove connector"
              title="Remove connector"
            >
              <Trash2 aria-hidden="true" />
            </button>
            <button
              type="button"
              class="canvas-node-toolbar-button"
              onclick={editLabel}
              aria-label="Edit connector label"
              title="Edit connector label"
            >
              <Pencil aria-hidden="true" />
            </button>
            {#if displayLabel}
              <button
                type="button"
                class="canvas-node-toolbar-button"
                onclick={removeLabel}
                aria-label="Remove connector label"
                title="Remove connector label"
              >
                <X aria-hidden="true" />
              </button>
            {/if}
            <button
              type="button"
              class:active={isColorMenuOpen}
              class="canvas-node-toolbar-button"
              onclick={toggleColorMenu}
              aria-label="Set connector color"
              title="Set connector color"
              aria-haspopup="dialog"
              aria-expanded={isColorMenuOpen}
            >
              <Palette aria-hidden="true" />
            </button>
            <button
              type="button"
              class="canvas-node-toolbar-button"
              onclick={zoomToEdge}
              aria-label="Zoom to connector"
              title="Zoom to connector"
            >
              <Expand aria-hidden="true" />
            </button>
            <button
              type="button"
              class:active={isDirectionMenuOpen}
              class="canvas-node-toolbar-button"
              onclick={toggleDirectionMenu}
              aria-label="Set line direction"
              title="Set line direction"
              aria-haspopup="dialog"
              aria-expanded={isDirectionMenuOpen}
            >
              {#if directionMode === "bidirectional"}
                <ArrowLeftRight aria-hidden="true" />
              {:else if directionMode === "unidirectional"}
                <ArrowRight aria-hidden="true" />
              {:else}
                <Minus aria-hidden="true" />
              {/if}
            </button>
          </div>

          {#if isColorMenuOpen}
            <div class="canvas-edge-color-popover nodrag nopan">
              <button
                type="button"
                class:selected={!data?.color}
                class="canvas-node-color canvas-node-color-clear"
                onclick={() => chooseColor(undefined)}
                aria-label="Clear connector color"
                title="Clear connector color"
              ></button>

              {#each Object.entries(PRESET_COLORS) as [colorId, colorValue] (colorId)}
                <button
                  type="button"
                  class:selected={data?.color === colorId}
                  class="canvas-node-color"
                  style:--canvas-node-swatch={colorValue}
                  onclick={() => chooseColor(colorId)}
                  aria-label={`Set connector color ${colorId}`}
                  title={`Set connector color ${colorId}`}
                ></button>
              {/each}

              <button
                type="button"
                class:selected={hasCustomColor}
                class="canvas-node-color canvas-node-color-custom"
                onclick={openNativeColorPicker}
                aria-label="Choose custom connector color"
                title="Choose custom connector color"
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

          {#if isDirectionMenuOpen}
            <div class="canvas-edge-direction-popover nodrag nopan">
              <button
                type="button"
                class:active={directionMode === "none"}
                class="canvas-edge-direction-button"
                onclick={() => chooseDirection("none")}
                aria-label="Set line direction to non-directional"
                title="Non-directional"
              >
                <Minus aria-hidden="true" />
                <span>Non-directional</span>
              </button>
              <button
                type="button"
                class:active={directionMode === "unidirectional"}
                class="canvas-edge-direction-button"
                onclick={() => chooseDirection("unidirectional")}
                aria-label="Set line direction to unidirectional"
                title="Unidirectional"
              >
                <ArrowRight aria-hidden="true" />
                <span>Unidirectional</span>
              </button>
              <button
                type="button"
                class:active={directionMode === "bidirectional"}
                class="canvas-edge-direction-button"
                onclick={() => chooseDirection("bidirectional")}
                aria-label="Set line direction to bidirectional"
                title="Bidirectional"
              >
                <ArrowLeftRight aria-hidden="true" />
                <span>Bidirectional</span>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </EdgeLabel>
{/if}

{#if selected && isEditingLabel}
  <EdgeLabel x={edgeGeometry.centerX} y={edgeGeometry.centerY} transparent>
    <div
      class="canvas-edge-label-editor nodrag nopan"
      style:--canvas-edge-label-accent={edgeColor}
      style:--canvas-edge-label-interaction-scale={editableLabelScale}
    >
      <div
        bind:this={labelInputElement}
        class="canvas-edge-label-input"
        contenteditable="plaintext-only"
        role="textbox"
        tabindex="0"
        aria-label="Connector label"
        aria-multiline="false"
        spellcheck="false"
        data-placeholder="Connector label"
        data-empty={labelDraft.length === 0 ? "true" : "false"}
        oninput={handleLabelInput}
        onblur={handleLabelInputBlur}
        onkeydown={handleLabelInputKeyDown}
        onpaste={handleLabelInputPaste}
      ></div>
    </div>
  </EdgeLabel>
{/if}
