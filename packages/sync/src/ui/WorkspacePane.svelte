<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { SyncPlugin } from "../sync-plugin";
  import type { SyncPaneKind, SyncViewState } from "../view-state.svelte";
  import {
    filterRevisionsForPath,
    changeSetsForPath,
    changeSetForRevision,
    fileChangeAtPath,
  } from "./snapshot-changes";
  import HistoryCanvas from "./HistoryCanvas.svelte";
  import SyncPanel from "./SyncPanel.svelte";
  import ComparePane from "./ComparePane.svelte";
  import MergeWorkspace from "./MergeWorkspace.svelte";
  import "./sync.css";
  let {
    plugin,
    kind,
    viewState,
  }: { plugin: SyncPlugin; kind: SyncPaneKind; viewState: SyncViewState } =
    $props();
  let snapshot = $state(untrack(() => plugin.session.snapshot()));
  let busy = $state(untrack(() => plugin.session.busy));
  onMount(() =>
    plugin.session.subscribe(() => {
      snapshot = plugin.session.snapshot();
      busy = plugin.session.busy;
    }),
  );
  const path = $derived(
    viewState.values.path ?? plugin.app.workspace.getActiveFile()?.path ?? null,
  );
  const revisions = $derived(
    kind === "file-history" && path
      ? filterRevisionsForPath(snapshot.revisions, snapshot.changeSets, path)
      : snapshot.revisions,
  );
  const changeSets = $derived(
    kind === "file-history" && path
      ? changeSetsForPath(snapshot.changeSets, path)
      : snapshot.changeSets,
  );
  const selectedFile = $derived(
    fileChangeAtPath(
      changeSetForRevision(
        snapshot.changeSets,
        viewState.values.revisionId ?? null,
      ),
      viewState.values.path ?? null,
    ),
  );
  const canRestore = $derived(!busy && plugin.session.can("restore-file"));
</script>

<div
  class="sync-host"
  data-ui-component="sync-workspace"
  data-testid="sync-workspace-pane"
  data-sync-pane={kind}
  aria-busy={busy}
>
  {#if kind === "sync"}
    <SyncPanel
      {snapshot}
      canCheckpoint={!busy && plugin.session.can("checkpoint")}
      canSync={!busy && plugin.session.can("sync")}
      onCheckpoint={() => void plugin.session.run({ type: "checkpoint" })}
      onSync={() => void plugin.session.run({ type: "sync" })}
      onOpenPath={(path) =>
        void plugin.app.workspace.openLinkText(path, "", true)}
      onOpenMerge={() => void plugin.openPane("merge")}
    />
  {:else if kind === "history" || kind === "file-history"}
    {#if kind === "file-history" && !path}
      <p class="sync-empty">Open a file to browse its history.</p>
    {:else}
      <HistoryCanvas
        {revisions}
        {changeSets}
        devices={snapshot.devices}
        filePath={kind === "file-history" ? path : null}
        conflicted={snapshot.status === "conflicted"}
        onRestoreFile={canRestore
          ? (revisionId, path) =>
              void plugin.session.run({
                type: "restore-file",
                revisionId,
                path,
              })
          : undefined}
      />
      {#if !revisions.length}<p class="sync-empty">
          {snapshot.security.state === "locked"
            ? "Unlock this device to view encrypted history."
            : "No checkpoints yet."}
        </p>{/if}
    {/if}
  {:else if kind === "compare"}
    {#if selectedFile && !selectedFile.binary}
      <ComparePane
        path={selectedFile.path}
        oldText={selectedFile.oldText ?? ""}
        newText={selectedFile.newText ?? ""}
        onRestore={canRestore && viewState.values.revisionId
          ? () =>
              void plugin.session.run({
                type: "restore-file",
                revisionId: viewState.values.revisionId!,
                path: selectedFile!.path,
              })
          : undefined}
      />
    {:else}<p class="sync-empty">
        {selectedFile?.binary
          ? "Binary content cannot be displayed as a text diff."
          : "Select an available file revision to compare."}
      </p>{/if}
  {:else}<MergeWorkspace {snapshot} session={plugin.session} />{/if}
  {#if kind !== "sync" && snapshot.lastError}<p class="sync-error" role="alert">
      {snapshot.lastError}
    </p>{/if}
</div>
