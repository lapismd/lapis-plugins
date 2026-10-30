<script lang="ts">
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import { presentSyncStatus } from "../presentation/status";
  import type { SyncSnapshot } from "../presentation/types";
  import "./sync.css";

  let {
    snapshot,
    testId = "sync-status",
  }: {
    snapshot: Pick<SyncSnapshot, "status" | "pendingChanges"> &
      Partial<Pick<SyncSnapshot, "security">>;
    testId?: string;
  } = $props();

  const presented = $derived(presentSyncStatus(snapshot));
</script>

<span
  class="sync-status-badge"
  data-testid={testId}
  data-sync-status={snapshot.status}
  data-sync-tone={presented.tone}
  title={presented.tooltip}
>
  <span
    class="sync-status-badge__icon"
    data-busy={presented.spin}
    aria-hidden="true"
  >
    <WorkspaceIcon name={presented.icon} />
  </span>
  <span class="sync-status-badge__label">{presented.label}</span>
  {#if presented.segments[0]}
    <span class="sync-status-badge__count">{presented.segments[0]}</span>
  {/if}
</span>
