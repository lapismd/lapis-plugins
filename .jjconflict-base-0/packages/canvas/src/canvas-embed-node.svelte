<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { MarkdownEmbed } from "@lapis-notes/markdown/embed";
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import { getContext } from "svelte";

  import {
    displayNodeValue,
    resolveCanvasColor,
    type FlowCanvasNode,
  } from "./lib/json-canvas";

  let { data }: NodeProps<FlowCanvasNode> = $props();

  const canvasApp = getContext<{ readonly current: App | undefined } | undefined>(
    "lapis-canvas-app",
  );
  const app = $derived(canvasApp?.current);

  const nodeLabel = $derived(displayNodeValue(data));
  const resolvedColor = $derived(resolveCanvasColor(data.color));
  const isGroupNode = $derived(data.kind === "group");
  const hasFilePreview = $derived(
    data.kind === "file" && Boolean(data.previewValue?.trim()),
  );
  const surfaceStyle = $derived.by(() => {
    if (!resolvedColor) {
      return undefined;
    }

    return [
      `--canvas-node-accent: ${resolvedColor}`,
      `--canvas-node-fill: color-mix(in srgb, ${resolvedColor} 12%, var(--background-secondary))`,
    ].join("; ");
  });
</script>

<div class="canvas-node-shell" style={surfaceStyle}>
  {#if data.kind === "file" && data.file}
    <div class="canvas-node-file-label">{data.file}</div>
  {:else if data.kind === "group" && data.label}
    <div class="canvas-group-label-badge">
      <span class="canvas-group-label-input">{data.label}</span>
    </div>
  {/if}

  <div class:canvas-node-label-group={isGroupNode} class="canvas-node-label">
    {#if data.kind === "group"}
      <div class="canvas-group-surface-spacer"></div>
    {:else}
      <div class="canvas-node-kind">{data.kind}</div>

      {#if data.kind === "text"}
        <div class="canvas-node-markdown-preview">
          {#if app}
            <MarkdownEmbed {app} value={data.text ?? ""} />
          {:else}
            <div class="canvas-node-text">{data.text ?? ""}</div>
          {/if}
        </div>
      {:else if data.kind === "file" && hasFilePreview}
        <div class="canvas-node-markdown-preview">
          {#if app}
            <MarkdownEmbed
              {app}
              sourcePath={data.previewSourcePath ?? data.file ?? ""}
              value={data.previewValue ?? ""}
            />
          {:else}
            <div class="canvas-node-text">{data.previewValue ?? ""}</div>
          {/if}
        </div>
      {:else if data.kind === "link"}
        <div class="canvas-node-text">
          <a href={data.url ?? "#"} rel="noreferrer" target="_blank">
            {nodeLabel}
          </a>
        </div>
      {:else}
        <div class="canvas-node-text">{nodeLabel}</div>
      {/if}
    {/if}
  </div>

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
</div>
