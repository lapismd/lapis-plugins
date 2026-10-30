<script lang="ts">
  import { ViewportPortal } from "@xyflow/svelte";

  type AlignmentGuideMarker = {
    x: number;
    y: number;
  };

  type AlignmentGuide = {
    orientation: "vertical" | "horizontal";
    position: number;
    start: number;
    end: number;
    markers: AlignmentGuideMarker[];
  };

  type Props = {
    guides?: AlignmentGuide[];
  };

  let { guides = [] }: Props = $props();
</script>

{#if guides.length > 0}
  <ViewportPortal target="front">
    <div class="canvas-alignment-guides" aria-hidden="true">
      {#each guides as guide, index (`${guide.orientation}-${guide.position}-${guide.start}-${guide.end}-${index}`)}
        <div
          class={`canvas-alignment-guide canvas-alignment-guide-${guide.orientation}`}
          style:left={guide.orientation === "vertical"
            ? `${guide.position}px`
            : `${guide.start}px`}
          style:top={guide.orientation === "vertical"
            ? `${guide.start}px`
            : `${guide.position}px`}
          style:height={guide.orientation === "vertical"
            ? `${Math.max(0, guide.end - guide.start)}px`
            : undefined}
          style:width={guide.orientation === "horizontal"
            ? `${Math.max(0, guide.end - guide.start)}px`
            : undefined}
        ></div>

        {#each guide.markers as marker, markerIndex (`${guide.orientation}-${index}-marker-${marker.x}-${marker.y}-${markerIndex}`)}
          <div
            class="canvas-alignment-guide-marker"
            style:left={`${marker.x}px`}
            style:top={`${marker.y}px`}
          ></div>
        {/each}
      {/each}
    </div>
  </ViewportPortal>
{/if}
