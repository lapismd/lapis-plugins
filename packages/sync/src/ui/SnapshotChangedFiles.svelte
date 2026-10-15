<script lang="ts">
  import {
    FileListing,
    FileListingViewModeToggle,
    type FileListingViewMode,
  } from "@lapismd/design-core/diff";
  import type { SnapshotFileChange } from "./snapshot-changes";
  import "./history-chrome.css";

  let {
    files,
    selectedPath = null,
    title = "Changed files",
    compact = false,
    onSelectPath,
  }: {
    files: SnapshotFileChange[];
    selectedPath?: string | null;
    title?: string;
    compact?: boolean;
    onSelectPath?: (path: string) => void;
  } = $props();

  let mode = $state<FileListingViewMode>("tree");
</script>

<section
  class="sync-changed-files"
  class:sync-changed-files--compact={compact}
  data-ui-part="changed-files"
  data-testid="sync-changed-files"
  aria-label={title}
>
  <div class="sync-changed-files__header">
    <span class="sync-changed-files__title">{title}</span>
    <span class="sync-changed-files__count">{files.length}</span>
    <FileListingViewModeToggle bind:mode />
  </div>
  <div class="sync-changed-files__body">
    <FileListing {files} {mode} {selectedPath} {onSelectPath} />
  </div>
</section>
