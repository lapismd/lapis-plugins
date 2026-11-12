<script lang="ts">
  import { useNodesInitialized, useSvelteFlow, useViewportInitialized } from "@xyflow/svelte";
  import { tick, untrack } from "svelte";

  let { responsive = false, revision, container }: { responsive?: boolean; revision?: unknown; container?: HTMLElement | null } = $props();
  const { fitView, getNodes } = useSvelteFlow();
  const nodesInitialized = useNodesInitialized();
  const viewportInitialized = useViewportInitialized();
  let fitted = false;
  let interacted = $state(false);

  $effect(() => {
    if (responsive || !container) return;
    const element = container;
    const stop = () => { interacted = true; };
    const events = ["pointerdown", "keydown", "wheel", "dragover", "click"];
    for (const event of events) element.addEventListener(event, stop, true);
    return () => { for (const event of events) element.removeEventListener(event, stop, true); };
  });

  $effect(() => {
    if (!viewportInitialized.current) return;
    if (!responsive && (fitted || interacted)) return;
    if (!responsive && untrack(() => getNodes().length) === 0) { fitted = true; return; }
    if (!nodesInitialized.current) return;
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
