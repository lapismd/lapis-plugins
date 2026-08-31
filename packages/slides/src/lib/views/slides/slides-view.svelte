<script lang="ts">
  import Reveal from "reveal.js";
  import RevealNotes from "reveal.js/plugin/notes/notes";
  import { onMount, tick, untrack } from "svelte";
  import type { App, Editor } from "@lapis-notes/api";
  import { MarkdownEmbed } from "@lapis-notes/markdown/embed";
  import {
    buildTree,
    countSections,
    extractFrontMatter,
    useSlide,
    type SectionTreeNode,
  } from "./slides";

  let {
    editor,
    app,
    sourcePath,
    onClose,
  }: {
    editor: Editor;
    app: App;
    sourcePath: string;
    onClose: () => void;
  } = $props();

  let contentEl: HTMLDivElement = $state()!;
  let deck: any = $state(null);
  let revealInstance: any = null;
  let revealInitPromise: Promise<void> | null = null;
  let disposed = false;
  const destroyedDecks = new WeakSet<object>();

  type BrowserIdleDeadline = {
    didTimeout: boolean;
    timeRemaining: () => number;
  };

  type BrowserIdleOptions = {
    timeout?: number;
  };

  type BrowserIdleCallback = (deadline: BrowserIdleDeadline) => void;

  const browserScheduler = globalThis as typeof globalThis & {
    requestIdleCallback?: (
      callback: BrowserIdleCallback,
      options?: BrowserIdleOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  let content = $state(untrack(() => editor.getValue()));
  let [markdown, config] = $derived(extractFrontMatter(content));
  let sections = $derived(buildTree(markdown));
  let sectionCount = $derived(countSections(sections));

  function scheduleRevealWork(callback: () => void): () => void {
    if (
      typeof browserScheduler.requestIdleCallback === "function" &&
      typeof browserScheduler.cancelIdleCallback === "function"
    ) {
      const handle = browserScheduler.requestIdleCallback(() => callback(), {
        timeout: 150,
      });
      return () => browserScheduler.cancelIdleCallback?.(handle);
    }

    const handle = requestAnimationFrame(() => callback());
    return () => cancelAnimationFrame(handle);
  }

  function destroyReveal(reveal: any): void {
    if (!reveal || destroyedDecks.has(reveal)) {
      return;
    }

    destroyedDecks.add(reveal);

    try {
      reveal.destroy();
    } catch (error) {
      console.warn("Failed to destroy Reveal deck cleanly", error);
    }
  }

  $effect(() => {
    if (!contentEl || revealInstance || revealInitPromise || disposed) {
      return;
    }

    let cancelled = false;
    let mountFrame: number | null = null;
    let cancelScheduledInit: (() => void) | null = null;

    const initializeWhenConnected = () => {
      mountFrame = requestAnimationFrame(() => {
        mountFrame = null;
        if (cancelled || disposed || !contentEl) {
          return;
        }
        const bounds = contentEl.getBoundingClientRect();
        if (!contentEl.isConnected || bounds.width <= 0 || bounds.height <= 0) {
          initializeWhenConnected();
          return;
        }

        cancelScheduledInit = scheduleRevealWork(() => {
          void tick().then(() => {
        if (
          cancelled ||
          !contentEl ||
          revealInstance ||
          revealInitPromise ||
          disposed
        ) {
          return;
        }

        const reveal = new Reveal(contentEl, {
          plugins: [RevealNotes],
        });
        revealInstance = reveal;

        const initPromise = reveal
          .initialize({
            embedded: true,
            keyboardCondition: "focused",
            ...config,
          })
          .then(() => {
            if (
              cancelled ||
              disposed ||
              revealInstance !== reveal ||
              !contentEl ||
              !contentEl.isConnected
            ) {
              destroyReveal(reveal);
              return;
            }

            deck = reveal;
            contentEl.dataset.revealReady = "true";
            reveal.layout();
            reveal.sync();
            contentEl.focus();
          })
          .finally(() => {
            if (revealInitPromise === initPromise) {
              revealInitPromise = null;
            }
          });

        revealInitPromise = initPromise;
          });
        });
      });
    };

    initializeWhenConnected();

    return () => {
      cancelled = true;
      if (mountFrame !== null) cancelAnimationFrame(mountFrame);
      cancelScheduledInit?.();
    };
  });

  $effect(() => {
    if (!deck || disposed) {
      return;
    }

    content;
    sectionCount;
    let cancelled = false;
    const cancelScheduledSync = scheduleRevealWork(() => {
      void tick().then(() => {
        if (cancelled || !deck || disposed) {
          return;
        }

        const indices = deck.getIndices();
        deck.configure({
          embedded: true,
          keyboardCondition: "focused",
          ...config,
        });
        deck.sync();
        deck.layout();
        deck.slide(indices.h ?? 0, indices.v ?? 0, indices.f ?? 0);
      });
    });

    return () => {
      cancelled = true;
      cancelScheduledSync();
    };
  });

  onMount(() => {
    disposed = false;

    const stopTracking = editor.trackChanges();
    const changeHandler = editor.on("change", (data) => {
      content = data;
    });

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeydown, true);

    return () => {
      disposed = true;

      stopTracking();
      editor.offref(changeHandler);
      document.removeEventListener("keydown", handleKeydown, true);

      const activeReveal = revealInstance;
      const pendingInit = revealInitPromise;

      deck = null;
      revealInstance = null;
      revealInitPromise = null;
      delete contentEl?.dataset.revealReady;

      if (activeReveal && pendingInit) {
        void pendingInit.finally(() => {
          destroyReveal(activeReveal);
        });
      } else {
        destroyReveal(activeReveal);
      }
    };
  });
</script>

<div class="slides-overlay" data-testid="slides-overlay">
  <button
    type="button"
    class="slides-close-button"
    aria-label="Close presentation"
    data-testid="slides-close"
    onclick={onClose}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-x-icon lucide-x"
      ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
    >
  </button>

  <div
    class="slides-view reveal"
    bind:this={contentEl}
    tabindex="-1"
    data-testid="slides-deck"
  >
    <div class="slides">
      {#each sections as section}
        {@render Tree({ section })}
      {/each}
    </div>
  </div>
</div>

{#snippet Tree({ section }: { section: SectionTreeNode })}
  <section use:useSlide={section}>
    <div class="markdown-rendered slides-markdown">
      <MarkdownEmbed
        {app}
        inline
        value={section.content}
        {sourcePath}
        highlight={false}
      />
    </div>
    {#if section.notes}
      <aside class="notes">
        <div class="markdown-rendered slides-markdown">
          <MarkdownEmbed
            {app}
            inline
            value={section.notes}
            {sourcePath}
            highlight={false}
          />
        </div>
      </aside>
    {/if}
  </section>
  {#if section.children.length}
    <section>
      {#each section.children as child}
        {@render Tree({ section: child })}
      {/each}
    </section>
  {/if}
{/snippet}
