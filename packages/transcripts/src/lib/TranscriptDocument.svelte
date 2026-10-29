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
  import AudioLinesIcon from "@lucide/svelte/icons/audio-lines";
  import PauseIcon from "@lucide/svelte/icons/pause";

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
    onPause,
    onSend,
    getMessageActions,
    markdown,
    resolveFileLink,
    readerExtensions,
    label = "Transcript",
    commentSend = $bindable(idleCommentSend),
    searchOpen = $bindable(false),
  }: {
    items: readonly TranscriptItem[];
    threads: TranscriptCommentThread[];
    playingId?: string;
    onPause?: () => void;
    commentSend?: TranscriptCommentSend;
    markdown?: TranscriptProps["markdown"];
    resolveFileLink?: TranscriptProps["resolveFileLink"];
    readerExtensions?: TranscriptProps["readerExtensions"];
    label?: string;
    searchOpen?: boolean;
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
      ...(readerExtensions ? { readerExtensions } : {}),
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

{#snippet findField()}
  <input class="transcript-find" type="text" aria-label="Find" />
{/snippet}

<Transcript
  {items}
  {markdown}
  {readerExtensions}
  author={sampleReader}
  canComment={true}
  commentState={comments}
  view="document"
  scrollButton={true}
  label={label}
  beforeItems={searchOpen ? findField : undefined}
  logLabel="Transcript turns"
  afterItems={comments.pending.length > 0 ? queuedSection : undefined}
>
  {#snippet metadataSupplement(item)}
    {#if item.id === playingId}
      <span class="transcript-reading-playing">
        <AudioLinesIcon class="transcript-reading-sound" aria-hidden="true" />
        <span class="transcript-reading-playing-label">Playing</span>
        {#if onPause}
          <button
            type="button"
            class="transcript-reading-pause"
            aria-label="Pause"
            onclick={(event) => {
              event.stopPropagation();
              onPause?.();
            }}
          >
            <PauseIcon aria-hidden="true" />
          </button>
        {/if}
      </span>
    {/if}
  {/snippet}
</Transcript>

<style>
  .transcript-reading-playing {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    color: var(--foreground);
  }

  .transcript-reading-playing-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  :global(.transcript-reading-sound) {
    width: 0.875rem;
    height: 0.875rem;
    overflow: visible;
  }

  :global(.transcript-reading-sound path) {
    transform-box: fill-box;
    transform-origin: center;
    animation: transcript-reading-sound 1s ease-in-out infinite;
  }

  :global(.transcript-reading-sound path:nth-child(2n)) {
    animation-delay: 0.16s;
  }

  :global(.transcript-reading-sound path:nth-child(3n)) {
    animation-delay: 0.32s;
  }

  .transcript-reading-pause {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .transcript-reading-pause:hover,
  .transcript-reading-pause:focus-visible {
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
  }

  .transcript-reading-pause :global(svg) {
    width: 0.75rem;
    height: 0.75rem;
  }

  @keyframes transcript-reading-sound {
    0%,
    100% {
      transform: scaleY(0.45);
    }
    50% {
      transform: scaleY(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.transcript-reading-sound path) {
      animation: none;
    }
  }
</style>
