<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { setContext } from "svelte";
  import {
    Background,
    MiniMap,
    PanOnScrollMode,
    SvelteFlow,
  } from "@xyflow/svelte";

  import { createCanvasTheme } from "./lib/canvas-theme.svelte";
  import { acquireCanvasStyles } from "./lib/canvas-styles";
  import { canvasOwnerKey } from "./lib/canvas-embed-boundary";
  import CanvasControls from "./canvas-view/canvas-controls.svelte";
  import CanvasNavigation from "./canvas-view/canvas-navigation.svelte";
  import CanvasEdge from "./canvas-view/canvas-edge.svelte";
  import CanvasFitController from "./canvas-view/canvas-fit-controller.svelte";
  import CanvasEmbedNode from "./canvas-embed-node.svelte";
  import {
    CanvasFlowEdgeType,
    normalizeCanvas,
    parseJsonCanvas,
    resolveCanvasEmbedFileContent,
    toFlowDocument,
    type CanvasEmbedFileContents,
    type JsonCanvas,
  } from "./lib/json-canvas";

  type Props = {
    app?: App;
    value: JsonCanvas | string;
    sourcePath?: string;
    loadError?: string | null;
    compact?: boolean;
    class?: string;
    minZoom?: number;
    fileContents?: CanvasEmbedFileContents;
  };

  let {
    app,
    value,
    sourcePath = "",
    loadError = null,
    compact = false,
    class: className = "",
    minZoom = 0.03,
    fileContents = {},
  }: Props = $props();

  const theme = createCanvasTheme();
  setContext("lapis-canvas-theme", theme);
  setContext("lapis-canvas-readonly", { current: true });
  setContext("lapis-canvas-source", { get current() { return sourcePath; } });
  setContext("lapis-canvas-app", {
    get current() {
      return app;
    },
  });

  const nodeTypes = {
    "canvas-node": CanvasEmbedNode,
  };
  const edgeTypes = {
    [CanvasFlowEdgeType]: CanvasEdge,
  };

  const parsedDocument = $derived.by(() => {
    try {
      if (loadError) throw new Error(loadError);
      return {
        canvas:
          typeof value === "string"
            ? parseJsonCanvas(value)
            : normalizeCanvas(value),
        error: null,
      };
    } catch (error) {
      return {
        canvas: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const flowDocument = $derived.by(() => {
    if (!parsedDocument.canvas) {
      return { nodes: [], edges: [] };
    }

    const flow = toFlowDocument(parsedDocument.canvas);
    return {
      nodes: flow.nodes.map((node) => {
        if (node.data.kind !== "file") {
          return node;
        }

        const preview = resolveCanvasEmbedFileContent(
          fileContents,
          node.data.file,
          node.data.subpath,
        );

        if (!preview) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            previewValue: preview.value,
            previewSourcePath: preview.sourcePath,
          },
        };
      }),
      edges: flow.edges,
    };
  });

  let surface = $state<HTMLElement | null>(null);
  $effect(() => { if (surface) return acquireCanvasStyles(surface.ownerDocument); });
  $effect(() => { if (surface) return theme.attach(surface); });

  let navigationError = $state<string | null>(null);
  const sourceFile = $derived.by(() => {
    void value;
    void loadError;
    return app && sourcePath ? app.vault.getFileByPath(sourcePath) : null;
  });
  async function openOriginal(): Promise<void> {
    if (!app || !sourceFile) return;
    try { await app.openFile(sourceFile); }
    catch (error) { navigationError = error instanceof Error ? error.message : String(error); }
  }

  function mergeClassName(
    baseClassName: string,
    extraClassName: string,
  ): string {
    return `${baseClassName} ${extraClassName}`.trim();
  }
</script>

<section bind:this={surface} style={theme.style} class={mergeClassName("canvas-view-root canvas-embed", className)} class:canvas-embed-static={!sourcePath || compact}
  data-canvas-boundary data-canvas-owner={canvasOwnerKey(app)} data-canvas-embed data-canvas-source-path={sourcePath || undefined} role="group" aria-label={sourcePath ? `Embedded canvas: ${sourcePath}` : "Embedded canvas"}>
  {#if sourcePath}
    <header class="canvas-embed-header">
      <span class="canvas-embed-path">{sourcePath}</span>
      <span class="canvas-embed-mode">Read-only</span>
      <button type="button" disabled={!sourceFile} onclick={() => void openOriginal()} aria-label="Open original canvas">Open canvas</button>
    </header>
  {/if}
  {#if navigationError}<p role="alert">{navigationError}</p>{/if}
  {#if parsedDocument.error}
    <div class="canvas-view-error" data-canvas-embed-error role="alert">
      <div class="canvas-view-error-card">
        <h2>Canvas file could not be read</h2>
        <p>The supplied JSON Canvas document is unavailable or invalid.</p>
        <pre>{parsedDocument.error}</pre>
      </div>
    </div>
  {:else}
    <div class="canvas-view-surface">
      <SvelteFlow
        ariaLabelConfig={{
          "node.a11yDescription.default": "Read-only canvas card. Use Open canvas to edit the original.",
          "node.a11yDescription.keyboardDisabled": "Read-only canvas card. Use Open canvas to edit the original.",
          "edge.a11yDescription.default": "Read-only connector between canvas cards.",
        }}
        edges={flowDocument.edges}
        elementsSelectable={false}
        edgesFocusable={false}
        nodesFocusable={false}
        {edgeTypes}
        fitView
        {minZoom}
        {nodeTypes}
        nodes={flowDocument.nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        panOnDrag
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        selectionOnDrag={false}
        zoomOnScroll={false}
      >
        <Background />
        <MiniMap bgColor="var(--canvas-readable-board)" nodeColor={(node) => node.data.kind === "group" ? "transparent" : "var(--canvas-readable-indicator)"} nodeStrokeColor="var(--canvas-readable-indicator)" maskColor="transparent" maskStrokeColor="var(--canvas-readable-indicator)" maskStrokeWidth={2} />
        <CanvasControls readOnly />
        <CanvasNavigation readOnly />
        <CanvasFitController responsive revision={value} container={surface} />
      </SvelteFlow>
    </div>
  {/if}
</section>

<style>
  .canvas-embed { display: flex; flex-direction: column; width: 100%; height: clamp(16rem, 45vh, 32rem); min-height: 12rem; max-height: 75vh; overflow: hidden; resize: vertical; }
  .canvas-embed-static { height: 100%; min-height: 0; max-height: none; resize: none; }
  .canvas-embed-header { display: flex; flex: none; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--canvas-readable-text, var(--text-normal)); font-size: 12px; }
  .canvas-embed-path { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .canvas-embed-mode { color: var(--canvas-readable-muted, var(--text-muted)); }
  button { min-height: 28px; padding: 4px 8px; border: 1px solid var(--background-modifier-border); border-radius: 5px; background: var(--canvas-readable-surface, var(--background-primary)); color: var(--canvas-readable-text, var(--text-normal)); cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }
  button:disabled { opacity: 0.5; cursor: default; }
</style>
