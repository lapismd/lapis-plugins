<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App, TAbstractFile, WorkspaceLeaf } from "@lapis-notes/api";
  import { createLapisMiraFileAdapter } from "@lapis-notes/markdown";
  import {
    type MessageAction,
    type TranscriptBlock,
    type TranscriptProps,
    type TranscriptSubmission,
    type TranscriptSubmissionResult,
  } from "@lapismd/design-core/chat";
  import { Slider } from "@lapismd/design-core/shadcn/slider";
  import TranscriptDocument, {
    type TranscriptCommentSend,
  } from "./TranscriptDocument.svelte";
  import {
  audioPathCandidates,
  playableMediaUrl,
  recordingMediaType,
} from "./transcript-audio";
  import {
    commentsFromValue,
    removeComments,
    upsertComments,
    writeComments,
  } from "./transcript-comments";
  import {
    projectTranscript,
    type ProjectedTranscript,
  } from "./project-transcript";
  import FileCodeIcon from "@lucide/svelte/icons/file-code";
  import SendIcon from "@lucide/svelte/icons/send-horizontal";
  import PauseIcon from "@lucide/svelte/icons/pause";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SkipBackIcon from "@lucide/svelte/icons/skip-back";
  import SkipForwardIcon from "@lucide/svelte/icons/skip-forward";
  import Volume1Icon from "@lucide/svelte/icons/volume-1";
  import Volume2Icon from "@lucide/svelte/icons/volume-2";
  import VolumeXIcon from "@lucide/svelte/icons/volume-x";
  import {
    activeTurnForTime,
    formatPlayhead,
    timestampToSeconds,
  } from "./sample-playback";
import {
    sampleCommentThreads,
    samplePlayheadLabel,
    sampleRecordingDurationSeconds,
    sampleSpeakerCount,
    sampleTranscriptItems,
    sampleTranscriptMarkdown,
    sampleTranscriptPath,
  } from "./sample-turns";

  let {
    app = null,
    leaf = null,
    returnViewType = "lapis-transcripts-reading",
    audioUrl = "",
    mode = "preview",
    filePath = "",
    label = "Transcript",
  }: {
    app?: App | null;
    leaf?: WorkspaceLeaf | null;
    returnViewType?: string;
    audioUrl?: string;
    mode?: "preview" | "file";
    filePath?: string;
    label?: string;
  } = $props();

  const fileAdapter = $derived(
    app ? createLapisMiraFileAdapter(app) : undefined,
  );

  const playbackRates = [0.75, 1, 1.25, 1.5, 2] as const;
  const skipSeconds = 10;
  // svelte-ignore state_referenced_locally
  const initialSeconds =
    mode === "file" ? 0 : timestampToSeconds(samplePlayheadLabel);
  // svelte-ignore state_referenced_locally
  let durationSeconds = $state(
    mode === "file" ? 0 : sampleRecordingDurationSeconds,
  );
  let markdown = $state("");
  let frontMatterComments = $state<unknown>(undefined);
  // svelte-ignore state_referenced_locally
  let loading = $state(mode === "file");
  let resolvedAudioUrl = $state("");
  let ownedAudioUrl = "";
  let refreshGeneration = 0;

  let readingRoot = $state<HTMLDivElement>();
  let playing = $state(false);
  let followAlong = $state(true);
  let currentSeconds = $state(initialSeconds);
  let scrubbing = $state(false);
  let scrubSeconds = $state(initialSeconds);
  let volume = $state(1);
  let muted = $state(false);
  let playbackRate = $state<(typeof playbackRates)[number]>(1);
  let openingSource = $state(false);
  let commentSend = $state<TranscriptCommentSend>({
    visible: false,
    enabled: false,
    send: () => undefined,
  });
  let audio: HTMLAudioElement | undefined;
  let programmaticScroll = false;
  let lastScrolledTurnId = "";

  const projection = $derived<ProjectedTranscript | null>(
    mode === "file" ? projectTranscript(markdown, frontMatterComments) : null,
  );
  const displayItems = $derived(projection?.items ?? [...sampleTranscriptItems]);
  const secondsByTurn = $derived(projection?.secondsByTurn);
  const activeTurn = $derived(
    activeTurnForTime(displayItems, currentSeconds, secondsByTurn),
  );
  const speakerCount = $derived(
    mode === "file"
      ? new Set(
          displayItems.flatMap((item) =>
            item.author?.id ? [item.author.id] : [],
          ),
        ).size
      : sampleSpeakerCount,
  );
  const playbackUrl = $derived(mode === "file" ? resolvedAudioUrl : audioUrl);
  const notePath = $derived(mode === "file" ? filePath : sampleTranscriptPath);
  const renderedMarkdown = $derived<TranscriptProps["markdown"]>(
    fileAdapter ? { sourcePath: notePath, fileAdapter } : undefined,
  );
  const resolveFileLink = (
    _block: TranscriptBlock,
    destination: string,
  ): (() => void) | undefined => {
    if (!fileAdapter || !destination.trim()) return undefined;
    if (
      /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(destination) ||
      destination.startsWith("mailto:")
    ) {
      return undefined;
    }
    return () => {
      const path = destination.split("#")[0] ?? destination;
      void Promise.resolve(
        fileAdapter.resolveLink({
          href: destination,
          path,
          sourcePath: notePath,
        }),
      ).then((file) => {
        if (file) void fileAdapter.openFile?.(file);
      });
    };
  };
  const playingId = $derived(playing && activeTurn ? activeTurn.id : "");
  const playheadLabel = $derived(formatPlayhead(currentSeconds));
  const durationLabel = $derived(formatPlayhead(durationSeconds));
  const seekSeconds = $derived(scrubbing ? scrubSeconds : currentSeconds);
  const seekMax = $derived(Math.max(durationSeconds, 0.1));
  const volumeLevel = $derived(muted ? 0 : volume);

  async function openSource(): Promise<void> {
    if (!app || !leaf || openingSource || !notePath) return;
    openingSource = true;
    try {
      if (
        mode !== "file" &&
        !app.vault.getAbstractFileByPath(notePath)
      ) {
        await app.vault.create(notePath, sampleTranscriptMarkdown());
      }
      await leaf.setViewState({
        type: "markdown",
        state: {
          file: notePath,
          mode: "source",
          returnTarget: {
            type: returnViewType,
            label: "Transcript",
            icon: "audio-lines",
          },
        },
      });
    } finally {
      openingSource = false;
    }
  }

  function scrollTurnIntoView(id: string): void {
    const viewport = readingRoot?.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    );
    const item = readingRoot?.querySelector<HTMLElement>(
      `[data-chat-item="${CSS.escape(id)}"]`,
    );
    if (!viewport || !item) return;
    const top =
      item.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop;
    programmaticScroll = true;
    viewport.scrollTo({ top: Math.max(0, top - 24) });
    requestAnimationFrame(() => {
      programmaticScroll = false;
    });
  }

  function onViewportScroll(): void {
    if (programmaticScroll) return;
    followAlong = false;
  }

  function resumeFollow(): void {
    lastScrolledTurnId = "";
    followAlong = true;
  }

  async function togglePlayback(): Promise<void> {
    if (!audio) return;
    if (playing) {
      audio.pause();
      playing = false;
      return;
    }
    try {
      await audio.play();
      playing = true;
    } catch {
      playing = false;
    }
  }

  function clampTime(seconds: number): number {
    return Math.min(Math.max(0, seconds), durationSeconds || seconds);
  }

  function placePlayhead(seconds: number): void {
    const next = clampTime(seconds);
    currentSeconds = next;
    scrubSeconds = next;
    if (audio) audio.currentTime = next;
    lastScrolledTurnId = "";
    followAlong = true;
  }

  function beginScrub(seconds: number): void {
    scrubbing = true;
    placePlayhead(seconds);
  }

  function commitScrub(seconds: number): void {
    placePlayhead(seconds);
    scrubbing = false;
  }

  function skipBy(delta: number): void {
    placePlayhead(currentSeconds + delta);
  }

  function setVolume(next: number): void {
    volume = Math.min(1, Math.max(0, next));
    muted = volume === 0;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }

  function toggleMute(): void {
    muted = !muted;
    if (!audio) return;
    audio.muted = muted;
    if (!muted) audio.volume = volume;
  }

  function cycleRate(): void {
    const index = playbackRates.indexOf(playbackRate);
    const next = playbackRates[(index + 1) % playbackRates.length] ?? 1;
    playbackRate = next;
    if (audio) audio.playbackRate = next;
  }

  async function seekToTurn(id: string): Promise<void> {
    const item = displayItems.find((turn) => turn.id === id);
    if (!item?.timestamp) return;
    const seconds = secondsByTurn?.[item.id] ?? timestampToSeconds(item.timestamp);
    placePlayhead(seconds);
    if (!audio) return;
    try {
      await audio.play();
      playing = true;
    } catch {
      playing = false;
    }
  }

  function releaseOwnedAudio(): void {
    if (!ownedAudioUrl) return;
    URL.revokeObjectURL(ownedAudioUrl);
    ownedAudioUrl = "";
  }

  async function resolveAudio(
    path: string,
    reference: string | null,
  ): Promise<{ url: string; owned: boolean }> {
    if (!app || !reference) return { url: "", owned: false };
    for (const candidate of audioPathCandidates(path, reference)) {
      const audioFile = app.vault.getFileByPath(candidate);
      if (!audioFile) continue;
      const resource = await app.vault.getResourceUrl(audioFile);
      if (playableMediaUrl(resource)) return { url: resource, owned: false };
      const bytes = await app.vault.readBinary(audioFile);
      return {
        url: URL.createObjectURL(
          new Blob([bytes], { type: recordingMediaType(audioFile.extension) }),
        ),
        owned: true,
      };
    }
    return { url: "", owned: false };
  }

  function replaceOwnedAudio(url: string, owned: boolean): void {
    const previous = ownedAudioUrl;
    ownedAudioUrl = owned ? url : "";
    if (previous && previous !== url) URL.revokeObjectURL(previous);
  }

  async function refreshNote(): Promise<void> {
    const generation = ++refreshGeneration;
    if (mode !== "file" || !app || !filePath) {
      loading = false;
      return;
    }
    const file = app.vault.getFileByPath(filePath);
    if (!file) {
      if (generation !== refreshGeneration) return;
      markdown = "";
      frontMatterComments = undefined;
      replaceOwnedAudio("", false);
      resolvedAudioUrl = "";
      loading = false;
      return;
    }
    markdown = await app.vault.read(file);
    const resolvedComments = app.metadataCache.getCache(file.path)?.frontmatter
      ?.comments;
    const projected = projectTranscript(markdown, resolvedComments);
    const resolved = await resolveAudio(file.path, projected.audioReference);
    if (generation !== refreshGeneration) {
      if (resolved.owned) URL.revokeObjectURL(resolved.url);
      return;
    }
    frontMatterComments = resolvedComments;
    replaceOwnedAudio(resolved.url, resolved.owned);
    resolvedAudioUrl = resolved.url;
    loading = false;
  }

  async function persistComments(
    snapshot: TranscriptSubmission,
  ): Promise<TranscriptSubmissionResult> {
    if (!app || !filePath) {
      return {
        publication: "refused",
        error: "The note is no longer available.",
      };
    }
    const file = app.vault.getFileByPath(filePath);
    if (!file) {
      return {
        publication: "refused",
        error: "The note is no longer available.",
      };
    }
    const versions: Record<string, string> = {};
    let saved = commentsFromValue(undefined);
    await app.fileManager.processFrontMatter(
      file,
      (frontmatter: Record<string, unknown>) => {
        saved = upsertComments(commentsFromValue(frontmatter.comments), snapshot);
        writeComments(frontmatter, saved);
      },
    );
    for (const comment of snapshot.comments) {
      const match = saved.find((item) => item.id === comment.commentId);
      if (match) versions[comment.commentId] = match.version;
    }
    return { publication: "published", commentVersions: versions };
  }

  async function removeSavedComments(ids: readonly string[]): Promise<void> {
    if (!app || !filePath || ids.length === 0) return;
    const file = app.vault.getFileByPath(filePath);
    if (!file) return;
    await app.fileManager.processFrontMatter(
      file,
      (frontmatter: Record<string, unknown>) => {
        writeComments(
          frontmatter,
          removeComments(commentsFromValue(frontmatter.comments), ids),
        );
      },
    );
  }

  function messageActions(
    _messageId: string,
    block: TranscriptBlock,
  ): readonly MessageAction[] {
    const ids = (projection?.threads ?? [])
      .filter((thread) => thread.anchor.blockId === block.id)
      .flatMap((thread) => thread.comments.map((comment) => comment.id));
    if (ids.length === 0) return [];
    return [
      {
        id: "remove-transcript-comment",
        label: ids.length === 1 ? "Remove comment" : "Remove comments",
        destructive: true,
        onSelect: () => {
          void removeSavedComments(ids);
        },
      },
    ];
  }

  function turnIdFrom(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null;
    const stamp = target.closest('[data-ui-part="timestamp"]');
    const item = stamp?.closest<HTMLElement>("[data-chat-item]");
    return item?.dataset.chatItem ?? null;
  }

  function onReadingClick(event: MouseEvent): void {
    const id = turnIdFrom(event.target);
    if (!id) return;
    event.preventDefault();
    void seekToTurn(id);
  }

  function onReadingKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    const id = turnIdFrom(event.target);
    if (!id) return;
    event.preventDefault();
    void seekToTurn(id);
  }

  $effect(() => {
    const node = readingRoot;
    const id = playing ? (activeTurn?.id ?? "") : "";
    if (!node) return;
    for (const item of node.querySelectorAll<HTMLElement>("[data-chat-item]")) {
      if (item.dataset.chatItem === id) item.dataset.playing = "true";
      else delete item.dataset.playing;
    }
    for (const stamp of node.querySelectorAll<HTMLElement>(
      '[data-chat-item] [data-ui-part="timestamp"]',
    )) {
      stamp.tabIndex = 0;
      stamp.setAttribute("role", "button");
      const label = stamp.textContent?.trim() || "timestamp";
      stamp.setAttribute("aria-label", `Play from ${label}`);
    }
  });

  $effect(() => {
    const id = playing && followAlong ? (activeTurn?.id ?? "") : "";
    if (!id || id === lastScrolledTurnId) return;
    lastScrolledTurnId = id;
    scrollTurnIntoView(id);
  });

  $effect(() => {
    const url = playbackUrl;
    if (!url) {
      audio?.pause();
      audio = undefined;
      if (mode === "file") playing = false;
      return;
    }
    const element = new Audio(url);
    element.preload = "auto";
    const settings = untrack(() => ({
      volume,
      muted,
      playbackRate,
      initialSeconds,
    }));
    element.volume = settings.volume;
    element.muted = settings.muted;
    element.playbackRate = settings.playbackRate;
    const placeInitialPlayhead = () => {
      if (!Number.isFinite(element.duration)) return;
      durationSeconds = element.duration;
      element.currentTime = Math.min(settings.initialSeconds, element.duration);
      currentSeconds = element.currentTime;
    };
    const onTime = () => {
      if (scrubbing) return;
      currentSeconds = element.currentTime;
      if (element.ended) playing = false;
    };
    element.addEventListener("loadedmetadata", placeInitialPlayhead);
    element.addEventListener("timeupdate", onTime);
    audio = element;
    return () => {
      element.pause();
      element.removeEventListener("loadedmetadata", placeInitialPlayhead);
      element.removeEventListener("timeupdate", onTime);
      element.src = "";
      if (audio === element) audio = undefined;
    };
  });

  $effect(() => {
    const ready = mode === "preview" || (!loading && projection?.qualified);
    if (!ready) return;
    const viewport = readingRoot?.querySelector(
      '[data-ui-part="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.addEventListener("scroll", onViewportScroll, { passive: true });
    viewport.addEventListener("wheel", onViewportScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onViewportScroll);
      viewport.removeEventListener("wheel", onViewportScroll);
    };
  });

  onMount(() => {
    const onClick = (event: Event) => onReadingClick(event as MouseEvent);
    const onKeydown = (event: Event) => onReadingKeydown(event as KeyboardEvent);
    readingRoot?.addEventListener("click", onClick);
    readingRoot?.addEventListener("keydown", onKeydown);
    const watchedPath = filePath;
    const onNote = (file: TAbstractFile) => {
      if (file.path === watchedPath) void refreshNote();
    };
    const modify =
      mode === "file" && app ? app.vault.on("modify", onNote) : null;
    const changed =
      mode === "file" && app ? app.metadataCache.on("changed", onNote) : null;
    if (mode === "file") void refreshNote();
    return () => {
      readingRoot?.removeEventListener("click", onClick);
      readingRoot?.removeEventListener("keydown", onKeydown);
      if (modify) app?.vault.offref(modify);
      if (changed) app?.metadataCache.offref(changed);
      releaseOwnedAudio();
    };
  });
</script>

<div
  bind:this={readingRoot}
  class="transcript-reading"
  data-testid="transcript-reading"
>
  <div class="transcript-reading-frame">
    {#if mode === "file" && loading}
      <p class="transcript-reading-empty">Loading transcript…</p>
    {:else if mode === "file" && !projection?.qualified}
      <p class="transcript-reading-empty">This note is not a transcript.</p>
    {:else if mode === "preview"}
      <TranscriptDocument
        items={sampleTranscriptItems}
        threads={sampleCommentThreads}
        {playingId}
        markdown={renderedMarkdown}
        {resolveFileLink}
        {label}
        bind:commentSend
      />
    {:else if projection}
      {#key projection.signature}
        <TranscriptDocument
          items={projection.items}
          threads={projection.threads}
          {playingId}
          markdown={renderedMarkdown}
          {resolveFileLink}
          {label}
          onSend={persistComments}
          getMessageActions={messageActions}
          bind:commentSend
        />
      {/key}
    {/if}
  </div>
  <div class="transcript-reading-status" data-testid="transcript-reading-status">
    <span class="transcript-reading-status-text">{speakerCount} speakers</span>
    <span class="transcript-reading-time">{playheadLabel}</span>
    <div class="transcript-reading-seek">
      <Slider
        type="single"
        value={seekSeconds}
        min={0}
        max={seekMax}
        step={0.1}
        disabled={!playbackUrl}
        aria-label="Seek"
        onValueChange={beginScrub}
        onValueCommit={commitScrub}
      />
    </div>
    <span class="transcript-reading-time transcript-reading-duration"
      >{durationLabel}</span
    >
    <button
      type="button"
      class="transcript-reading-icon transcript-reading-skip"
      aria-label="Back {skipSeconds} seconds"
      title="Back {skipSeconds} seconds"
      disabled={!playbackUrl}
      onclick={(event) => {
        event.stopPropagation();
        skipBy(-skipSeconds);
      }}
    >
      <SkipBackIcon aria-hidden="true" />
    </button>
    <button
      type="button"
      class="transcript-reading-icon transcript-reading-play"
      aria-label={playing ? "Pause" : "Play"}
      disabled={!playbackUrl}
      title={playing ? "Pause" : "Play"}
      onclick={(event) => {
        event.stopPropagation();
        void togglePlayback();
      }}
    >
      {#if playing}
        <PauseIcon aria-hidden="true" />
      {:else}
        <PlayIcon aria-hidden="true" />
      {/if}
    </button>
    <button
      type="button"
      class="transcript-reading-icon transcript-reading-skip"
      aria-label="Forward {skipSeconds} seconds"
      title="Forward {skipSeconds} seconds"
      disabled={!playbackUrl}
      onclick={(event) => {
        event.stopPropagation();
        skipBy(skipSeconds);
      }}
    >
      <SkipForwardIcon aria-hidden="true" />
    </button>
    <button
      type="button"
      class="transcript-reading-icon"
      aria-label={muted ? "Unmute" : "Mute"}
      aria-pressed={muted}
      title={muted ? "Unmute" : "Mute"}
      onclick={(event) => {
        event.stopPropagation();
        toggleMute();
      }}
    >
      {#if muted || volume === 0}
        <VolumeXIcon aria-hidden="true" />
      {:else if volume < 0.5}
        <Volume1Icon aria-hidden="true" />
      {:else}
        <Volume2Icon aria-hidden="true" />
      {/if}
    </button>
    <div class="transcript-reading-volume">
      <Slider
        type="single"
        value={volumeLevel}
        min={0}
        max={1}
        step={0.05}
        aria-label="Volume"
        onValueChange={setVolume}
      />
    </div>
    <button
      type="button"
      class="transcript-reading-rate"
      aria-label="Playback speed, {playbackRate}×"
      title="Playback speed"
      onclick={(event) => {
        event.stopPropagation();
        cycleRate();
      }}
    >
      {playbackRate}×
    </button>
    {#if playing && !followAlong}
      <button
        type="button"
        class="transcript-reading-follow"
        onclick={(event) => {
          event.stopPropagation();
          resumeFollow();
        }}
      >
        Follow
      </button>
    {/if}
    <button
      type="button"
      class="transcript-reading-icon transcript-reading-source"
      aria-label="Source"
      title="Source"
      disabled={openingSource || !app || !leaf}
      onclick={(event) => {
        event.stopPropagation();
        void openSource();
      }}
    >
      <FileCodeIcon aria-hidden="true" />
    </button>
    {#if commentSend.visible}
      <button
        type="button"
        class="transcript-reading-icon transcript-reading-send"
        aria-label="Send message"
        title="Send message (⌘ / Ctrl + Enter)"
        aria-keyshortcuts="Control+Enter Meta+Enter"
        disabled={!commentSend.enabled}
        onclick={(event) => {
          event.stopPropagation();
          void commentSend.send();
        }}
      >
        <SendIcon aria-hidden="true" />
      </button>
    {/if}
  </div>
</div>

<style>
  .transcript-reading {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--background);
    container-name: transcript-reading;
    container-type: inline-size;
  }

  .transcript-reading-frame {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .transcript-reading-frame :global([data-ui-component="transcript"]) {
    flex: 1;
    height: 100%;
    min-height: 0;
  }

  .transcript-reading-empty {
    margin: 0;
    padding: 1.25rem;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
  }

  .transcript-reading
    :global([data-chat-item][data-playing="true"] .ui-transcript-message) {
    background: color-mix(
      in srgb,
      var(--ui-workspace-accent, var(--primary)) 12%,
      transparent
    );
    border-radius: 0.75rem;
    padding: 0.5rem 0.625rem;
  }

  .transcript-reading :global([data-chat-item] [data-ui-part="timestamp"]) {
    cursor: pointer;
    text-decoration: none;
  }

  .transcript-reading
    :global([data-chat-item] [data-ui-part="timestamp"]:hover),
  .transcript-reading
    :global([data-chat-item] [data-ui-part="timestamp"]:focus-visible) {
    color: var(--ui-workspace-accent, var(--primary));
  }

  .transcript-reading :global(.ui-transcript-document) {
    padding: 1.25rem;
  }

  .transcript-reading :global(.ui-transcript-transcript-activity) {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0 1.25rem 1.25rem;
  }

  .transcript-reading
    :global(.ui-transcript-message[data-ui-component][data-ui-part]) {
    grid-template-columns: 2rem minmax(0, 1fr);
  }

  .transcript-reading
    :global(.ui-transcript-message-avatar [data-ui-component="avatar"]) {
    --_avatar-size: 2rem;
  }

  .transcript-reading :global(.ui-transcript-document-inset) {
    margin-inline-start: 2.5rem;
  }

  .transcript-reading-status {
    box-sizing: border-box;
    display: flex;
    flex: 0 0 2rem;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    height: 2rem;
    min-width: 0;
    padding-inline: 0.5rem;
    border-block-start: 1px solid var(--ui-workspace-border, var(--border));
    background: #fff;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-size: 0.75rem;
    line-height: 1;
    user-select: none;
  }

  .transcript-reading-status-text,
  .transcript-reading-time {
    padding-inline: 0.25rem;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .transcript-reading-seek,
  .transcript-reading-volume {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .transcript-reading-seek {
    flex: 1 1 auto;
  }

  .transcript-reading-volume {
    flex: 0 0 4.5rem;
    width: 4.5rem;
  }

  .transcript-reading-seek
    :global([data-ui-component="slider"][data-ui-part="slider"]),
  .transcript-reading-volume
    :global([data-ui-component="slider"][data-ui-part="slider"]) {
    height: 1.5rem;
    min-height: 0;
  }

  .transcript-reading-seek
    :global([data-ui-component="slider"][data-ui-part="slider-track"]),
  .transcript-reading-volume
    :global([data-ui-component="slider"][data-ui-part="slider-track"]) {
    height: 0.25rem;
  }

  .transcript-reading-seek
    :global([data-ui-component="slider"][data-ui-part="slider-thumb"]),
  .transcript-reading-volume
    :global([data-ui-component="slider"][data-ui-part="slider-thumb"]) {
    width: 0.75rem;
    height: 0.75rem;
  }

  .transcript-reading-rate {
    flex: 0 0 auto;
    min-width: 2.75rem;
    height: 1.5rem;
    border: 0;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0 0.25rem;
    background: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    line-height: 1.5rem;
  }

  .transcript-reading-rate:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, #fff);
  }

  .transcript-reading-follow {
    border: 0;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0 0.375rem;
    background: transparent;
    color: var(--foreground);
    font: inherit;
    line-height: 1.5rem;
  }

  .transcript-reading-follow:hover {
    background: color-mix(in srgb, var(--foreground) 8%, #fff);
  }

  .transcript-reading-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: 0;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0;
    background: transparent;
    color: inherit;
    line-height: 1;
  }

  .transcript-reading-icon:hover:not(:disabled) {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, #fff);
  }

  .transcript-reading-source {
    margin-inline-start: 0.125rem;
  }

  .transcript-reading-icon.transcript-reading-send {
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .transcript-reading-icon.transcript-reading-send:hover:not(:disabled) {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .transcript-reading-icon.transcript-reading-send:disabled {
    opacity: 0.45;
  }

  .transcript-reading-icon :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
  }

  @container transcript-reading (max-width: 42rem) {
    .transcript-reading-rate {
      display: none;
    }
  }

  @container transcript-reading (max-width: 34rem) {
    .transcript-reading-volume,
    .transcript-reading-icon.transcript-reading-skip {
      display: none;
    }
  }

  @container transcript-reading (max-width: 26rem) {
    .transcript-reading-duration {
      display: none;
    }
  }
</style>
