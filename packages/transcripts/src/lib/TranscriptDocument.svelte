<script lang="ts">
  import {
    CommentQueue,
    Transcript,
    TranscriptController,
    type MessageAction,
    type TranscriptBlock,
    type TranscriptCommentThread,
    type TranscriptItem,
    type TranscriptProps,
    type TranscriptSubmission,
    type TranscriptSubmissionResult,
  } from "@lapismd/design-core/chat";
  import { sampleReader } from "./sample-turns";

  export type TranscriptCommentSend = {
    visible: boolean;
    enabled: boolean;
    send: () => Promise<boolean> | false | undefined;
  };

  const idleCommentSend: TranscriptCommentSend = {
    visible: false,
    enabled: false,
    send: () => undefined,
  };

  let {
    items,
    threads,
    playingId = "",
    onSend,
    getMessageActions,
    markdown,
    resolveFileLink,
    label = "Transcript",
    commentSend = $bindable(idleCommentSend),
  }: {
    items: readonly TranscriptItem[];
    threads: TranscriptCommentThread[];
    playingId?: string;
    commentSend?: TranscriptCommentSend;
    markdown?: TranscriptProps["markdown"];
    resolveFileLink?: TranscriptProps["resolveFileLink"];
    label?: string;
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
      ...(resolveFileLink ? { resolveFileLink } : {}),
    }),
    [...threads],
  );
  const queuedComments = $derived(
    Boolean(comments.active) ||
      comments.pending.length > 0 ||
      comments.sending,
  );

  $effect(() => {
    commentSend = {
      visible: queuedComments,
      enabled: comments.canSend,
      send: () => comments.send(),
    };
    return () => {
      commentSend = idleCommentSend;
    };
  });
</script>

{#snippet queuedSection()}
  <CommentQueue state={comments} />
{/snippet}

<Transcript
  {items}
  {markdown}
  author={sampleReader}
  canComment={true}
  commentState={comments}
  view="document"
  scrollButton={true}
  label={label}
  logLabel="Transcript turns"
  afterItems={comments.pending.length > 0 ? queuedSection : undefined}
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
