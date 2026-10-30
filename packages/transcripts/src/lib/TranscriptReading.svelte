<script lang="ts">
  import { onMount, setContext, untrack } from "svelte";
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
  import TranscriptFileEmbed, {
    transcriptFileAdapterKey,
  } from "./TranscriptFileEmbed.svelte";
  import { transcriptEmbedRanges } from "./transcript-embed-reader";
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
    transcriptBodyBlockId,
    type ProjectedTranscript,
  } from "./project-transcript";
  import { transcriptNavigationStats } from "./transcript-navigation-stats";
  import { parseTranscript } from "./parse-transcript";
  import {
    replaceTranscriptSource,
    shiftCommentsForEdits,
    type TranscriptTextEdit,
  } from "./replace-transcript-text";
  import FileCodeIcon from "@lucide/svelte/icons/file-code";
  import MessageSquareXIcon from "@lucide/svelte/icons/message-square-x";
  import SearchIcon from "@lucide/svelte/icons/search";
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
    sampleRecordingReference,
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
  setContext(transcriptFileAdapterKey, () => fileAdapter);

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
  let searchOpen = $state(false);
  let hoveredTurn = $state<number | null>(null);
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
  const navigationStats = $derived(
    transcriptNavigationStats({
      speakers: speakerCount,
      durationSeconds,
      cueSeconds: Object.values(secondsByTurn ?? {}),
      audioPath:
        mode === "file"
          ? (projection?.audioReference ?? null)
          : sampleRecordingReference,
      source: mode === "file" ? markdown : sampleTranscriptMarkdown(),
    }),
  );
  const notePath = $derived(mode === "file" ? filePath : sampleTranscriptPath);
  const renderedMarkdown = $derived<TranscriptProps["markdown"]>(
    notePath
      ? { sourcePath: notePath, components: { embed: TranscriptFileEmbed } }
      : undefined,
  );
  const fileEmbeds = $derived(
    mode === "file"
      ? displayItems.flatMap((item) =>
          item.blocks.flatMap((block) =>
            block.kind === "markdown"
              ? transcriptEmbedRanges(block.text).map((range) => ({
                  key: `${block.id}:${range.from}`,
                  target: range.target,
                  label: range.label,
                }))
              : [],
          ),
        )
      : [],
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

  async function replaceBlockText(edits: readonly TranscriptTextEdit[]) {
    if (mode !== "file" || !app || !filePath || edits.length === 0) return;
    const file = app.vault.getFileByPath(filePath);
    if (!file) return;
    const source = await app.vault.read(file);
    const parsed = parseTranscript(source);
    const blocks = parsed.turns.map((turn, index) => ({
      id: transcriptBodyBlockId(turn, index, parsed.turns),
      bodyStart: turn.bodyRange.start,
      body: turn.body,
    }));
    const next = replaceTranscriptSource(source, blocks, edits);
    if (next === null || next === source) return;
    await app.vault.modify(file, next);
    await app.fileManager.processFrontMatter(
      file,
      (frontmatter: Record<string, unknown>) => {
        writeComments(
          frontmatter,
          shiftCommentsForEdits(
            commentsFromValue(frontmatter.comments),
            blocks,
            edits,
          ),
        );
      },
    );
  }

  function formatByteSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) return `${Number(kilobytes.toFixed(1))} KB`;
    return `${Number((kilobytes / 1024).toFixed(1))} MB`;
  }

  function previewTurn(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const label = target.closest("button")?.getAttribute("aria-label") ?? "";
    const match = /^Preview turn (\d+)$/.exec(label);
    hoveredTurn = match ? Number(match[1]) : null;
  }

  function openFind(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      searchOpen = true;
    }
  }

  const detailTurn = $derived(
    hoveredTurn ? displayItems[hoveredTurn - 1] : undefined,
  );

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
        icon: removeCommentIcon,
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
    if (!playbackUrl) return;
    const id = turnIdFrom(event.target);
    if (!id) return;
    event.preventDefault();
    void seekToTurn(id);
  }

  function onReadingKeydown(event: KeyboardEvent): void {
    openFind(event);
    if (!playbackUrl) return;
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
    const canPlay = playbackUrl !== "";
    for (const stamp of node.querySelectorAll<HTMLElement>(
      '[data-chat-item] [data-ui-part="timestamp"]',
    )) {
      if (!canPlay) {
        stamp.removeAttribute("role");
        stamp.removeAttribute("tabindex");
        stamp.removeAttribute("aria-label");
        continue;
      }
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
    readingRoot?.addEventListener("mouseover", previewTurn);
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
      readingRoot?.removeEventListener("mouseover", previewTurn);
      if (modify) app?.vault.offref(modify);
      if (changed) app?.metadataCache.offref(changed);
      releaseOwnedAudio();
    };
  });
</script>

<div
  bind:this={readingRoot}
  class="transcript-reading"
  class:transcript-reading-embedded={!leaf}
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
        onPause={() => {
          void togglePlayback();
        }}
        markdown={renderedMarkdown}
        {resolveFileLink}
        {label}
        bind:commentSend
        bind:searchOpen
      />
    {:else if projection}
      {#key projection.signature}
        <TranscriptDocument
          items={projection.items}
          threads={projection.threads}
          {playingId}
          onPause={() => {
            void togglePlayback();
          }}
          markdown={renderedMarkdown}
          {resolveFileLink}
          {label}
          onSend={persistComments}
          getMessageActions={messageActions}
          bind:commentSend
          bind:searchOpen
        />
      {/key}
    {/if}
  </div>
  {#if fileEmbeds.length > 0}
    <div class="transcript-file-embeds">
      {#each fileEmbeds as embed (embed.key)}
        <TranscriptFileEmbed
          adapter={fileAdapter}
          {app}
          href={embed.target}
          label={embed.label}
          sourcePath={notePath}
        />
      {/each}
    </div>
  {/if}
  {#if detailTurn}
    <div class="transcript-turn-details" role="group" aria-label="Turn details">
      <p>{detailTurn.turn?.prompt ?? detailTurn.label}</p>
      <div><span>Speakers</span><dd>{navigationStats.speakers}</dd></div>
      <div>
        <span>Duration</span><dd>{formatPlayhead(navigationStats.durationSeconds)}</dd>
      </div>
      {#if navigationStats.audioPath}
        <div><span>Audio</span><dd>{navigationStats.audioPath}</dd></div>
      {:else}
        <p>No recording</p>
      {/if}
      <div><span>Size</span><dd>{formatByteSize(navigationStats.byteSize)}</dd></div>
    </div>
  {/if}
  <div
    class={[
      "transcript-reading-status",
      { "transcript-reading-status-without-audio": !playbackUrl },
    ]}
    data-testid="transcript-reading-status"
  >
    <button
      type="button"
      class="transcript-reading-icon transcript-reading-find"
      aria-label="Find and replace"
      aria-pressed={searchOpen}
      title="Find and replace"
      onclick={(event) => {
        event.stopPropagation();
        searchOpen = !searchOpen;
      }}
    >
      <SearchIcon aria-hidden="true" />
    </button>
    <span class="transcript-reading-status-text">{speakerCount} speakers</span>
    {#if playbackUrl}
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

{#snippet removeCommentIcon()}
  <MessageSquareXIcon aria-hidden="true" />
{/snippet}

<style>
  .transcript-reading {
    position: relative;
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

  .transcript-turn-details {
    position: absolute;
    z-index: 3;
    inset-block-start: 0.75rem;
    inset-inline-start: 0.75rem;
    display: grid;
    gap: 0.25rem;
    max-width: min(22rem, calc(100% - 1.5rem));
    margin: 0;
    padding: 0.75rem;
    pointer-events: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, calc(var(--radius) * 0.6));
    background: var(--popover, var(--background));
    color: var(--popover-foreground, var(--foreground));
    box-shadow: 0 6px 22px #0002;
  }

  .transcript-turn-details p,
  .transcript-turn-details div {
    display: flex;
    gap: 0.5rem;
    margin: 0;
  }

  .transcript-turn-details dd {
    margin: 0;
  }

  .transcript-reading-embedded {
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, calc(var(--radius) * 0.6));
  }

  .transcript-file-embeds {
    flex: 0 1 auto;
    min-height: 8rem;
    max-height: 50%;
    overflow: auto;
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
    :global(
      .ui-transcript-message-metadata
        [data-ui-part="timestamp"]
        + [data-ui-part="separator"]
    ) {
    display: none;
  }

  .transcript-reading
    :global(
      [data-playing="true"]
        .ui-transcript-message-metadata
        [data-ui-part="timestamp"]
        + [data-ui-part="separator"]
    ) {
    display: inline;
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
    margin-block: -0.5rem;
    margin-inline: -0.625rem;
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
    padding-block-start: var(--ui-transcript-hover-clearance, 3rem);
    padding-inline: 1.25rem;
    padding-block-end: 1.25rem;
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
    background: var(--background);
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
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
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
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
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
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
  }

  .transcript-reading-source {
    margin-inline-start: 0.125rem;
  }

  .transcript-reading-status-without-audio .transcript-reading-source {
    margin-inline-start: auto;
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

  .transcript-reading-find[aria-pressed="true"] {
    color: var(--foreground);
    background: color-mix(in srgb, var(--foreground) 8%, transparent);
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

  /* Turn markers occupy the right edge. Hidden message actions must not cover them.
     pointer-events: none still wins user-event hit testing, so hide the controls
     even when the browser does not match hover: hover. */
  .transcript-reading :global(.ui-transcript-navigation) {
    z-index: 6;
  }

  .transcript-reading :global(.ui-transcript-turn-marker) {
    pointer-events: auto;
  }

  .transcript-reading :global(.ui-transcript-text-actions) {
    right: 2.5rem;
  }

  .transcript-reading :global(.ui-transcript-text-block .ui-transcript-text-actions) {
    display: none;
  }

  .transcript-reading :global(.ui-transcript-text-block:hover > .ui-transcript-text-actions),
  .transcript-reading :global(.ui-transcript-text-block:focus-within > .ui-transcript-text-actions),
  .transcript-reading :global(.ui-transcript-text-actions:has([data-visible="true"])) {
    display: block;
  }

  /* A nested embed sits inside the parent turn, so the parent focus rule would
     reveal every action in the embed. Only the hovered or focused turn shows. */
  @media (hover: hover) {

    .transcript-reading :global(.ui-transcript-text-block .ui-transcript-text-actions),
    .transcript-reading :global(.ui-transcript-text-block .ui-transcript-text-actions *) {
      opacity: 0;
      pointer-events: none;
    }

    .transcript-reading :global(.ui-transcript-text-block:hover > .ui-transcript-text-actions),
    .transcript-reading :global(.ui-transcript-text-block:hover > .ui-transcript-text-actions *),
    .transcript-reading :global(.ui-transcript-text-block:focus-within > .ui-transcript-text-actions),
    .transcript-reading :global(.ui-transcript-text-block:focus-within > .ui-transcript-text-actions *),
    .transcript-reading :global(.ui-transcript-text-actions:has([data-visible="true"])),
    .transcript-reading :global(.ui-transcript-text-actions:has([data-visible="true"]) *) {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
