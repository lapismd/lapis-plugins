<script lang="ts">
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { BookmarksViewType } from "@lapis-notes/bookmarks";
  import {
    CanvasPlugin,
    SAMPLE_CANVAS_PATH,
    SAMPLE_READING_NOTE_PATH,
    SAMPLE_WELCOME_PATH,
    sampleCanvasDocument,
    sampleReadingMarkdown,
    sampleWelcomeMarkdown,
  } from "@lapis-notes/canvas";
  import {
    bootPanelDemo,
    type PanelDemoLayout,
  } from "../../_shared/panels/create-panel-demo";
  import "../../../workspace/lapis-editor-demo/lapis-editor-demo.css";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";

  let { layout }: { layout: PanelDemoLayout } = $props();

  let app = $state<App | null>(null);
  let status = $state("booting");

  const ownApp = $derived.by((): Attachment<HTMLDivElement> => {
    const current = app;
    return (node) => {
      const owned = node as HTMLDivElement & { __lapisApp?: App };
      if (current) owned.__lapisApp = current;
      return () => {
        if (owned.__lapisApp === current) delete owned.__lapisApp;
      };
    };
  });

  onMount(() => {
    let cancelled = false;
    const runtimePromise = bootPanelDemo("bookmarks", layout, {
      diagnostics: "none",
      files: {
        [SAMPLE_CANVAS_PATH]: sampleCanvasDocument(),
        [SAMPLE_WELCOME_PATH]: sampleWelcomeMarkdown(),
        [SAMPLE_READING_NOTE_PATH]: sampleReadingMarkdown(),
      },
      plugins: [
        {
          plugin: CanvasPlugin,
          required: false,
          enabledByDefault: true,
          distribution: "bundled",
        },
      ],
    }).then(async (runtime) => {
      let canvasLeaf: WorkspaceLeaf | null = null;
      runtime.app.workspace.iterateAllLeaves((leaf) => {
        if (!canvasLeaf && leaf.view.getViewType() === BookmarksViewType) {
          canvasLeaf = leaf;
        }
      });
      if (!canvasLeaf) {
        throw new Error("The workspace shell has no leaf for Canvas");
      }
      await canvasLeaf.setViewState({
        type: "lapis-canvas",
        state: { file: SAMPLE_CANVAS_PATH },
      });
      runtime.app.workspace.setActiveLeaf(canvasLeaf, { focus: false });
      if (layout === "middle-top-tabs") {
        const note = runtime.app.vault.getFileByPath(SAMPLE_READING_NOTE_PATH);
        if (!note) throw new Error("Missing reading note");
        const noteLeaf = runtime.app.workspace.getLeaf("tab");
        await noteLeaf.setViewState({
          type: "markdown",
          state: { file: note.path, mode: "preview" },
        });
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
      void runtimePromise
        .then(async (runtime) => {
          await runtime.dispose();
        })
        .catch(() => undefined);
    };
  });
</script>

<div
  {@attach ownApp}
  class="panel-demo"
  data-testid="panel-demo"
  data-panel-kind="canvas"
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
