<script lang="ts">
  import { onMount } from "svelte";
  import { PDFPlugin, SAMPLE_PDF_PATH } from "@lapis-notes/pdf";
  import type { PanelDemoOpenDocument } from "../_shared/panels/create-panel-demo";
  import PanelDemo from "../_shared/panels/PanelDemo.svelte";
  import samplePdfUrl from "../../../packages/pdf/assets/sample.pdf?url";

  let { document = "file" }: { document?: "file" | "embedded" } = $props();

  const readingPath = "Notes/Harbor survey.md";
  let files = $state<Record<string, string | ArrayBuffer> | null>(null);
  let failure = $state("");

  const openDocument = $derived<PanelDemoOpenDocument>(
    document === "embedded"
      ? {
          title: "Harbor survey",
          icon: "file-text",
          type: "markdown",
          state: { file: readingPath, mode: "preview" },
        }
      : {
          title: "Sample",
          icon: "file-text",
          type: "lapis-pdf",
          state: { file: SAMPLE_PDF_PATH },
        },
  );

  onMount(() => {
    let cancelled = false;
    void fetch(samplePdfUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error("Missing sample PDF");
        return {
          [SAMPLE_PDF_PATH]: await response.arrayBuffer(),
          [readingPath]: `# Harbor survey

The north basin kept a late tide.

![[Sample.pdf]]
`,
        };
      })
      .then((loaded) => {
        if (!cancelled) files = loaded;
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          failure = reason instanceof Error ? reason.message : "failed";
        }
      });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if files}
  <PanelDemo
    kind="explorer"
    layout="left-sidebar"
    hideSidebars
    diagnostics="none"
    plugins={[
      {
        plugin: PDFPlugin,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
    ]}
    {files}
    {openDocument}
  />
{:else}
  <div class="registry-demo" data-testid="panel-demo" data-status={failure || "booting"}>
    <div data-testid="panel-demo-status">{failure || "booting"}</div>
  </div>
{/if}

<style>
  .registry-demo {
    width: 100%;
    height: 100vh;
  }
</style>
