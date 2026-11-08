<script lang="ts">
  import LayoutTemplate from "@lucide/svelte/icons/layout-template";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  let { type }: { type: string } = $props();
</script>

<div class="bases-record-view" data-ui-component="bases-unknown-view" data-ui-part="fallback">
  <ScrollArea.Root class="bases-record-view__scroll" fillContent viewportProps={{ "aria-label": "Unsupported view" }}>
    <Empty.Root class="bases-unknown-view__empty">
      <Empty.Header>
        <Empty.Media variant="icon"><LayoutTemplate /></Empty.Media>
        <Empty.Title>Unsupported view</Empty.Title>
        <Empty.Description>The configured view type <strong>{type}</strong> is not available. Choose another layout from the view menu.</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  </ScrollArea.Root>
</div>
