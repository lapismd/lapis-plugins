<script lang="ts">
  import { CSVPlugin, SAMPLE_CSV_PATH } from "@lapis-notes/csv";
  import type { PanelDemoOpenDocument } from "../_shared/panels/create-panel-demo";
  import PanelDemo from "../_shared/panels/PanelDemo.svelte";
  import sampleCsv from "../../../packages/csv/assets/sample.csv?raw";

  let {
    document = "table",
  }: {
    document?: "table" | "source" | "embedded" | "canvas" | "embedded-canvas";
  } = $props();

  const readingPath = "Notes/Staff readings.md";
  const reading = `# Staff readings

The south basin kept the late tide.

![[Sample.csv]]
`;
  const files = {
    [SAMPLE_CSV_PATH]: sampleCsv,
    [readingPath]: reading,
  };
  const embedded = $derived(document === "embedded" || document === "embedded-canvas");
  const openDocument = $derived<PanelDemoOpenDocument>(
    embedded
      ? {
          title: "Staff readings",
          icon: "file-text",
          type: "markdown",
          state: { file: readingPath, mode: "preview" },
        }
      : {
          title: "Sample",
          icon: document === "source" ? "file-code" : document === "canvas" ? "grid-3x3" : "table",
          type: "lapis-csv",
          state: {
            file: SAMPLE_CSV_PATH,
            mode: document === "source" ? "source" : document === "canvas" ? "canvas" : "table",
          },
        },
  );
  const configuration = $derived(
    document === "embedded"
      ? { "lapis-csv.defaultView": "table" }
      : document === "embedded-canvas"
        ? { "lapis-csv.defaultView": "canvas" }
        : undefined,
  );
</script>

<PanelDemo
  kind="explorer"
  layout="left-sidebar"
  hideSidebars
  diagnostics="none"
  plugins={[
    {
      plugin: CSVPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]}
  {files}
  {openDocument}
  {configuration}
/>
