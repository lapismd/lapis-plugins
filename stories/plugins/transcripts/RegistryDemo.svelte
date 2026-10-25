<script lang="ts">
  import { onMount } from "svelte";
  import {
    TRANSCRIPT_READING_VIEW,
    TranscriptsPlugin,
    sampleSavedComment,
    sampleTranscriptMarkdown,
    sampleTranscriptPath,
  } from "@lapis-notes/transcripts";
  import type { PanelDemoOpenDocument } from "../_shared/panels/create-panel-demo";
  import PanelDemo from "../_shared/panels/PanelDemo.svelte";
  import sampleMeetingUrl from "../../../packages/transcripts/assets/sample-meeting.m4a?url";

  let { document = "reading" }: { document?: "reading" | "embedded" } = $props();

  const callNotesPath = "Notes/Call notes.md";
  let files = $state<Record<string, string | ArrayBuffer> | null>(null);
  let failure = $state("");

  const openDocument = $derived<PanelDemoOpenDocument>(
    document === "embedded"
      ? {
          title: "Call notes",
          icon: "file-text",
          type: "markdown",
          state: { file: callNotesPath, mode: "preview" },
        }
      : {
          title: "Contract transcript",
          icon: "audio-lines",
          type: TRANSCRIPT_READING_VIEW,
          state: { file: sampleTranscriptPath },
        },
  );

  onMount(() => {
    let cancelled = false;
    void fetch(sampleMeetingUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error("Missing sample recording");
        const markdown = sampleTranscriptMarkdown().replace(
          "---\n",
          `---\ncomments: ${JSON.stringify([sampleSavedComment()])}\n`,
        );
        return {
          [sampleTranscriptPath]: markdown,
          "Notes/recordings/meeting.m4a": await response.arrayBuffer(),
          [callNotesPath]: `# Call notes

The signed wording sits in the recording.

![[Contract transcript.md]]
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
        plugin: TranscriptsPlugin,
        required: false,
        enabledByDefault: true,
        distribution: "bundled",
      },
    ]}
    {files}
    {openDocument}
  />
{:else}
  <div role="status" class="registry-demo" data-testid="panel-demo" data-status={failure || "booting"}>
    <div data-testid="panel-demo-status">{failure || "booting"}</div>
  </div>
{/if}

<style>
  .registry-demo {
    width: 100%;
    height: 100vh;
  }
</style>
