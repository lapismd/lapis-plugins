<script lang="ts">
  import { TFile, type App } from "@lapis-notes/api";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { createLapisMiraFileAdapter, FileEmbed } from "@lapis-notes/markdown/embed";
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import "@lapismd/mira/preview/styles.css";
  import { getContext, tick, untrack } from "svelte";
  import Expand from "@lucide/svelte/icons/expand";
  import Palette from "@lucide/svelte/icons/palette";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Type from "@lucide/svelte/icons/type";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import X from "@lucide/svelte/icons/x";
  import {
    Handle,
    NodeResizer,
    Position,
    useStore,
    useSvelteFlow,
    useViewport,
    type NodeProps,
  } from "@xyflow/svelte";
  import {
    DEFAULT_GROUP_HEIGHT,
    DEFAULT_GROUP_WIDTH,
    MIN_GROUP_HEIGHT,
    MIN_GROUP_WIDTH,
    MIN_NODE_HEIGHT,
    MIN_NODE_WIDTH,
    DEFAULT_NODE_HEIGHT,
    DEFAULT_NODE_WIDTH,
    displayNodeValue,
    parseNodeSize,
    PRESET_COLORS,
    resolveCanvasColor,
    type FlowCanvasNode,
  } from "../lib/json-canvas";
  import {
    canvasTextFile,
    createCanvasTextAdapter,
    toCanvasFileRef,
  } from "../lib/canvas-text-preview";

  let { id, data, selected }: NodeProps<FlowCanvasNode> = $props();

  const canvasApp = getContext<{ readonly current: App | undefined } | undefined>(
    "lapis-canvas-app",
  );
  const app = $derived(canvasApp?.current);
  const store = useStore<FlowCanvasNode>();
  const { deleteElements, getNodes, setCenter, updateNodeData } =
    useSvelteFlow();
  const viewport = useViewport();
  const markdownExtensions = new Set(["md", "markdown"]);
  const presetColorIds = new Set(Object.keys(PRESET_COLORS));
  const markdownInteractiveSelector = [
    "a",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
    "details",
    "audio",
    "video",
    "[contenteditable='true']",
    "[data-editable-markdown-ignore-click]",
  ].join(", ");

  let isColorMenuOpen = $state(false);
  let nativeColorInput = $state<HTMLInputElement | null>(null);
  let shellElement = $state<HTMLElement | null>(null);
  let toolbarElement = $state<HTMLElement | null>(null);
  let toolbarMaxWidth = $state("calc(100vw - 1.5rem)");
  let toolbarOffsetX = $state("0px");
  let toolbarVertical = $state<"top" | "bottom">("top");
  let nativeColorValue = $state("#8260ff");
  let contentPreviewElement = $state<HTMLElement | null>(null);
  let isEditing = $state(false);
  let editableElement = $state<HTMLInputElement | null>(null);
  const textSource = {
    value: untrack(() => (data.kind === "text" ? (data.text ?? "") : "")),
  };
  let textNodeValue = $state(textSource.value);
  const textFile = $derived(canvasTextFile(id));
  const textAdapter = createCanvasTextAdapter(textSource, (value) => {
    textNodeValue = value;
  });
  const vaultFileAdapter = $derived(
    app ? createLapisMiraFileAdapter(app) : null,
  );
  let wasSelectedOnPointerDown = $state(false);
  let visibleHandleTop = $state(false);
  let visibleHandleRight = $state(false);
  let visibleHandleBottom = $state(false);
  let visibleHandleLeft = $state(false);

  type RgbColor = [number, number, number];

  function parseCanvasColorToRgb(
    color: string | undefined,
  ): RgbColor | undefined {
    if (!color) {
      return undefined;
    }

    const normalized = color.trim();
    const hexMatch = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/i);

    if (hexMatch) {
      const hex =
        hexMatch[1].length === 3
          ? hexMatch[1]
              .split("")
              .map((value) => `${value}${value}`)
              .join("")
          : hexMatch[1];

      return [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
      ];
    }

    const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1]
        .split(",")
        .slice(0, 3)
        .map((value) => Number.parseFloat(value.trim()));

      if (parts.every((value) => Number.isFinite(value))) {
        return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
      }
    }

    const fallbackVarMatch = normalized.match(
      /var\(--canvas-color-\d+,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i,
    );
    if (fallbackVarMatch) {
      return [
        Number.parseInt(fallbackVarMatch[1] ?? "0", 10),
        Number.parseInt(fallbackVarMatch[2] ?? "0", 10),
        Number.parseInt(fallbackVarMatch[3] ?? "0", 10),
      ];
    }

    return undefined;
  }

  function mixRgb(
    base: RgbColor,
    overlay: RgbColor,
    overlayWeight: number,
  ): RgbColor {
    const baseWeight = 1 - overlayWeight;
    return [
      Math.round(base[0] * baseWeight + overlay[0] * overlayWeight),
      Math.round(base[1] * baseWeight + overlay[1] * overlayWeight),
      Math.round(base[2] * baseWeight + overlay[2] * overlayWeight),
    ];
  }

  function rgbToCss(color: RgbColor): string {
    return `rgb(${color[0]} ${color[1]} ${color[2]})`;
  }

  function toLinearSrgb(channel: number): number {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  }

  function chooseBlackOrWhiteText(background: RgbColor): "black" | "white" {
    const [red, green, blue] = background;
    const perceivedBrightness = Math.sqrt(
      0.299 * red ** 2 + 0.587 * green ** 2 + 0.114 * blue ** 2,
    );

    return perceivedBrightness > 140 ? "black" : "white";
  }

  function isLightCanvasColor(color: string | undefined): boolean {
    const rgb = parseCanvasColorToRgb(color);
    if (!rgb) {
      return false;
    }

    const [red, green, blue] = rgb;
    const perceivedLuminance = (red * 299 + green * 587 + blue * 114) / 1000;
    return perceivedLuminance >= 168;
  }

  function extensionFromPath(path: string | undefined): string {
    if (!path) {
      return "";
    }

    const name = path.split("/").pop() ?? path;
    const dotIndex = name.lastIndexOf(".");
    return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : "";
  }

  function handleInput(event: Event): void {
    updateValue((event.currentTarget as HTMLInputElement).value);
  }

  function updateValue(value: string): void {
    switch (data.kind) {
      case "file":
        updateNodeData(id, { file: value });
        break;
      case "link":
        updateNodeData(id, { url: value });
        break;
      case "group":
        updateNodeData(id, { label: value });
        break;
      case "text":
      default:
        updateNodeData(id, { text: value });
        break;
    }
  }

  function updateColor(color: string | undefined): void {
    updateNodeData(id, { color });
  }

  function chooseColor(color: string | undefined): void {
    updateColor(color);
    isColorMenuOpen = false;
  }

  async function removeNode(): Promise<void> {
    isColorMenuOpen = false;
    await deleteElements({ nodes: [{ id }] });
  }

  async function zoomToNode(): Promise<void> {
    isColorMenuOpen = false;

    const currentNode = getNodes().find((node) => node.id === id);
    if (!currentNode) {
      return;
    }

    const size = parseNodeSize(
      typeof currentNode.style === "string" ? currentNode.style : undefined,
    );
    const width = currentNode.measured?.width ?? size.width;
    const height = currentNode.measured?.height ?? size.height;

    await setCenter(
      currentNode.position.x + width / 2,
      currentNode.position.y + height / 2,
      {
        zoom: 1.35,
        duration: 180,
      },
    );
  }

  function updateToolbarPlacement(): void {
    if (!shellElement || !toolbarElement) {
      return;
    }

    const container =
      shellElement.closest(".canvas-view-surface") ??
      shellElement.closest(".workspace-leaf-content") ??
      document.documentElement;
    const shellRect = shellElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const padding = 12;
    toolbarMaxWidth = `${Math.max(160, Math.floor(containerRect.width - padding * 2))}px`;
    const toolbarRect = toolbarElement.getBoundingClientRect();
    const toolbarWidth = toolbarRect.width || 220;
    const toolbarHeight = toolbarRect.height || 52;
    const gap = 14;
    const desiredLeft = shellRect.left + shellRect.width / 2 - toolbarWidth / 2;
    const minLeft = containerRect.left + padding;
    const maxLeft = Math.max(
      minLeft,
      containerRect.right - padding - toolbarWidth,
    );
    const clampedLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
    const spaceAbove = shellRect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - shellRect.bottom;
    const requiredHeight = toolbarHeight + gap;

    toolbarOffsetX = `${Math.round(clampedLeft - desiredLeft)}px`;
    toolbarVertical =
      spaceAbove >= requiredHeight || spaceAbove >= spaceBelow
        ? "top"
        : "bottom";
  }

  function rememberSelectionState(): void {
    wasSelectedOnPointerDown = selected;
  }

  async function enterEditMode(): Promise<void> {
    if (data.kind === "text" || isEditableMarkdownFile) {
      isEditing = true;
      await tick();
      return;
    }

    editableElement?.focus();
  }

  function handleNodeClick(): void {
    if (
      !selected ||
      !wasSelectedOnPointerDown ||
      isEditing ||
      !isEditablePreviewNode
    ) {
      return;
    }

    void enterEditMode();
  }

  function handleNodeKeyDown(event: KeyboardEvent): void {
    if (
      (event.key !== "Enter" && event.key !== " ") ||
      !selected ||
      isEditing ||
      !isEditablePreviewNode
    ) {
      return;
    }

    event.preventDefault();
    void enterEditMode();
  }

  function editNode(): void {
    isColorMenuOpen = false;
    void enterEditMode();
  }

  async function editLabel(): Promise<void> {
    if (data.kind !== "group") {
      return;
    }

    isColorMenuOpen = false;
    await tick();
    editableElement?.focus();
    editableElement?.select();
  }

  function removeLabel(): void {
    if (data.kind !== "group") {
      return;
    }

    isColorMenuOpen = false;
    updateNodeData(id, { label: undefined });
  }

  async function toggleColorMenu(): Promise<void> {
    isColorMenuOpen = !isColorMenuOpen;

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

  function kindLabel(kind: string): string {
    switch (kind) {
      case "file":
        return "File";
      case "link":
        return "Link";
      case "group":
        return "Group";
      default:
        return "Text";
    }
  }

  let minWidth = $derived(
    data.kind === "group" ? MIN_GROUP_WIDTH : MIN_NODE_WIDTH,
  );
  let minHeight = $derived(
    data.kind === "group" ? MIN_GROUP_HEIGHT : MIN_NODE_HEIGHT,
  );
  let accentColor = $derived(
    resolveCanvasColor(data.color) ?? "var(--background-modifier-border)",
  );
  let nodeFill = $derived.by(() => {
    if (data.kind === "group") {
      return data.color
        ? `color-mix(in srgb, ${accentColor} 14%, transparent)`
        : "color-mix(in srgb, var(--background-secondary) 75%, transparent)";
    }

    return data.color
      ? `color-mix(in srgb, ${accentColor} 18%, var(--background-secondary))`
      : "var(--background-secondary)";
  });
  let nodeBorder = $derived(
    data.color
      ? `color-mix(in srgb, ${accentColor} 45%, var(--background-modifier-border))`
      : "var(--background-modifier-border)",
  );
  let nodeInputBackground = $derived(
    data.color
      ? `color-mix(in srgb, ${accentColor} 10%, var(--surface-inline-input-background))`
      : "var(--surface-inline-input-background)",
  );
  let kindColor = $derived(
    data.color
      ? `color-mix(in srgb, ${accentColor} 70%, var(--text-normal))`
      : "var(--canvas-card-label-color, var(--text-faint))",
  );
  let nodeShadow = $derived(
    data.color
      ? `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 20%, transparent)`
      : "none",
  );
  let selectedBorderColor = $derived(
    data.color
      ? nodeBorder
      : "var(--interactive-accent-hover, var(--interactive-accent))",
  );
  let groupLabelBackgroundRgb = $derived.by(() => {
    if (data.kind !== "group" || !data.color) {
      return undefined;
    }

    const accentRgb = parseCanvasColorToRgb(accentColor);
    if (!accentRgb) {
      return undefined;
    }

    return isLightCanvasColor(accentColor)
      ? mixRgb(accentRgb, [255, 255, 255], 0.28)
      : mixRgb(accentRgb, [0, 0, 0], 0.22);
  });
  let groupLabelBackground = $derived(
    data.kind === "group"
      ? data.color
        ? groupLabelBackgroundRgb
          ? rgbToCss(groupLabelBackgroundRgb)
          : isLightCanvasColor(accentColor)
            ? `color-mix(in srgb, ${accentColor} 72%, white 28%)`
            : `color-mix(in srgb, ${accentColor} 78%, black 22%)`
        : "color-mix(in srgb, var(--background-modifier-border) 78%, black 22%)"
      : "transparent",
  );
  let groupLabelBorder = $derived(
    data.kind === "group"
      ? data.color
        ? isLightCanvasColor(accentColor)
          ? `color-mix(in srgb, ${accentColor} 54%, black 46%)`
          : `color-mix(in srgb, ${accentColor} 52%, black 48%)`
        : "color-mix(in srgb, var(--background-modifier-border) 68%, black 32%)"
      : "transparent",
  );
  let groupLabelTextColor = $derived(
    data.kind === "group"
      ? data.color
        ? groupLabelBackgroundRgb
          ? chooseBlackOrWhiteText(groupLabelBackgroundRgb)
          : isLightCanvasColor(accentColor)
            ? "black"
            : "white"
        : "var(--text-normal)"
      : "var(--text-normal)",
  );
  let toolbarScale = $derived(1 / Math.max(viewport.current.zoom, 0.0001));
  let groupLabelScale = $derived(Math.max(viewport.current.zoom, 0.9));
  let useLowZoomNodePreview = $derived(
    viewport.current.zoom < 0.3 &&
      (data.kind === "text" || data.kind === "file"),
  );
  let selectedNodesCount = $derived(store.selectedNodes.length);
  let showNodeToolbar = $derived(selected && selectedNodesCount <= 1);
  let hasGroupLabel = $derived(
    data.kind === "group" && Boolean(data.label?.trim()),
  );
  let colorOptions = Object.entries(PRESET_COLORS);
  let hasCustomColor = $derived(
    Boolean(data.color && !presetColorIds.has(data.color)),
  );
  let fileNodeSectionId = $derived(
    data.kind === "file" ? data.subpath?.replace(/^#/, "") : undefined,
  );
  let fileNodeId = $derived.by(() => {
    if (data.kind !== "file") {
      return "";
    }

    return data.subpath
      ? `${data.file ?? ""}${data.subpath}`
      : (data.file ?? "");
  });
  let resolvedFile = $derived.by(() => {
    if (data.kind !== "file" || !data.file || !app) {
      return null;
    }

    const file = app.vault.getAbstractFileByPath(data.file);
    return file instanceof TFile ? file : null;
  });
  let fileExtension = $derived.by(() => {
    if (resolvedFile) {
      return resolvedFile.extension.toLowerCase();
    }

    return extensionFromPath(data.kind === "file" ? data.file : undefined);
  });
  let fileNodeDisplayName = $derived.by(() => {
    if (data.kind !== "file") {
      return "";
    }

    if (resolvedFile) {
      return resolvedFile.name;
    }

    const path = data.file ?? "";
    return path.split("/").pop() ?? path;
  });
  let isEditableMarkdownFile = $derived(
    data.kind === "file" &&
      !fileNodeSectionId &&
      resolvedFile instanceof TFile &&
      markdownExtensions.has(fileExtension),
  );
  let isEditablePreviewNode = $derived(
    !useLowZoomNodePreview && (data.kind === "text" || isEditableMarkdownFile),
  );
  let embedSourcePath = $derived.by(() => {
    if (!app) {
      return "";
    }

    const activeView = app.workspace.activeLeaf?.view as
      | { file?: TFile | null }
      | undefined;
    return activeView?.file?.path ?? "";
  });
  let linkHost = $derived.by(() => {
    if (data.kind !== "link" || !data.url) {
      return null;
    }

    try {
      return new URL(data.url).host;
    } catch {
      return null;
    }
  });

  function openTarget(): void {
    if (data.kind === "file") {
      if (resolvedFile && app) {
        void app.openFile(resolvedFile);
      }
      return;
    }

    if (data.kind === "link" && data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleNodeActionPointerDown(event: PointerEvent): void {
    event.stopPropagation();
  }

  function clearVisibleHandles(): void {
    visibleHandleTop = false;
    visibleHandleRight = false;
    visibleHandleBottom = false;
    visibleHandleLeft = false;
  }

  function setVisibleHandlesFromTarget(target: EventTarget | null): void {
    if (!(target instanceof Element)) {
      clearVisibleHandles();
      return;
    }

    const interactiveElement = target.closest(
      ".svelte-flow__resize-control, .canvas-node-handle",
    );
    if (
      !(interactiveElement instanceof Element) ||
      !shellElement?.contains(interactiveElement)
    ) {
      clearVisibleHandles();
      return;
    }

    visibleHandleTop = interactiveElement.classList.contains("top");
    visibleHandleRight = interactiveElement.classList.contains("right");
    visibleHandleBottom = interactiveElement.classList.contains("bottom");
    visibleHandleLeft = interactiveElement.classList.contains("left");
  }

  function handleOpenTargetClick(event: MouseEvent): void {
    event.stopPropagation();
    openTarget();
  }

  $effect(() => {
    if (!showNodeToolbar) {
      isColorMenuOpen = false;
    }

    if (!selected) {
      isEditing = false;
    }
  });

  $effect(() => {
    if (data.kind !== "text" || isEditing) {
      return;
    }

    const nextValue = data.text ?? "";
    if (textNodeValue !== nextValue) {
      textSource.value = nextValue;
      textNodeValue = nextValue;
      textAdapter.reload();
    }
  });

  $effect(() => {
    if (data.kind !== "text") {
      return;
    }

    const nextValue = data.text ?? "";
    if (textNodeValue !== nextValue) {
      updateNodeData(id, { text: textNodeValue });
    }
  });

  $effect(() => {
    if (
      !data.color ||
      presetColorIds.has(data.color) ||
      !/^#[\da-f]{6}$/i.test(data.color)
    ) {
      return;
    }

    nativeColorValue = data.color;
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

  $effect(() => {
    if (!showNodeToolbar || !shellElement || !toolbarElement) {
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

  $effect(() => {
    const shell = shellElement;
    if (!shell) {
      return;
    }

    const interactiveElements = Array.from(
      shell.querySelectorAll<HTMLElement>(
        ".svelte-flow__resize-control, .canvas-node-handle",
      ),
    );

    const handlePointerEnter = (event: Event) => {
      setVisibleHandlesFromTarget(event.currentTarget);
    };

    const handlePointerLeave = (event: Event) => {
      const relatedTarget =
        event instanceof PointerEvent ? event.relatedTarget : null;
      if (relatedTarget instanceof Node && shell.contains(relatedTarget)) {
        setVisibleHandlesFromTarget(relatedTarget);
        return;
      }

      clearVisibleHandles();
    };

    const handleFocus = (event: Event) => {
      setVisibleHandlesFromTarget(event.currentTarget);
    };

    const handleBlur = (event: Event) => {
      const relatedTarget =
        event instanceof FocusEvent ? event.relatedTarget : null;
      if (relatedTarget instanceof Node && shell.contains(relatedTarget)) {
        setVisibleHandlesFromTarget(relatedTarget);
        return;
      }

      clearVisibleHandles();
    };

    for (const element of interactiveElements) {
      element.addEventListener("pointerenter", handlePointerEnter);
      element.addEventListener("pointerleave", handlePointerLeave);
      element.addEventListener("focus", handleFocus);
      element.addEventListener("blur", handleBlur);
    }

    return () => {
      for (const element of interactiveElements) {
        element.removeEventListener("pointerenter", handlePointerEnter);
        element.removeEventListener("pointerleave", handlePointerLeave);
        element.removeEventListener("focus", handleFocus);
        element.removeEventListener("blur", handleBlur);
      }

      clearVisibleHandles();
    };
  });

  $effect(() => {
    if (!contentPreviewElement || !isEditablePreviewNode || isEditing) {
      return;
    }

    textNodeValue;
    fileNodeId;

    for (const element of contentPreviewElement.querySelectorAll(
      markdownInteractiveSelector,
    )) {
      element.classList.add("nodrag", "nopan");
      element.setAttribute("draggable", "false");
    }
  });
</script>

<div
  bind:this={shellElement}
  class:selected
  class:canvas-node-shell-group={data.kind === "group"}
  class="canvas-node-shell"
  data-visible-handle-top={visibleHandleTop ? "true" : undefined}
  data-visible-handle-right={visibleHandleRight ? "true" : undefined}
  data-visible-handle-bottom={visibleHandleBottom ? "true" : undefined}
  data-visible-handle-left={visibleHandleLeft ? "true" : undefined}
  style:--canvas-node-accent={accentColor}
  style:--canvas-node-fill={nodeFill}
  style:--canvas-node-border={nodeBorder}
  style:--canvas-node-input-background={nodeInputBackground}
  style:--canvas-node-kind-color={kindColor}
  style:--canvas-node-shadow={nodeShadow}
  style:--canvas-group-label-background={groupLabelBackground}
  style:--canvas-group-label-border={groupLabelBorder}
  style:--canvas-group-label-text={groupLabelTextColor}
  style:--canvas-group-label-scale={groupLabelScale}
  style:--canvas-node-selected-border={selectedBorderColor}
>
  {#if data.kind === "file" && fileNodeDisplayName && !useLowZoomNodePreview}
    <div class="canvas-node-file-label">{fileNodeDisplayName}</div>
  {/if}
  {#if data.kind === "group"}
    <div class="canvas-group-label-badge nodrag nopan">
      <input
        bind:this={editableElement}
        class="canvas-node-input canvas-node-input-editable canvas-group-label-input nodrag nopan"
        type="text"
        value={displayNodeValue(data)}
        oninput={handleInput}
        placeholder="Group label"
      />
    </div>
  {/if}
  <NodeResizer
    {minWidth}
    {minHeight}
    color="transparent"
    handleClass="canvas-node-resize-handle"
    handleStyle="background-color: transparent !important; border-color: transparent !important;"
    lineClass="canvas-node-resize-line"
    lineStyle="border-color: transparent !important; background-color: transparent !important;"
  />
  {#if showNodeToolbar}
    <div
      class:canvas-node-toolbar-bottom={toolbarVertical === "bottom"}
      class="canvas-node-toolbar nodrag nopan"
      bind:this={toolbarElement}
      style:--canvas-node-toolbar-offset-x={toolbarOffsetX}
      style:--canvas-node-toolbar-max-width={toolbarMaxWidth}
      style:--canvas-node-toolbar-scale={toolbarScale}
    >
      <div class="canvas-node-toolbar-content">
        <div class="canvas-node-toolbar-actions">
          <button
            type="button"
            class="canvas-node-toolbar-button"
            onclick={removeNode}
            aria-label="Remove node"
            title="Remove node"
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
            onclick={zoomToNode}
            aria-label="Zoom to selection"
            title="Zoom to selection"
          >
            <Expand aria-hidden="true" />
          </button>
          {#if data.kind === "group"}
            <button
              type="button"
              class="canvas-node-toolbar-button"
              onclick={editLabel}
              aria-label="Edit label"
              title="Edit label"
            >
              <Type aria-hidden="true" />
            </button>
            {#if hasGroupLabel}
              <button
                type="button"
                class="canvas-node-toolbar-button"
                onclick={removeLabel}
                aria-label="Remove label"
                title="Remove label"
              >
                <X aria-hidden="true" />
              </button>
            {/if}
          {/if}
          <button
            type="button"
            class="canvas-node-toolbar-button"
            onclick={editNode}
            aria-label="Edit node"
            title="Edit node"
          >
            <Pencil aria-hidden="true" />
          </button>
        </div>

        {#if isColorMenuOpen}
          <div class="canvas-node-color-popover nodrag nopan">
            <button
              type="button"
              class:selected={!data.color}
              class="canvas-node-color canvas-node-color-clear"
              onclick={() => chooseColor(undefined)}
              aria-label="Clear node color"
              title="Clear node color"
            ></button>

            {#each colorOptions as [colorId, colorValue] (colorId)}
              <button
                type="button"
                class:selected={data.color === colorId}
                class="canvas-node-color"
                style:--canvas-node-swatch={colorValue}
                onclick={() => chooseColor(colorId)}
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
    </div>
  {/if}
  <div
    class="canvas-node-edge-activator canvas-node-edge-activator-top"
    aria-hidden="true"
  ></div>
  <div
    class="canvas-node-edge-activator canvas-node-edge-activator-right"
    aria-hidden="true"
  ></div>
  <div
    class="canvas-node-edge-activator canvas-node-edge-activator-bottom"
    aria-hidden="true"
  ></div>
  <div
    class="canvas-node-edge-activator canvas-node-edge-activator-left"
    aria-hidden="true"
  ></div>
  <Handle
    class="canvas-node-handle canvas-node-handle-top"
    id="top-target"
    type="target"
    position={Position.Top}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-top canvas-node-handle-source"
    id="top-source"
    type="source"
    position={Position.Top}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-right"
    id="right-target"
    type="target"
    position={Position.Right}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-right canvas-node-handle-source"
    id="right-source"
    type="source"
    position={Position.Right}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-bottom"
    id="bottom-target"
    type="target"
    position={Position.Bottom}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-bottom canvas-node-handle-source"
    id="bottom-source"
    type="source"
    position={Position.Bottom}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-left"
    id="left-target"
    type="target"
    position={Position.Left}
  />
  <Handle
    class="canvas-node-handle canvas-node-handle-left canvas-node-handle-source"
    id="left-source"
    type="source"
    position={Position.Left}
  />

  {#snippet nodeLabelContent()}
    {#if data.kind === "text"}
      {#if useLowZoomNodePreview}
        <div class="canvas-node-low-zoom-text" aria-hidden="true">
          <Skeleton
            class="canvas-node-low-zoom-skeleton canvas-node-low-zoom-skeleton-full"
          />
          <Skeleton
            class="canvas-node-low-zoom-skeleton canvas-node-low-zoom-skeleton-wide"
          />
          <Skeleton
            class="canvas-node-low-zoom-skeleton canvas-node-low-zoom-skeleton-narrow"
          />
        </div>
      {:else}
        <div
          bind:this={contentPreviewElement}
          class:canvas-node-markdown-preview-active={selected || isEditing}
          class:nowheel={selected || isEditing}
          class="canvas-node-markdown-preview"
        >
          {#if textNodeValue.trim() || (selected && isEditing)}
            <EditableMarkdownPreview
              file={textFile}
              fileAdapter={textAdapter}
              highlight={false}
              activateOnPreviewInteraction={false}
              bind:editing={isEditing}
            />
          {:else}
            <div class="canvas-node-markdown-placeholder">Write a note</div>
          {/if}
        </div>
      {/if}
    {:else if data.kind === "file"}
      {#if useLowZoomNodePreview}
        <div class="canvas-node-low-zoom-file-body">
          <div class="canvas-node-low-zoom-file-name">
            {fileNodeDisplayName}
          </div>
        </div>
      {:else}
        <div
          bind:this={contentPreviewElement}
          class:canvas-node-markdown-preview-active={selected || isEditing}
          class:nowheel={selected || isEditing}
          class="canvas-node-markdown-preview"
        >
          {#if isEditableMarkdownFile && resolvedFile && vaultFileAdapter}
            <EditableMarkdownPreview
              file={toCanvasFileRef(resolvedFile)}
              fileAdapter={vaultFileAdapter}
              highlight={false}
              activateOnPreviewInteraction={false}
              bind:editing={isEditing}
            />
          {:else if app}
            <FileEmbed
              {app}
              id={fileNodeId}
              file={resolvedFile}
              text={resolvedFile?.name}
              sectionId={fileNodeSectionId}
              sourcePath={embedSourcePath}
            />
          {/if}
        </div>
      {/if}
    {:else if data.kind === "group"}
      <div class="canvas-group-surface-spacer" aria-hidden="true"></div>
    {:else}
      <input
        bind:this={editableElement}
        class="canvas-node-input canvas-node-input-editable nodrag nopan"
        type="text"
        value={displayNodeValue(data)}
        oninput={handleInput}
        placeholder={data.kind === "link"
          ? "https://example.com"
          : "Group label"}
      />
    {/if}

    {#if data.kind === "link"}
      <div class="canvas-node-meta nodrag nopan">
        <div class="canvas-node-meta-text">{linkHost ?? "Invalid URL"}</div>
        <button
          type="button"
          class="canvas-node-action nodrag nopan"
          onpointerdown={handleNodeActionPointerDown}
          onclick={handleOpenTargetClick}
          disabled={!data.url}>Open link</button
        >
      </div>
    {/if}
  {/snippet}

  {#if isEditablePreviewNode}
    <div
      class:canvas-node-label-group={data.kind === "group"}
      class:nodrag={isEditing}
      class:nopan={isEditing}
      class="canvas-node-label"
      onclick={handleNodeClick}
      onkeydown={handleNodeKeyDown}
      onpointerdown={rememberSelectionState}
      role="button"
      tabindex="0"
      aria-label={data.kind === "text"
        ? "Edit text node"
        : "Edit markdown file node"}
    >
      {@render nodeLabelContent()}
    </div>
  {:else}
    <div
      role="presentation"
      class:canvas-node-label-group={data.kind === "group"}
      class="canvas-node-label"
      onpointerdown={rememberSelectionState}
    >
      {@render nodeLabelContent()}
    </div>
  {/if}
</div>
