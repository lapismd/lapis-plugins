<script lang="ts">
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { untrack } from "svelte";
  import type { DeviceView, RevisionView } from "../presentation/types";
  import ComparePane from "./ComparePane.svelte";
  import CompareToolbar from "./CompareToolbar.svelte";
  import {
    FileChangeStats,
    buildUnifiedDiffRows,
    type FileDiffViewMode,
  } from "@lapismd/design-core/diff";
  import MergeRequiredBanner from "./MergeRequiredBanner.svelte";
  import RevisionGraph from "./RevisionGraph.svelte";
  import {
    changeSetForRevision,
    fileChangeAtPath,
    type SnapshotChangeSet,
  } from "./snapshot-changes";
  import "./history-chrome.css";

  let {
    revisions,
    devices = [],
    changeSets = [],
    conflicted = false,
    initialRevisionId = null,
    initialFilePath = null,
    filePath = null,
    onRestoreFile,
  }: {
    revisions: RevisionView[];
    devices?: DeviceView[];
    changeSets?: SnapshotChangeSet[];
    conflicted?: boolean;
    initialRevisionId?: string | null;
    initialFilePath?: string | null;
    filePath?: string | null;
    onRestoreFile?: (revisionId: string, path: string) => void;
  } = $props();

  const canvas = ColumnCanvas.createColumnCanvasController({
    columns: {
      revisions: {
        defaultWidth: 480,
        pathLevel: 0,
        minWidth: 360,
        maxWidth: 720,
        collapsible: true,
        resizable: true,
      },
      diff: {
        defaultWidth: 560,
        pathLevel: 2,
        minWidth: 360,
        maxWidth: 980,
        closeable: true,
        resizable: true,
      },
    },
    initialPath: untrack(() => [
      ...(initialRevisionId ? [initialRevisionId] : []),
      ...(initialRevisionId && initialFilePath ? [initialFilePath] : []),
    ]),
  });

  const selectedRevisionId = $derived(canvas.pathAt(0) ?? null);
  let viewMode = $state<FileDiffViewMode>("unified");
  let wrap = $state(false);
  const selectedFilePath = $derived(canvas.pathAt(1) ?? null);
  const selectedFiles = $derived(
    changeSetForRevision(changeSets, selectedRevisionId),
  );
  const selectedFile = $derived(
    fileChangeAtPath(selectedFiles, selectedFilePath),
  );

  const graphTitle = $derived(
    filePath?.split("/").at(-1) || filePath || "History",
  );
  const rows = $derived(
    buildUnifiedDiffRows(
      selectedFile?.oldText ?? "",
      selectedFile?.newText ?? "",
    ),
  );
  const additions = $derived(
    rows.filter((row) => row.variant === "added").length,
  );
  const deletions = $derived(
    rows.filter((row) => row.variant === "removed").length,
  );
  const restore = $derived(
    onRestoreFile && selectedRevisionId && selectedFile
      ? () => onRestoreFile!(selectedRevisionId!, selectedFile!.path)
      : undefined,
  );

  function selectRevision(revision: RevisionView): void {
    canvas.select(0, revision.eventId);
    const selected = canvas.pathAt(0);
    if (
      filePath &&
      selected === revision.eventId &&
      fileChangeAtPath(
        changeSetForRevision(changeSets, revision.eventId),
        filePath,
      )
    ) {
      canvas.select(1, filePath);
    }
  }

  function selectFile(path: string): void {
    canvas.select(1, path);
  }
</script>

<div
  class="sync-history-canvas"
  data-ui-component="sync-history-canvas"
  data-testid="sync-history-canvas"
  data-conflicted={conflicted ? "true" : undefined}
  data-file-path={filePath ?? undefined}
>
  <ColumnCanvas.Root controller={canvas}>
    <ColumnCanvas.Column
      id="revisions"
      title={graphTitle}
      count={revisions.length}
    >
      <ColumnCanvas.Body>
        {#if conflicted}
          <MergeRequiredBanner status="conflicted" />
        {/if}
        <RevisionGraph
          {revisions}
          {devices}
          {changeSets}
          selectedId={selectedRevisionId}
          selectedPath={selectedFilePath}
          onSelect={selectRevision}
          onSelectPath={selectFile}
        />
      </ColumnCanvas.Body>
    </ColumnCanvas.Column>
    <ColumnCanvas.Column id="diff" columnTitle={selectedFilePath ?? "Diff"}>
      <ColumnCanvas.Header
        class="sync-diff-header"
        data-testid="sync-diff-header"
      >
        <div class="sync-diff-header__title">
          <ColumnCanvas.Title>{selectedFilePath ?? "Diff"}</ColumnCanvas.Title>
        </div>
        <div class="sync-diff-header__center">
          {#if selectedFile && !selectedFile.binary}<CompareToolbar
              bind:viewMode
              bind:wrap
              onRestore={restore}
            />{/if}
        </div>
        <ColumnCanvas.HeaderActions class="sync-diff-header__summary">
          {#if selectedFile && !selectedFile.binary}<FileChangeStats
              {additions}
              {deletions}
              showZero
            />{/if}
          <ColumnCanvas.Close />
        </ColumnCanvas.HeaderActions>
      </ColumnCanvas.Header>
      <ColumnCanvas.Body>
        {#if selectedFile && !selectedFile.binary}
          <ComparePane
            path={selectedFile.path}
            oldText={selectedFile.oldText ?? ""}
            newText={selectedFile.newText ?? ""}
            showToolbar={false}
            bind:viewMode
            bind:wrap
          />
        {:else if selectedFile?.binary}
          <p class="sync-empty">
            Binary content cannot be displayed as a text diff.
          </p>
        {/if}
      </ColumnCanvas.Body>
    </ColumnCanvas.Column>
  </ColumnCanvas.Root>
</div>
