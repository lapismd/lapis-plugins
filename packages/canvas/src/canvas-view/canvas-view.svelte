<script lang="ts">
  import {
    Background,
    MiniMap,
    PanOnScrollMode,
    SvelteFlow,
  } from "@xyflow/svelte";
  import CanvasAlignmentGuides from "./canvas-alignment-guides.svelte";
  import CanvasControls from "./canvas-controls.svelte";
  import CanvasFitController from "./canvas-fit-controller.svelte";
  import CanvasNode from "./canvas-node.svelte";
  import CanvasSelectionToolbar from "./canvas-selection-toolbar.svelte";
  import {
    CanvasFlowEdgeType,
    createFlowEdge,
    CanvasFlowNodeType,
    parseNodeSize,
    parseJsonCanvas,
    serializeFlowDocument,
    stringifyJsonCanvas,
    toFlowDocument,
    type FlowCanvasEdge,
    type FlowCanvasNode,
    type JsonCanvas,
  } from "../lib/json-canvas";
  import CanvasEdge from "./canvas-edge.svelte";
  import { setContext, untrack } from "svelte";
  import type { App } from "@lapis-notes/api";

  type Props = {
    app: App;
    rawJson: string;
    parseError: string | null;
    snapToGrid: boolean;
    snapToObjects: boolean;
    onDocumentChange: (rawJson: string) => void;
    onReload: () => void;
  };

  let {
    app,
    rawJson,
    parseError,
    snapToGrid,
    snapToObjects,
    onDocumentChange,
    onReload,
  }: Props = $props();

  setContext("lapis-canvas-app", {
    get current() {
      return app;
    },
  });

  const nodeTypes = {
    [CanvasFlowNodeType]: CanvasNode,
  };

  const edgeTypes = {
    [CanvasFlowEdgeType]: CanvasEdge,
  };

  let nodes = $state.raw<FlowCanvasNode[]>([]);
  let edges = $state.raw<FlowCanvasEdge[]>([]);
  let canvas = $state<JsonCanvas | null>(null);
  let resolvedError = $state<string | null>(untrack(() => parseError));
  let lastPersistedRawJson = $state(untrack(() => rawJson));
  let isHydrating = $state(true);

  const ALIGNMENT_GUIDE_THRESHOLD = 4;
  const ALIGNMENT_GUIDE_PADDING = 18;
  const CANVAS_NODE_CORNER_RADIUS = 14.4;

  type AlignmentPositionKind = "start" | "center" | "end";

  type NodeBounds = {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
  };

  type AlignmentGuide = {
    orientation: "vertical" | "horizontal";
    position: number;
    start: number;
    end: number;
    markers: { x: number; y: number }[];
  };

  type GroupMembership = {
    groupIdByNodeId: Map<string, string>;
    nodeIdsByGroupId: Map<string, string[]>;
  };

  type GroupDragState = {
    memberIdsByGroupId: Map<string, string[]>;
    previousGroupPositions: Map<string, { x: number; y: number }>;
  };

  let alignmentGuides = $state<AlignmentGuide[]>([]);
  let groupDragState = $state<GroupDragState | null>(null);

  function getAlignmentPositions(
    bounds: NodeBounds,
    orientation: "vertical" | "horizontal",
  ): { value: number; kind: AlignmentPositionKind }[] {
    return orientation === "vertical"
      ? [
          { value: bounds.left, kind: "start" },
          { value: bounds.centerX, kind: "center" },
          { value: bounds.right, kind: "end" },
        ]
      : [
          { value: bounds.top, kind: "start" },
          { value: bounds.centerY, kind: "center" },
          { value: bounds.bottom, kind: "end" },
        ];
  }

  function getCornerInset(bounds: NodeBounds): number {
    return Math.min(
      CANVAS_NODE_CORNER_RADIUS,
      (bounds.right - bounds.left) / 2,
      (bounds.bottom - bounds.top) / 2,
    );
  }

  function buildGuideMarkersForBounds(
    bounds: NodeBounds,
    orientation: "vertical" | "horizontal",
    kind: AlignmentPositionKind,
  ): { x: number; y: number }[] {
    const inset = kind === "center" ? 0 : getCornerInset(bounds);

    if (orientation === "vertical") {
      const x =
        kind === "start"
          ? bounds.left
          : kind === "end"
            ? bounds.right
            : bounds.centerX;

      return [
        { x, y: bounds.top + inset },
        { x, y: bounds.bottom - inset },
      ];
    }

    const y =
      kind === "start"
        ? bounds.top
        : kind === "end"
          ? bounds.bottom
          : bounds.centerY;

    return [
      { x: bounds.left + inset, y },
      { x: bounds.right - inset, y },
    ];
  }

  function getNodeBounds(node: FlowCanvasNode): NodeBounds {
    const size = parseNodeSize(node.style);
    const left = node.position.x;
    const top = node.position.y;
    const right = left + size.width;
    const bottom = top + size.height;

    return {
      left,
      right,
      top,
      bottom,
      centerX: left + size.width / 2,
      centerY: top + size.height / 2,
    };
  }

  function mergeNodeBounds(inputNodes: FlowCanvasNode[]): NodeBounds | null {
    if (inputNodes.length === 0) {
      return null;
    }

    const bounds = inputNodes.map(getNodeBounds);
    const left = Math.min(...bounds.map((bound) => bound.left));
    const right = Math.max(...bounds.map((bound) => bound.right));
    const top = Math.min(...bounds.map((bound) => bound.top));
    const bottom = Math.max(...bounds.map((bound) => bound.bottom));

    return {
      left,
      right,
      top,
      bottom,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    };
  }

  function getBoundsArea(bounds: NodeBounds): number {
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }

  function containsNodeBounds(
    container: NodeBounds,
    content: NodeBounds,
  ): boolean {
    return (
      content.left >= container.left &&
      content.right <= container.right &&
      content.top >= container.top &&
      content.bottom <= container.bottom
    );
  }

  function calculateGroupMembership(
    inputNodes: FlowCanvasNode[],
  ): GroupMembership {
    const groups = inputNodes
      .filter((node) => node.data.kind === "group")
      .map((node) => {
        const bounds = getNodeBounds(node);
        return {
          area: getBoundsArea(bounds),
          bounds,
          node,
        };
      });

    const groupIdByNodeId = new Map<string, string>();
    const nodeIdsByGroupId = new Map<string, string[]>(
      groups.map(({ node }) => [node.id, []]),
    );

    for (const node of inputNodes) {
      if (node.data.kind === "group") {
        continue;
      }

      const nodeBounds = getNodeBounds(node);
      const containingGroup = groups
        .filter((group) => containsNodeBounds(group.bounds, nodeBounds))
        .sort((left, right) => left.area - right.area)[0];

      if (!containingGroup) {
        continue;
      }

      groupIdByNodeId.set(node.id, containingGroup.node.id);
      nodeIdsByGroupId.get(containingGroup.node.id)?.push(node.id);
    }

    return {
      groupIdByNodeId,
      nodeIdsByGroupId,
    };
  }

  function applyGroupDrag(draggedNodes: FlowCanvasNode[]): void {
    if (!groupDragState) {
      return;
    }

    const draggedNodeIds = new Set(draggedNodes.map((node) => node.id));
    const draggedNodeById = new Map(
      draggedNodes.map((node) => [node.id, node]),
    );
    const currentPositions = new Map(
      nodes.map((node) => [node.id, { ...node.position }]),
    );
    const nextGroupPositions = new Map(groupDragState.previousGroupPositions);
    const positionUpdates = new Map<string, { x: number; y: number }>();

    for (const groupNode of draggedNodes) {
      if (groupNode.data.kind !== "group") {
        continue;
      }

      const previousPosition = groupDragState.previousGroupPositions.get(
        groupNode.id,
      );
      if (!previousPosition) {
        continue;
      }

      const deltaX = groupNode.position.x - previousPosition.x;
      const deltaY = groupNode.position.y - previousPosition.y;

      nextGroupPositions.set(groupNode.id, { ...groupNode.position });

      if (deltaX === 0 && deltaY === 0) {
        continue;
      }

      for (const memberId of groupDragState.memberIdsByGroupId.get(
        groupNode.id,
      ) ?? []) {
        if (draggedNodeIds.has(memberId)) {
          continue;
        }

        const basePosition =
          positionUpdates.get(memberId) ?? currentPositions.get(memberId);
        if (!basePosition) {
          continue;
        }

        positionUpdates.set(memberId, {
          x: basePosition.x + deltaX,
          y: basePosition.y + deltaY,
        });
      }
    }

    groupDragState = {
      ...groupDragState,
      previousGroupPositions: nextGroupPositions,
    };

    if (positionUpdates.size === 0) {
      return;
    }

    nodes = nodes.map((node) => {
      const draggedNode = draggedNodeById.get(node.id);
      if (draggedNode) {
        return {
          ...node,
          position: { ...draggedNode.position },
        };
      }

      const nextPosition = positionUpdates.get(node.id);

      if (!nextPosition) {
        return node;
      }

      return {
        ...node,
        position: nextPosition,
      };
    });
  }

  function buildAlignmentGuide(
    draggedBounds: NodeBounds,
    otherBounds: NodeBounds[],
    orientation: "vertical" | "horizontal",
  ): AlignmentGuide | null {
    const draggedPositions = getAlignmentPositions(draggedBounds, orientation);

    let bestMatch: {
      position: number;
      start: number;
      end: number;
      delta: number;
      draggedKind: AlignmentPositionKind;
      matchedBounds: NodeBounds;
      matchedKind: AlignmentPositionKind;
    } | null = null;

    for (const other of otherBounds) {
      const otherPositions = getAlignmentPositions(other, orientation);

      for (const draggedPosition of draggedPositions) {
        for (const otherPosition of otherPositions) {
          const delta = Math.abs(draggedPosition.value - otherPosition.value);
          if (delta > ALIGNMENT_GUIDE_THRESHOLD) {
            continue;
          }

          const start =
            orientation === "vertical"
              ? Math.min(draggedBounds.top, other.top) - ALIGNMENT_GUIDE_PADDING
              : Math.min(draggedBounds.left, other.left) -
                ALIGNMENT_GUIDE_PADDING;
          const end =
            orientation === "vertical"
              ? Math.max(draggedBounds.bottom, other.bottom) +
                ALIGNMENT_GUIDE_PADDING
              : Math.max(draggedBounds.right, other.right) +
                ALIGNMENT_GUIDE_PADDING;

          if (!bestMatch || delta < bestMatch.delta) {
            bestMatch = {
              position: otherPosition.value,
              start,
              end,
              delta,
              draggedKind: draggedPosition.kind,
              matchedBounds: other,
              matchedKind: otherPosition.kind,
            };
          }
        }
      }
    }

    if (!bestMatch) {
      return null;
    }

    const markers = [
      ...buildGuideMarkersForBounds(
        draggedBounds,
        orientation,
        bestMatch.draggedKind,
      ),
      ...buildGuideMarkersForBounds(
        bestMatch.matchedBounds,
        orientation,
        bestMatch.matchedKind,
      ),
    ];

    return {
      orientation,
      position: bestMatch.position,
      start: bestMatch.start,
      end: bestMatch.end,
      markers,
    };
  }

  function clearAlignmentGuides(): void {
    alignmentGuides = [];
  }

  function updateAlignmentGuides(draggedNodes: FlowCanvasNode[]): void {
    if (!snapToObjects) {
      clearAlignmentGuides();
      return;
    }
    const draggedNodeIds = new Set(draggedNodes.map((node) => node.id));
    const draggedBounds = mergeNodeBounds(draggedNodes);

    if (!draggedBounds) {
      clearAlignmentGuides();
      return;
    }

    const otherBounds = nodes
      .filter((node) => !draggedNodeIds.has(node.id))
      .map(getNodeBounds);

    if (otherBounds.length === 0) {
      clearAlignmentGuides();
      return;
    }

    alignmentGuides = [
      buildAlignmentGuide(draggedBounds, otherBounds, "vertical"),
      buildAlignmentGuide(draggedBounds, otherBounds, "horizontal"),
    ].filter((guide): guide is NonNullable<typeof guide> => guide !== null);
  }

  function handleNodeDragStart({
    nodes: draggedNodes,
  }: {
    nodes: FlowCanvasNode[];
  }): void {
    updateAlignmentGuides(draggedNodes);

    const memberships = calculateGroupMembership(nodes);
    const draggedGroupNodes = draggedNodes.filter(
      (node) => node.data.kind === "group",
    );

    if (draggedGroupNodes.length === 0) {
      groupDragState = null;
      return;
    }

    groupDragState = {
      memberIdsByGroupId: new Map(
        draggedGroupNodes.map((node) => [
          node.id,
          [...(memberships.nodeIdsByGroupId.get(node.id) ?? [])],
        ]),
      ),
      previousGroupPositions: new Map(
        draggedGroupNodes.map((node) => [node.id, { ...node.position }]),
      ),
    };
  }

  function handleNodeDrag({
    nodes: draggedNodes,
  }: {
    nodes: FlowCanvasNode[];
  }): void {
    updateAlignmentGuides(draggedNodes);
    applyGroupDrag(draggedNodes);
  }

  function handleNodeDragStop({
    nodes: draggedNodes,
  }: {
    nodes: FlowCanvasNode[];
  }): void {
    applyGroupDrag(draggedNodes);
    clearAlignmentGuides();
    groupDragState = null;
  }

  function handleNodeClick({
    node,
    event,
  }: {
    node: FlowCanvasNode;
    event: MouseEvent | TouchEvent;
  }): void {
    if (node.data.kind !== "group") {
      return;
    }

    const point =
      event instanceof MouseEvent
        ? { clientX: event.clientX, clientY: event.clientY }
        : (event.touches[0] ?? event.changedTouches[0] ?? null);

    if (!point) {
      return;
    }

    // When a group node is clicked, the group may have intercepted a click that was
    // intended for a child node (selected groups get a z-index boost in xyflow that
    // puts them above non-group nodes). Use DOM hit-testing to check if a child node
    // is actually at the click position.
    const elementsAtPoint = document.elementsFromPoint(
      point.clientX,
      point.clientY,
    );
    const childNodeId =
      elementsAtPoint
        .map((el) =>
          el instanceof Element && el.classList.contains("svelte-flow__node")
            ? el.getAttribute("data-id")
            : null,
        )
        .find((id) => id !== null && id !== node.id) ?? null;

    if (!childNodeId) {
      return;
    }

    const membership = calculateGroupMembership(nodes);
    const groupMembers = membership.nodeIdsByGroupId.get(node.id) ?? [];

    if (!groupMembers.includes(childNodeId)) {
      return;
    }

    nodes = nodes.map((n) => ({ ...n, selected: n.id === childNodeId }));
  }

  $effect(() => {
    if (parseError) {
      canvas = null;
      nodes = [];
      edges = [];
      resolvedError = parseError;
      isHydrating = true;
      lastPersistedRawJson = rawJson;
      return;
    }

    try {
      const nextCanvas = parseJsonCanvas(rawJson);
      const flow = toFlowDocument(nextCanvas);
      const normalizedRawJson = stringifyJsonCanvas(
        serializeFlowDocument(flow.nodes, flow.edges),
      );

      canvas = nextCanvas;
      nodes = flow.nodes;
      edges = flow.edges;
      resolvedError = null;
      lastPersistedRawJson = normalizedRawJson;
      isHydrating = false;
    } catch (error) {
      canvas = null;
      nodes = [];
      edges = [];
      resolvedError = error instanceof Error ? error.message : String(error);
      isHydrating = true;
      lastPersistedRawJson = rawJson;
    }
  });

  $effect(() => {
    if (isHydrating || resolvedError) {
      return;
    }

    nodes;
    edges;

    const nextCanvas = serializeFlowDocument(nodes, edges);
    const nextRawJson = stringifyJsonCanvas(nextCanvas);
    canvas = nextCanvas;

    if (nextRawJson === lastPersistedRawJson) {
      return;
    }

    lastPersistedRawJson = nextRawJson;
    onDocumentChange(nextRawJson);
  });

  function handleConnect(connection: {
    source: string | null;
    target: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }): void {
    const edge = createFlowEdge(connection);
    if (!edge) {
      return;
    }

    const existingMatchingEdge = edges.find((existingEdge) => {
      return (
        existingEdge.source === edge.source &&
        existingEdge.target === edge.target &&
        (existingEdge.sourceHandle ?? null) === (edge.sourceHandle ?? null) &&
        (existingEdge.targetHandle ?? null) === (edge.targetHandle ?? null)
      );
    });

    if (existingMatchingEdge?.type === CanvasFlowEdgeType) {
      return;
    }

    if (existingMatchingEdge) {
      edges = edges.map((existingEdge) => {
        if (existingEdge !== existingMatchingEdge) {
          return existingEdge;
        }

        return {
          ...existingEdge,
          ...edge,
          id: existingEdge.id,
          label: existingEdge.label,
          selected: existingEdge.selected,
        };
      });
      return;
    }

    edges = [...edges, edge];
  }
</script>

{#if resolvedError}
  <div class="canvas-view-error">
    <div class="canvas-view-error-card">
      <h2>Canvas file could not be parsed</h2>
      <p>
        The file is still associated with the new canvas view, but its JSON is
        invalid.
      </p>
      <pre>{resolvedError}</pre>
      <div class="canvas-view-pill-list" style="margin-top: 1rem;">
        <button type="button" class="canvas-view-button" onclick={onReload}
          >Reload from disk</button
        >
      </div>
    </div>
  </div>
{:else}
  <div class="canvas-view-root">
    <div class="canvas-view-surface">
      {#if !isHydrating}
        <SvelteFlow
          bind:nodes
          bind:edges
          {nodeTypes}
          {edgeTypes}
          minZoom={0.03}
          panActivationKey=" "
          panOnScroll
          panOnScrollMode={PanOnScrollMode.Free}
          panOnDrag={false}
          selectionOnDrag
          zoomOnScroll={false}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          snapGrid={snapToGrid ? [20, 20] : undefined}
          onconnect={handleConnect}
          onnodedragstart={handleNodeDragStart}
          onnodedrag={handleNodeDrag}
          onnodedragstop={handleNodeDragStop}
          onnodeclick={handleNodeClick}
        >
          <CanvasFitController />
          <CanvasSelectionToolbar />
          <CanvasAlignmentGuides guides={alignmentGuides} />
          <Background />
          <CanvasControls />
          <MiniMap />
        </SvelteFlow>
      {/if}
    </div>
  </div>
{/if}
