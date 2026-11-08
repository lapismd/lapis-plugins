<script lang="ts">
  import { untrack } from "svelte";
  import type { App, TFile } from "@lapis-notes/api";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";

  let { app, file }: { app: App; file: TFile } = $props();
  let container = $state<HTMLDivElement>();
  let error = $state("");

  $effect(() => {
    if (!container) return;
    const owner = app;
    const source = file;
    const host = container;
    error = "";
    let cancelled = false;
    // Defer invocation so synchronous and asynchronous provider errors share
    // the same fallback and late mounts still get disposed after dismissal.
    const mounted = Promise.resolve().then(() =>
      untrack(() =>
        owner.markdownFileSurfaces.mount({
          containerEl: host,
          file: source,
          editable: false,
          surface: {
            id: "bases-file-link-preview",
            context: { path: source.path },
          },
        }),
      ),
    );
    void mounted.catch((reason) => {
      if (!cancelled)
        error = reason instanceof Error ? reason.message : String(reason);
    });
    return () => {
      cancelled = true;
      void mounted
        .then(
          (surface) => surface.dispose(),
          () => undefined,
        )
        .catch(console.error);
    };
  });
</script>

<section
  aria-label={`Preview of ${file.name}`}
  data-ui-component="bases-file-preview"
>
  <div class="bases-file-preview__title">{file.name}</div>
  <ScrollArea class="bases-file-preview__scroll" orientation="vertical">
    {#if error}<p role="status">Preview unavailable: {error}</p>{/if}
    <div bind:this={container} class="bases-file-preview__surface"></div>
  </ScrollArea>
</section>
