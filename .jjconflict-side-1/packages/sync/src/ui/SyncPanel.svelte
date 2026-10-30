<script lang="ts">
  import { isBusySyncStatus } from "../presentation/status";
  import type { SyncSnapshot } from "../presentation/types";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import MergeRequiredBanner from "./MergeRequiredBanner.svelte";
  import SnapshotChangedFiles from "./SnapshotChangedFiles.svelte";
  import SyncStatusBadge from "./SyncStatusBadge.svelte";
  import SyncToolbar from "./SyncToolbar.svelte";
  import "./history-chrome.css";
  import "./sync.css";

  let {
    snapshot,
    onCheckpoint,
    onSync,
    onOpenPath,
    onOpenMerge,
    canCheckpoint = false,
    canSync = false,
    label = "Sync status",
  }: {
    snapshot: SyncSnapshot;
    onCheckpoint: () => void;
    onSync: () => void;
    onOpenPath?: (path: string) => void;
    onOpenMerge?: () => void;
    canCheckpoint?: boolean;
    canSync?: boolean;
    label?: string;
  } = $props();

  const pendingFiles = $derived(
    snapshot.pendingFiles.map((file) => ({ path: file.path })),
  );
</script>

<section
  class="sync-panel sync-panel--sync"
  data-ui-part="sync"
  data-testid="sync-sync-panel"
  aria-label={label}
>
  <header class="sync-sync-header">
    <SyncStatusBadge {snapshot} />
    <SyncToolbar
      busy={isBusySyncStatus(snapshot.status)}
      {canCheckpoint}
      {canSync}
      {onCheckpoint}
      {onSync}
    />
  </header>
  <MergeRequiredBanner status={snapshot.status} onOpen={onOpenMerge} />
  <ScrollArea class="sync-sync-scroll" fillContent aria-label="Sync changes">
    <div class="sync-sync-body">
      {#if snapshot.lastError}<p class="sync-error" role="alert">
          {snapshot.lastError}
        </p>{/if}
      {#if pendingFiles.length > 0}
        <SnapshotChangedFiles
          files={pendingFiles}
          title="Pending changes"
          compact
          onSelectPath={onOpenPath}
        />
      {:else}
        <p class="sync-empty" data-testid="sync-sync-empty">
          {snapshot.security.state === "locked"
            ? "Unlock this device to view encrypted changes."
            : snapshot.status === "idle-clean"
              ? "Everything is synced."
              : snapshot.status === "disabled"
                ? "Sync is disabled. Configure Lapis Server in Settings to get started."
                : snapshot.status === "offline"
                  ? "This device is offline. Local history remains available."
                  : "No pending file changes."}
        </p>
      {/if}
    </div>
  </ScrollArea>
</section>
