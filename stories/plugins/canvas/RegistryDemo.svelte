<script lang="ts">
  import {
    CanvasPlugin,
    SAMPLE_CANVAS_PATH,
    SAMPLE_READING_NOTE_PATH,
    sampleCanvasFiles,
  } from "@lapis-notes/canvas";
  import type { PanelDemoOpenDocument } from "../_shared/panels/create-panel-demo";
  import { researchCanvasFiles } from "./research-fixture";
  import PanelDemo from "../_shared/panels/PanelDemo.svelte";

  let { document = "file" }: { document?: "file" | "embedded" } = $props();

  const files = { ...sampleCanvasFiles(), ...researchCanvasFiles() };

  const openDocument = $derived<PanelDemoOpenDocument>(
    document === "embedded"
      ? {
          title: "Reading",
          icon: "file-text",
          type: "markdown",
          state: { file: SAMPLE_READING_NOTE_PATH, mode: "preview" },
        }
      : {
          title: "Sample",
          icon: "network",
          type: "lapis-canvas",
          state: { file: SAMPLE_CANVAS_PATH },
        },
  );
</script>

<PanelDemo
  kind="explorer"
  layout="left-sidebar"
  diagnostics="none"
  plugins={[
    {
      plugin: CanvasPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]}
  {files}
  {openDocument}
/>
