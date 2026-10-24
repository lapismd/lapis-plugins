<script lang="ts">
  import { onMount } from "svelte";
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { BookmarksViewType } from "@lapis-notes/bookmarks";
  import { FileExplorerView } from "@lapis-notes/file-explorer";
  import {
    sampleTranscriptMarkdown,
    sampleTranscriptPath,
  } from "@lapis-notes/transcripts";
  import {
    bootPanelDemo,
    type PanelDemoLayout,
  } from "../../_shared/panels/create-panel-demo";
  import "../../../workspace/lapis-editor-demo/lapis-editor-demo.css";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";
  import {
    TRANSCRIPT_READING_VIEW,
    TranscriptReadingView,
  } from "./reading-view";

  let { layout }: { layout: PanelDemoLayout } = $props();

  let app = $state<App | null>(null);
  let status = $state("booting");
  let root = $state<HTMLDivElement>();

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & { __lapisApp?: App };
    ownedRoot.__lapisApp = app;
    return () => {
      if (ownedRoot.__lapisApp === app) delete ownedRoot.__lapisApp;
    };
  });

  onMount(() => {
    let cancelled = false;
    let unregisterTranscriptFile: (() => void) | null = null;
    const runtimePromise = bootPanelDemo("bookmarks", layout, {
      diagnostics: "none",
    }).then(async (runtime) => {
      runtime.app.workspace.registerView(
        TRANSCRIPT_READING_VIEW,
        (leaf: WorkspaceLeaf) => new TranscriptReadingView(leaf),
      );
      unregisterTranscriptFile = runtime.app.workspace.registerEditorView({
        id: `${TRANSCRIPT_READING_VIEW}-file`,
        viewType: TRANSCRIPT_READING_VIEW,
        label: "Transcript",
        filenamePatterns: [sampleTranscriptPath],
        priority: "exclusive",
      });
      if (!runtime.app.vault.getAbstractFileByPath(sampleTranscriptPath)) {
        await runtime.app.vault.create(
          sampleTranscriptPath,
          sampleTranscriptMarkdown(),
        );
      }
      let readingLeaf: WorkspaceLeaf | null = null;
      runtime.app.workspace.iterateAllLeaves((leaf) => {
        if (!readingLeaf && leaf.view.getViewType() === BookmarksViewType) {
          readingLeaf = leaf;
        }
      });
      if (!readingLeaf) {
        throw new Error("The workspace shell has no main leaf for Transcripts");
      }
      if (layout === "middle-top-tabs") {
        await showExplorerForSample(runtime.app, readingLeaf);
      } else {
        await readingLeaf.setViewState({
          type: TRANSCRIPT_READING_VIEW,
          state: {},
        });
        runtime.app.workspace.setActiveLeaf(readingLeaf, { focus: false });
      }
      return runtime;
    });
    void runtimePromise
      .then((runtime) => {
        if (cancelled) return;
        app = runtime.app;
        status = "ready";
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          status = reason instanceof Error ? reason.message : "failed";
        }
      });
    return () => {
      cancelled = true;
      unregisterTranscriptFile?.();
      void runtimePromise
        .then(async (runtime) => {
          runtime.app.workspace.unregisterView(TRANSCRIPT_READING_VIEW);
          await runtime.dispose();
        })
        .catch(() => undefined);
    };
  });

  const OPEN_EXPLORER_COMMAND = "lapis-file-explorer:open-explorer";

  async function showExplorerForSample(
    app: App,
    documentLeaf: WorkspaceLeaf,
  ): Promise<void> {
    await documentLeaf.setViewState({ type: "empty", state: {} });
    await app.commands.executeCommand(OPEN_EXPLORER_COMMAND);
    const explorerLeaf = await waitForFileExplorer(app);
    if (explorerLeaf.view instanceof FileExplorerView) {
      explorerLeaf.view.revealPath(sampleTranscriptPath);
    }
  }

  async function waitForFileExplorer(app: App): Promise<WorkspaceLeaf> {
    const started = Date.now();
    while (Date.now() - started < 5_000) {
      const leaf = app.workspace.getLeavesOfType("file-explorer")[0];
      if (leaf?.view instanceof FileExplorerView) return leaf;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error("Open Explorer did not create a file explorer leaf");
  }
</script>

<div
  bind:this={root}
  class="panel-demo"
  data-testid="panel-demo"
  data-panel-kind="transcripts"
  data-panel-layout={layout}
  data-status={status}
>
  <div class="panel-demo__status" data-testid="panel-demo-status">{status}</div>
  {#if app}
    <WorkspaceShell {app} />
  {/if}
</div>

<style>
  :global(
      body.sb-main-fullscreen:has(#storybook-root .panel-demo) #storybook-root
    ) {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(html:has(#storybook-root .panel-demo)),
  :global(body:has(#storybook-root .panel-demo)) {
    overflow: hidden;
  }

  .panel-demo {
    position: relative;
    display: flex;
    width: 100%;
    height: 100vh;
    max-width: 100%;
    max-height: 100vh;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .panel-demo > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  :global(.panel-demo-docs-canvas) .panel-demo {
    height: 700px;
    max-height: 700px;
    min-height: 700px;
  }

  .panel-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
