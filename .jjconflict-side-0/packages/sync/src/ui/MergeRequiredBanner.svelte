<script lang="ts">
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import type { SyncStatus } from "../presentation/types";
  import "./history-chrome.css";

  let { status, onOpen }: { status: SyncStatus; onOpen?: () => void } =
    $props();
</script>

{#if status === "conflicted"}
  <div class="sync-banner" role="status" data-testid="sync-merge-required">
    <span class="sync-banner__icon" aria-hidden="true"><CircleAlert /></span>
    <div class="sync-banner__copy">
      <span class="sync-banner__title">Merge required</span>
      <p class="sync-banner__detail">Two device HEADs have diverged.</p>
    </div>
    {#if onOpen}<button type="button" onclick={onOpen}>Resolve merge</button
      >{/if}
  </div>
{/if}
