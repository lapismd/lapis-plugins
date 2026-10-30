<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { setContext } from "svelte";
  import {
    Background,
    MiniMap,
    PanOnScrollMode,
    SvelteFlow,
  } from "@xyflow/svelte";

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
    class?: string;
    minZoom?: number;
    fileContents?: CanvasEmbedFileContents;
  };

  let {
    app,
    value,
    class: className = "",
    minZoom = 0.03,
    fileContents = {},
  }: Props = $props();

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

  function mergeClassName(
    baseClassName: string,
    extraClassName: string,
  ): string {
    return `${baseClassName} ${extraClassName}`.trim();
  }
</script>

{#if parsedDocument.error}
  <div class="canvas-view-error" data-canvas-embed-error>
    <div class="canvas-view-error-card">
      <h2>Canvas file could not be parsed</h2>
      <p>The supplied JSON Canvas document is invalid.</p>
      <pre>{parsedDocument.error}</pre>
    </div>
  </div>
{:else}
  <div class={mergeClassName("canvas-view-root", className)} data-canvas-embed>
    <div class="canvas-view-surface">
      <SvelteFlow
        edges={flowDocument.edges}
        elementsSelectable={false}
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
        <MiniMap />
        <CanvasFitController />
      </SvelteFlow>
    </div>
  </div>
{/if}
