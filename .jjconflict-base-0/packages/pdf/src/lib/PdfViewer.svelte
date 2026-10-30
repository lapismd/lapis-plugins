<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import type { Attachment } from "svelte/attachments";
  import { mountPdfViewer, type PdfMountRole } from "./mount-pdf";

  let {
    app,
    file,
    role = "file",
  }: {
    app: App;
    file: TFile;
    role?: PdfMountRole;
  } = $props();

  const viewer = $derived.by((): Attachment<HTMLDivElement> => {
    const currentApp = app;
    const currentFile = file;
    const currentRole = role;
    return (node) => {
      const handle = mountPdfViewer({
        app: currentApp,
        file: currentFile,
        containerEl: node,
        role: currentRole,
      });
      return () => handle.destroy();
    };
  });
</script>

<div
  class={["pdf-viewer-frame", { "pdf-viewer-embedded": role === "embed" }]}
  {@attach viewer}
></div>

<style>
  .pdf-viewer-frame {
    width: 100%;
    height: 100%;
    min-height: 24rem;
    overflow: hidden;
  }

  .pdf-viewer-embedded {
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, calc(var(--radius) * 0.6));
  }
</style>
