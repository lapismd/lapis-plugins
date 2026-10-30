<script lang="ts">
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { BookmarksViewType } from "@lapis-notes/bookmarks";
  import {
    DOCXPlugin,
    SAMPLE_DOCX_PATH,
    SAMPLE_READING_NOTE_PATH,
    sampleReadingMarkdown,
  } from "@lapis-notes/docx";
  import {
    bootPanelDemo,
    type PanelDemoLayout,
  } from "../../_shared/panels/create-panel-demo";
  import "../../../workspace/lapis-editor-demo/lapis-editor-demo.css";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";
  import sampleDocxUrl from "../../../../packages/docx/assets/sample.docx?url";

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
      plugins: [
        {
          plugin: DOCXPlugin,
          required: false,
          enabledByDefault: true,
          distribution: "bundled",
        },
      ],
    }).then(async (runtime) => {
      let docxLeaf: WorkspaceLeaf | null = null;
      runtime.app.workspace.iterateAllLeaves((leaf) => {
        if (!docxLeaf && leaf.view.getViewType() === BookmarksViewType) {
          docxLeaf = leaf;
        }
      });
      if (!docxLeaf) {
        throw new Error("The workspace shell has no leaf for DOCX");
      }
      if (!runtime.app.vault.getAbstractFileByPath(SAMPLE_DOCX_PATH)) {
        const sample = await fetch(sampleDocxUrl);
        await runtime.app.vault.createBinary(
          SAMPLE_DOCX_PATH,
          await sample.arrayBuffer(),
        );
      }
      if (!runtime.app.vault.getAbstractFileByPath(SAMPLE_READING_NOTE_PATH)) {
        await runtime.app.vault.create(
          SAMPLE_READING_NOTE_PATH,
          sampleReadingMarkdown(),
        );
      }
      await docxLeaf.setViewState({
        type: "lapis-docx",
        state: { file: SAMPLE_DOCX_PATH },
      });
      runtime.app.workspace.setActiveLeaf(docxLeaf, { focus: false });
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
  data-panel-kind="docx"
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
