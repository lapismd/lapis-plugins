<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { TFile, type App } from "@lapis-notes/api";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { createLapisMiraFileAdapter } from "@lapis-notes/markdown/embed";
  import CanvasGroupBackground from "../canvas-group-background.svelte";
  import CanvasGroupBackgroundControls from "./canvas-group-background-controls.svelte";
  import CanvasNoteConversion from "./canvas-note-conversion.svelte";
  import CanvasWebPreview from "../canvas-web-preview.svelte";
  import { canvasWebUrl } from "../lib/canvas-web-url";
  import { canvasCardStyle, defaultCanvasTheme } from "../lib/canvas-contrast";
  import type { CanvasThemeContext } from "../lib/canvas-theme.svelte";
  import CanvasFileContent from "../canvas-file-content.svelte";
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
    readFlowNodeSize,
    PRESET_COLORS,
    type FlowCanvasNode,
  } from "../lib/json-canvas";
  import {
    canvasTextFile,
    createCanvasTextAdapter,
    toCanvasFileRef,
  } from "../lib/canvas-text-preview";

  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import type { CanvasDocumentSession } from "../lib/canvas-document-session";

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
  const board = getContext<CanvasBoardController | undefined>("lapis-canvas-board");
  let editingSessionStarted = false;
  $effect(() => {
    const active = isEditing && data.kind === "text";
    if (active && !editingSessionStarted) board?.beginText(id);
    editingSessionStarted = active;
  });
  const documentSession = getContext<{ readonly current: CanvasDocumentSession | null } | undefined>("lapis-canvas-document");
  const writeText = (value: string) => {
    textNodeValue = value;
    updateNodeData(id, { text: value });
  };
  const canvasSource = getContext<{ readonly current: string } | undefined>("lapis-canvas-source");
  const vaultFileAdapter = $derived(app ? createLapisMiraFileAdapter(app) : null);
  const textAdapter = createCanvasTextAdapter(textSource, writeText,
    documentSession?.current
      ? (_path, session) => documentSession.current!.bindText(id, session, (value) => {
        textSource.value = value;
        writeText(value);
      })
      : undefined,
    untrack(() => vaultFileAdapter ? { adapter: vaultFileAdapter, file: textFile, sourcePath: canvasSource?.current ?? "" } : undefined),
  );
  let wasSelectedOnPointerDown = $state(false);
  let visibleHandleTop = $state(false);
  let visibleHandleRight = $state(false);
  let visibleHandleBottom = $state(false);
  let visibleHandleLeft = $state(false);

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

    const size = readFlowNodeSize(currentNode);
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
  const theme = getContext<CanvasThemeContext | undefined>("lapis-canvas-theme");
  const presentationStyle = $derived(canvasCardStyle(theme?.current ?? defaultCanvasTheme, data.color, data.kind === "group"));
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
  const embedSourcePath = $derived(canvasSource?.current ?? "");
  function openTarget(): void {
    if (data.kind === "file") {
      if (resolvedFile && app) {
        void app.openFile(resolvedFile);
      }
      return;
    }

    if (data.kind === "link" && data.url) {
      const address = canvasWebUrl(data.url);
      if (address) window.open(address, "_blank", "noopener,noreferrer");
    }
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
  data-canvas-card-kind={data.kind}
  data-visible-handle-top={visibleHandleTop ? "true" : undefined}
  data-visible-handle-right={visibleHandleRight ? "true" : undefined}
  data-visible-handle-bottom={visibleHandleBottom ? "true" : undefined}
  data-visible-handle-left={visibleHandleLeft ? "true" : undefined}
  style={presentationStyle}
  style:--canvas-group-label-scale={groupLabelScale}
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
        aria-label="Group label"
        placeholder="Group label"
      />
    </div>
  {/if}
  <NodeResizer
    onResizeStart={() => board?.beginGesture()}
    {minWidth}
    {minHeight}
    color="transparent"
    handleClass="canvas-node-resize-handle"
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
          {#if data.kind === "text" && app}<CanvasNoteConversion {app} nodeId={id} />{/if}
          <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
            type="button"
            class="canvas-node-toolbar-button"
            onclick={removeNode}
            aria-label="Remove node"
            
          >
            <Trash2 aria-hidden="true" />
          </button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Remove node</Tooltip.Content></Tooltip.Root>
          <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
            type="button"
            class:active={isColorMenuOpen}
            class="canvas-node-toolbar-button"
            onclick={toggleColorMenu}
            aria-label="Set color"
            
            aria-haspopup="dialog"
            aria-expanded={isColorMenuOpen}
          >
            <Palette aria-hidden="true" />
          </button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Set color</Tooltip.Content></Tooltip.Root>
          <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
            type="button"
            class="canvas-node-toolbar-button"
            onclick={zoomToNode}
            aria-label="Zoom to selection"
            
          >
            <Expand aria-hidden="true" />
          </button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Zoom to selection</Tooltip.Content></Tooltip.Root>
          {#if data.kind === "group"}
            {#if app}<CanvasGroupBackgroundControls {app} nodeId={id} background={data.background} backgroundStyle={data.backgroundStyle} onOpen={() => { isColorMenuOpen = false; }} />{/if}
            <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
              type="button"
              class="canvas-node-toolbar-button"
              onclick={editLabel}
              aria-label="Edit label"
              
            >
              <Type aria-hidden="true" />
            </button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Edit label</Tooltip.Content></Tooltip.Root>
            {#if hasGroupLabel}
              <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
                type="button"
                class="canvas-node-toolbar-button"
                onclick={removeLabel}
                aria-label="Remove label"
                
              >
                <X aria-hidden="true" />
              </button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Remove label</Tooltip.Content></Tooltip.Root>
            {/if}
          {/if}
          <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
            type="button"
            class="canvas-node-toolbar-button"
            onclick={editNode}
            aria-label="Edit node"
            
          >
            <Pencil aria-hidden="true" />
          </button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Edit node</Tooltip.Content></Tooltip.Root>
        </div>

        {#if isColorMenuOpen}
          <div class="canvas-node-color-popover nodrag nopan">
            <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
              type="button"
              class:selected={!data.color}
              class="canvas-node-color canvas-node-color-clear"
              onclick={() => chooseColor(undefined)}
              aria-label="Clear node color"
              
            ></button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Clear node color</Tooltip.Content></Tooltip.Root>

            {#each colorOptions as [colorId, colorValue] (colorId)}
              <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
                type="button"
                class:selected={data.color === colorId}
                class="canvas-node-color"
                style:--canvas-node-swatch={colorValue}
                onclick={() => chooseColor(colorId)}
                aria-label={`Set node color ${colorId}`}
                
              ></button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>{`Set node color ${colorId}`}</Tooltip.Content></Tooltip.Root>
            {/each}

            <Tooltip.Root><Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<button {...tooltipProps}
              type="button"
              class:selected={hasCustomColor}
              class="canvas-node-color canvas-node-color-custom"
              onclick={openNativeColorPicker}
              aria-label="Choose custom node color"
              
            ></button>{/snippet}</Tooltip.Trigger><Tooltip.Content sideOffset={6}>Choose custom node color</Tooltip.Content></Tooltip.Root>
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
            <CanvasFileContent {app} path={data.file ?? ""} subpath={data.subpath} sourcePath={embedSourcePath} />
          {/if}
        </div>
      {/if}
    {:else if data.kind === "group"}
      {#if data.background}<CanvasGroupBackground {app} path={data.background} mode={data.backgroundStyle} sourcePath={canvasSource?.current ?? ""} />{/if}
      <div class="canvas-group-surface-spacer" aria-hidden="true"></div>
    {:else}
      <input
        bind:this={editableElement}
        class="canvas-node-input canvas-node-input-editable nodrag nopan"
        type="text"
        value={displayNodeValue(data)}
        oninput={handleInput}
        aria-label={data.kind === "link" ? "Web address" : "Group label"}
        placeholder={data.kind === "link"
          ? "https://example.com"
          : "Group label"}
      />
    {/if}

    {#if data.kind === "link"}
      <CanvasWebPreview url={data.url ?? ""} />
    {/if}
  {/snippet}

  {#if isEditablePreviewNode}
    <button type="button" class="canvas-card-edit-button nodrag nopan" onclick={editNode}
      aria-label={data.kind === "text" ? "Edit text node" : "Edit markdown file node"}>Edit</button>
    <div
      class:canvas-node-label-group={data.kind === "group"}
      class:nodrag={isEditing}
      class:nopan={isEditing}
      class="canvas-node-label"
      onpointerup={handleNodeClick}
      onpointerdown={rememberSelectionState}
      role="presentation"
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
