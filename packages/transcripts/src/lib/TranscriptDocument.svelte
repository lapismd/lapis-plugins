<script lang="ts">
  import {
    Transcript,
    TranscriptController,
    type MessageAction,
    type TranscriptBlock,
    type TranscriptCommentThread,
    type TranscriptItem,
    type TranscriptSubmission,
    type TranscriptSubmissionResult,
  } from "@lapismd/design-core/chat";
  import { sampleReader } from "./sample-turns";

  let {
    items,
    threads,
    playingId = "",
    onSend,
    getMessageActions,
  }: {
    items: readonly TranscriptItem[];
    threads: TranscriptCommentThread[];
    playingId?: string;
    onSend?: (
      snapshot: TranscriptSubmission,
    ) => TranscriptSubmissionResult | Promise<TranscriptSubmissionResult>;
    getMessageActions?: (
      messageId: string,
      block: TranscriptBlock,
    ) => readonly MessageAction[];
  } = $props();

  // svelte-ignore state_referenced_locally
  const comments = new TranscriptController(
    () => ({
      items,
      author: sampleReader,
      canComment: true,
      ...(onSend ? { canEditComment: () => true, onSend } : {}),
      ...(getMessageActions ? { getMessageActions } : {}),
    }),
    [...threads],
  );
</script>

<Transcript
  {items}
  author={sampleReader}
  canComment={true}
  commentState={comments}
  view="document"
  scrollButton={true}
  label="Transcript"
  logLabel="Transcript turns"
>
  {#snippet metadataSupplement(item)}
    {#if item.id === playingId}
      <span class="transcript-reading-playing">Playing</span>
    {/if}
  {/snippet}
</Transcript>

<style>
  .transcript-reading-playing {
    color: var(--foreground);
    font-size: 0.75rem;
    font-weight: 600;
  }
</style>
