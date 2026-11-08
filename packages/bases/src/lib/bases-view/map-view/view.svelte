<script lang="ts">
  import type { BasesView } from "../bases.svelte";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import SummaryStrip from "../components/summary-strip.svelte";

  let {
    view,
  }: {
    view: BasesView;
  } = $props();
</script>

<div
  class="bases-record-view"
  data-layout="map"
  data-ui-component="bases-map-view"
  data-ui-part="unavailable"
>
  <ScrollArea.Root class="bases-record-view__scroll" viewportProps={{ "aria-label": "Map view information" }}>
  <div class="bases-map-view__content">
  <SummaryStrip {view} />
  <div class="bases-style-font-medium-2689f3">Map view is not available in this runtime yet.</div>
  <p class="bases-style-text-muted-foreground-bfa603">
    This Base can keep a `map` layout in its config, but the current runtime
    only provides an explicit fallback state until map capability is
    implemented.
  </p>
  <p class="bases-style-text-muted-foreground-bfa603">
    Current result count: {view.data.data.length}
  </p>
  </div>
  </ScrollArea.Root>
</div>
