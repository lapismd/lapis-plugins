<script lang="ts">
  import {
    useNodesInitialized,
    useSvelteFlow,
    useViewportInitialized,
  } from "@xyflow/svelte";
  import { onMount, tick } from "svelte";

  const { fitView, getNodes } = useSvelteFlow();
  const nodesInitialized = useNodesInitialized();
  const viewportInitialized = useViewportInitialized();
  const autoFitOptions = { maxZoom: 1 };

  onMount(() => {
    let started = false;
    let cancelled = false;
    const fitTimers: ReturnType<typeof setTimeout>[] = [];
    const triggerFit = () => {
      void fitView(autoFitOptions);
    };

    const startAutoFit = async () => {
      if (
        started ||
        !nodesInitialized.current ||
        !viewportInitialized.current ||
        getNodes().length === 0
      ) {
        return;
      }

      started = true;
      await tick();

      for (const delayMs of [0, 250, 1000, 2500, 5000]) {
        const timer = setTimeout(() => {
          if (cancelled || getNodes().length === 0) {
            return;
          }

          triggerFit();
        }, delayMs);

        fitTimers.push(timer);
      }
    };

    const readinessPoll = setInterval(() => {
      void startAutoFit();
    }, 100);

    void startAutoFit();

    return () => {
      cancelled = true;
      clearInterval(readinessPoll);
      for (const timer of fitTimers) {
        clearTimeout(timer);
      }
    };
  });
</script>
