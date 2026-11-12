<script lang="ts">
  import { getContext, untrack } from "svelte";
  import { useStore, useSvelteFlow, type OnConnectEnd } from "@xyflow/svelte";
  import { connectCanvasCard } from "../lib/canvas-connections";
  import type { CanvasBoardController } from "../lib/canvas-board-controller";
  import type { EdgeSide } from "../lib/json-canvas";
  let { request, onDone, onError }: { request: Parameters<OnConnectEnd> | null; onDone: () => void; onError: (reason: string) => void } = $props();
  const board = getContext<CanvasBoardController>("lapis-canvas-board");
  const store = useStore();
  const { screenToFlowPosition } = useSvelteFlow();
  async function create([event, state]: Parameters<OnConnectEnd>): Promise<void> {
    try {
      const pointer = "changedTouches" in event ? event.changedTouches[0] : event;
      if (!pointer || !state.fromNode || !state.fromHandle) return;
      const document = store.domNode?.ownerDocument;
      const target = document?.elementFromPoint(pointer.clientX, pointer.clientY);
      if (!target?.closest(".svelte-flow__pane") || target.closest(".svelte-flow__node, .svelte-flow__edge, button, input, select, dialog") || target.closest(".svelte-flow") !== store.domNode) return;
      const side = state.fromHandle.position;
      if (!["top", "right", "bottom", "left"].includes(side)) return;
      const origin = { nodeId: state.fromNode.id, type: state.fromHandle.type, side: side as EdgeSide };
      const point = screenToFlowPosition({ x: pointer.clientX, y: pointer.clientY });
      await board.flush();
      const result = connectCanvasCard(board.read(), origin, point);
      board.beginGesture(); board.apply(result.document, new Set([result.id]));
    } catch (reason) { onError(reason instanceof Error ? reason.message : String(reason)); }
    finally { onDone(); }
  }
  $effect(() => { const pending = request; if (pending) untrack(() => { void create(pending); }); });
</script>
