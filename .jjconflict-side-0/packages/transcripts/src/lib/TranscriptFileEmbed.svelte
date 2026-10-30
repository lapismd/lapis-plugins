<script lang="ts" module>
  export const transcriptFileAdapterKey = "lapis-transcript-file-adapter";
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import type { App, TFile } from "@lapis-notes/api";
  import type { createLapisMiraFileAdapter } from "@lapis-notes/markdown";

  type Adapter = ReturnType<typeof createLapisMiraFileAdapter>;
  type MarkdownEmbedHandle = { destroy?: () => void | Promise<void> };
  type MarkdownEmbedRegistry = {
    renderMarkdownEmbed?: (props: {
      app: App;
      containerEl: HTMLElement;
      file: TFile;
    }) => false | MarkdownEmbedHandle;
  };

  let {
    adapter,
    app = null,
    href = "",
    id = "",
    label = "",
    text = "",
    sourcePath,
    ref = $bindable(null),
  }: {
    adapter?: Adapter;
    app?: App | null;
    href?: string;
    id?: string;
    label?: string;
    text?: string;
    sourcePath?: string;
    ref?: HTMLElement | null;
    [key: string]: unknown;
  } = $props();

  const getAdapter = getContext<(() => Adapter | undefined) | undefined>(
    transcriptFileAdapterKey,
  );
  let host = $state<HTMLDivElement>();
  let fallback = $state("");
  const target = $derived(id || href);
  const caption = $derived(text || label || target);

  $effect(() => {
    const resolved = adapter ?? getAdapter?.();
    const element = host;
    const current = target;
    const currentCaption = caption;
    fallback = "";
    if (!resolved || !element || !current) return;
    let disposed = false;
    let cleanup: void | (() => void);
    void Promise.resolve(
      resolved.resolveLink({
        href: current,
        path: current.split("#")[0] ?? current,
        sourcePath,
      }),
    ).then(async (file) => {
      if (disposed || !file) return;
      const vaultFile = app?.vault.getFileByPath(file.path) ?? null;
      const registry = app?.embedRegistry as MarkdownEmbedRegistry | undefined;
      if (vaultFile && app && registry?.renderMarkdownEmbed) {
        const handle = registry.renderMarkdownEmbed({
          app,
          containerEl: element,
          file: vaultFile,
        });
        if (handle !== false) {
          cleanup = () => {
            void handle.destroy?.();
          };
          return;
        }
      }
      const rendered = resolved.renderEmbed?.(
        {
          href: current,
          path: file.path,
          sourcePath,
          file,
          label: currentCaption,
        },
        element,
      );
      if (rendered !== false) {
        cleanup = rendered ?? undefined;
        return;
      }
      const body = (await resolved.readMarkdown?.(file)) ?? "";
      if (!disposed) fallback = body;
    });
    return () => {
      disposed = true;
      cleanup?.();
      element.replaceChildren();
    };
  });
</script>

<figure
  class="mira-embed ui-transcript-markdown-preview"
  bind:this={ref}
  data-embed={target}
>
  <figcaption>{caption}</figcaption>
  <div bind:this={host}></div>
  {#if fallback}<p>{fallback}</p>{/if}
</figure>

<style>
  figure {
    box-sizing: border-box;
    margin: 0.5rem 0;
    padding-inline-start: 0.75rem;
    border-inline-start: 2px solid var(--border);
  }

  figcaption {
    margin-block-end: 0.35rem;
  }

  p {
    margin: 0;
    white-space: pre-wrap;
  }
</style>
