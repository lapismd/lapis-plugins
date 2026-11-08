<script lang="ts">
  import { untrack } from "svelte";
  import type { App, TFile, MarkdownFileSurfaceHandle } from "@lapis-notes/api";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";

  let {
    app,
    file,
    editing,
    readOnly = false,
    onEditingChange,
  }: {
    app: App;
    file: TFile;
    editing: boolean;
    readOnly?: boolean;
    onEditingChange: (editing: boolean) => void;
  } = $props();
  let container = $state<HTMLDivElement>();
  let handle = $state<MarkdownFileSurfaceHandle | null>(null);
  let error = $state("");
  let pending: Promise<MarkdownFileSurfaceHandle> | null = null;
  const sourcePath = $derived(file.path);

  export async function flush(): Promise<boolean> {
    const mounted = await pending;
    return (await mounted?.flush()) ?? true;
  }

  $effect(() => {
    if (!container || !app.markdownFileSurfaces.available) return;
    const host = container;
    const path = sourcePath;
    const source = untrack(() => app.vault.getFileByPath(path) ?? file);
    const owner = app;
    const editable = !readOnly;
    let cancelled = false;
    error = "";
    const mounted = Promise.resolve(
      untrack(() =>
        owner.markdownFileSurfaces.mount({
          containerEl: host,
          file: source,
          editable,
          activation: "click",
          returnToPreviewOnBlur: true,
          surface: { id: "bases-card-detail", context: { path: source.path } },
          onEditingChange: (next) => onEditingChange(next),
        }),
      ),
    );
    pending = mounted;
    void mounted
      .then(async (surface) => {
        if (cancelled) return;
        handle = surface;
      })
      .catch((reason) => {
        if (!cancelled)
          error = reason instanceof Error ? reason.message : String(reason);
      });
    return () => {
      cancelled = true;
      handle = null;
      void mounted
        .then(async (surface) => {
          await surface.flush();
          await surface.dispose();
        })
        .catch(console.error);
    };
  });

  $effect(() => {
    const surface = handle;
    if (!surface) return;
    const shouldEdit = editing && !readOnly;
    untrack(() => {
      if (shouldEdit)
        void Promise.resolve(surface.enter()).catch(
          (reason) => (error = String(reason)),
        );
      else
        void surface
          .exit()
          .then((saved) => {
            if (!saved) onEditingChange(true);
          })
          .catch((reason) => (error = String(reason)));
    });
  });
</script>

{#if error}<p role="alert">{error}</p>{/if}
{#if !app.markdownFileSurfaces.available}
  <p role="status">Markdown preview is unavailable.</p>
  <button type="button" onclick={() => app.openFile(file)}>Open file</button>
{:else}
  <ScrollArea class="bases-note-detail-scroll" orientation="vertical">
    <div
      bind:this={container}
      class="bases-note-detail-surface"
      data-ui-part="markdown-detail"
      data-editing-requested={editing ? "true" : "false"}
    ></div>
  </ScrollArea>
{/if}

<style>
  :global(.bases-note-detail-scroll) {
    height: 28rem;
    min-height: 0;
  }
  .bases-note-detail-surface {
    --ui-markdown-file-surface-background: var(
      --ui-kanban-detail-surface,
      transparent
    );
    height: 100%;
    min-height: 0;
    min-width: 0;
  }
</style>
