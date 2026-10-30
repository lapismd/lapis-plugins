<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import type { Attachment } from "svelte/attachments";
  import { mountDocxViewer, type DocxMountRole } from "./mount-docx";

  let {
    app,
    file,
    role = "file",
  }: {
    app: App;
    file: TFile;
    role?: DocxMountRole;
  } = $props();

  const viewer = $derived.by((): Attachment<HTMLDivElement> => {
    const currentApp = app;
    const currentFile = file;
    const currentRole = role;
    return (node) => {
      const handle = mountDocxViewer({
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
  class={["docx-viewer-frame", { "docx-viewer-embedded": role === "embed" }]}
  {@attach viewer}
></div>
