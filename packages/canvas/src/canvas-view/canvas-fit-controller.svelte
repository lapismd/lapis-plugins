<script lang="ts">
  import { useNodesInitialized, useSvelteFlow, useViewportInitialized } from "@xyflow/svelte";
  import { tick, untrack } from "svelte";

  let { responsive = false, revision, container }: { responsive?: boolean; revision?: unknown; container?: HTMLElement | null } = $props();
  const { fitView, getNodes } = useSvelteFlow();
  const nodesInitialized = useNodesInitialized();
  const viewportInitialized = useViewportInitialized();
  let fitted = false;

  $effect(() => {
    if (!nodesInitialized.current || !viewportInitialized.current) return;
    if (!responsive && fitted) return;
    if (responsive) void revision;
    const element = container;
    if (untrack(() => getNodes().length) === 0) return;
    fitted = true;
    let cancelled = false;
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!cancelled) void fitView({ maxZoom: 1 });
      });
    };
    // Public readiness replaces polling and delayed fits that stole user zoom.
    void tick().then(() => { if (!cancelled) schedule(); });
    const observer = responsive && element ? new ResizeObserver(schedule) : null;
    if (element) observer?.observe(element);
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  });
</script>
